import { users, speechSessions, type User, type InsertUser, type SpeechSession, type InsertSpeechSession } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

// configure session store
const PostgresSessionStore = connectPg(session);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Speech session methods
  createSpeechSession(session: InsertSpeechSession): Promise<SpeechSession>;
  getSpeechSession(id: number): Promise<SpeechSession | undefined>;
  getUserSpeechSessions(userId: number): Promise<SpeechSession[]>;
  getRecentSpeechSessions(limit?: number): Promise<SpeechSession[]>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  constructor() {
    // Initialize session store
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      },
      createTableIfMissing: true,
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Speech session methods
  async createSpeechSession(session: InsertSpeechSession): Promise<SpeechSession> {
    const [result] = await db
      .insert(speechSessions)
      .values(session)
      .returning();
    return result;
  }
  
  async getSpeechSession(id: number): Promise<SpeechSession | undefined> {
    const [session] = await db
      .select()
      .from(speechSessions)
      .where(eq(speechSessions.id, id));
    return session || undefined;
  }
  
  async getUserSpeechSessions(userId: number): Promise<SpeechSession[]> {
    return await db
      .select()
      .from(speechSessions)
      .where(eq(speechSessions.userId, userId))
      .orderBy(desc(speechSessions.createdAt));
  }
  
  async getRecentSpeechSessions(limit: number = 10): Promise<SpeechSession[]> {
    return await db
      .select()
      .from(speechSessions)
      .orderBy(desc(speechSessions.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
