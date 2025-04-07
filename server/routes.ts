import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  app.post("/api/login", async (req, res) => {
    try {
      // Validate the request body against the schema
      const validatedData = loginUserSchema.parse(req.body);
      
      // In a real app, we would verify the user credentials, but for this demo
      // we'll just check if a user with the email exists
      const user = await storage.getUserByEmail(validatedData.email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // In a real app, we would verify the password here
      // For now, we'll just simulate a successful login
      
      // Return success
      return res.status(200).json({ 
        success: true,
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(400).json({ 
        message: "Invalid login data" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
