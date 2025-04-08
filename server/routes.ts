import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginUserSchema, insertUserSchema } from "@shared/schema";
import { log } from "./vite";
import { analyzeTranscript } from "./services/openai-service";
import { transcribeAudio, analyzeDelivery } from "./services/speech/whisper-service";
import { analyzeGrammarAndLanguage } from "./services/language/grammar-service";

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

  // Get user profile endpoint
  app.get("/api/user/profile", async (req, res) => {
    try {
      // Get user ID from session (in a real app with authentication)
      // For demo purposes, we'll return the last registered user
      // In a real app, you would use req.session.userId or similar
      
      // Get users from storage (in a real app, this would be more efficient)
      const users = await storage.getAllUsers();
      
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: "No users found" 
        });
      }
      
      // Get the most recently created user for demo
      const currentUser = users[users.length - 1];
      
      // Return user data without password
      return res.status(200).json({
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        createdAt: currentUser.createdAt || new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while retrieving profile"
      });
    }
  });
  
  // Speech Session API endpoints
  
  // Get user's speech sessions
  app.get("/api/speech-sessions", async (req, res) => {
    try {
      // For demo purposes, we'll use the most recent user
      const users = await storage.getAllUsers();
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No users found"
        });
      }
      
      const currentUser = users[users.length - 1];
      const sessions = await storage.getUserSpeechSessions(currentUser.id);
      
      return res.status(200).json({
        success: true,
        sessions
      });
    } catch (error) {
      console.error("Error fetching speech sessions:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while retrieving speech sessions"
      });
    }
  });
  
  // Get a specific speech session
  app.get("/api/speech-sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID"
        });
      }
      
      const session = await storage.getSpeechSession(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Speech session not found"
        });
      }
      
      return res.status(200).json({
        success: true,
        session
      });
    } catch (error) {
      console.error("Error fetching speech session:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while retrieving speech session"
      });
    }
  });
  
  // Create a new speech session
  app.post("/api/speech-sessions", async (req, res) => {
    try {
      // For demo purposes, we'll use the most recent user
      const users = await storage.getAllUsers();
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No users found"
        });
      }
      
      const currentUser = users[users.length - 1];
      
      // Add the user ID to the session data
      const sessionData = {
        ...req.body,
        userId: currentUser.id
      };
      
      const newSession = await storage.createSpeechSession(sessionData);
      
      return res.status(201).json({
        success: true,
        message: "Speech session created successfully",
        session: newSession
      });
    } catch (error) {
      console.error("Error creating speech session:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while creating speech session"
      });
    }
  });
  
  // Analyze speech transcript with OpenAI
  app.post("/api/analyze-speech", async (req, res) => {
    try {
      const { transcript, duration, poseData } = req.body;
      
      if (!transcript || typeof transcript !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Transcript is required and must be a string"
        });
      }
      
      if (!duration || typeof duration !== 'number' || duration <= 0) {
        return res.status(400).json({
          success: false,
          message: "Duration is required and must be a positive number"
        });
      }
      
      log(`Analyzing speech transcript (${transcript.length} chars, ${duration}s)`, "server");
      
      // Use comprehensive analysis service
      const analysis = await analyzeTranscript(transcript, duration, poseData);
      
      return res.status(200).json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error("Error analyzing speech:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while analyzing speech"
      });
    }
  });

  // Transcribe audio with Whisper API
  app.post("/api/transcribe-audio", async (req, res) => {
    try {
      if (!req.body || !req.body.audio) {
        return res.status(400).json({
          success: false,
          message: "Audio data is required"
        });
      }
      
      // Extract base64 audio data and convert to buffer
      const base64Audio = req.body.audio.replace(/^data:audio\/\w+;base64,/, "");
      const audioBuffer = Buffer.from(base64Audio, 'base64');
      const audioFormat = req.body.format || "mp3";
      
      log(`Transcribing audio data (${audioBuffer.length} bytes)`, "server");
      
      // Use Whisper to transcribe the audio
      const transcription = await transcribeAudio(audioBuffer, audioFormat);
      
      // If we have segments, analyze the delivery (pace, clarity, etc.)
      let deliveryAnalysis = null;
      if (transcription.segments && transcription.segments.length > 0) {
        deliveryAnalysis = analyzeDelivery(transcription.segments);
      }
      
      return res.status(200).json({
        success: true,
        transcription: transcription.text,
        segments: transcription.segments,
        language: transcription.language,
        delivery: deliveryAnalysis
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while transcribing audio"
      });
    }
  });
  
  // Analyze grammar and language separately
  app.post("/api/analyze-grammar", async (req, res) => {
    try {
      const { transcript } = req.body;
      
      if (!transcript || typeof transcript !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Transcript is required and must be a string"
        });
      }
      
      log(`Analyzing grammar for text (${transcript.length} chars)`, "server");
      
      // Use language analysis service
      const analysis = await analyzeGrammarAndLanguage(transcript);
      
      return res.status(200).json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error("Error analyzing grammar:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while analyzing grammar"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
