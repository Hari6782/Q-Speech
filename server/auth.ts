import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);
const scryptAsync = promisify(scrypt);

// 30 days in milliseconds for "remember me" sessions
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Session store using PostgreSQL
  const sessionStore = new PostgresSessionStore({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    },
    createTableIfMissing: true,
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "q-speech-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day by default
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport with local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req: Request, email: string, password: string, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          }
          
          // If remember me is checked, extend session expiration
          if (req.body.rememberMe) {
            req.session.cookie.maxAge = THIRTY_DAYS;
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register API route
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, username, password } = req.body;
      
      // Check if user already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
      });
      
      // Auto-login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Set remember me if requested
        if (req.body.rememberMe) {
          req.session.cookie.maxAge = THIRTY_DAYS;
        }
        
        return res.status(201).json({
          id: user.id,
          email: user.email,
          username: user.username,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Error creating account" });
    }
  });

  // Login API route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.login(user, (loginErr: Error | null) => {
        if (loginErr) return next(loginErr);
        
        // Remember me functionality is handled in the strategy
        
        return res.status(200).json({
          id: user.id,
          email: user.email,
          username: user.username,
        });
      });
    })(req, res, next);
  });

  // Logout API route
  app.post("/api/logout", (req, res, next) => {
    req.logout((logoutErr: Error | null) => {
      if (logoutErr) return next(logoutErr);
      req.session.destroy((destroyErr: Error | null) => {
        if (destroyErr) return next(destroyErr);
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // Get current user API route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user;
    return res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  });
}