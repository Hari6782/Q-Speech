import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginUserSchema, insertUserSchema } from "@shared/schema";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  app.post("/api/login", async (req, res) => {
    try {
      // Validate the request body against the schema
      const validatedData = loginUserSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // In a real production app, we would compare hashed passwords
      // For this demo, we'll do a simple string comparison
      if (user.password !== validatedData.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Return success
      return res.status(200).json({ 
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(400).json({ 
        message: "Invalid login data" 
      });
    }
  });

  // Registration route
  app.post("/api/register", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already in use" });
      }
      
      // In a real app, we would hash the password before storing
      // For this demo, we'll store it as-is
      const newUser = await storage.createUser(validatedData);
      
      log(`User created: ${newUser.username}`, "server");
      
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(400).json({
        message: "Invalid registration data"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
