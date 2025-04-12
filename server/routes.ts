import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginUserSchema, insertUserSchema } from "@shared/schema";
import { log } from "./vite";
import { analyzeTranscript } from "./services/openai-service";
import { transcribeAudio, analyzeDelivery } from "./services/speech/whisper-service";
import { analyzeGrammarAndLanguage } from "./services/language/grammar-service";
import { analyzeTranscriptWithGemini } from "./services/gemini-service";
import { setupAuth } from "./auth";

// Define interface for OpenAI errors to handle quota limits
interface OpenAIError {
  status?: number;
  message?: string;
  error?: {
    type?: string;
    code?: string;
  };
  code?: string;
}

// Define interface for Gemini errors to handle quota limits
interface GeminiError {
  status?: number;
  message?: string;
  code?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with "Remember Me" functionality
  setupAuth(app);

  // Get user profile endpoint
  app.get("/api/user/profile", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated" 
      });
    }
    
    // Return user data without password
    const user = req.user;
    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt || new Date().toISOString()
    });
  });
  
  // Speech Session API endpoints
  
  // Get user's speech sessions
  app.get("/api/speech-sessions", async (req, res) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }
      
      // Get the current user's sessions
      const sessions = await storage.getUserSpeechSessions(req.user.id);
      
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
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }
      
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
      
      // Verify the session belongs to the current user
      if (session.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to access this session"
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
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }
      
      // Add the user ID to the session data
      const sessionData = {
        ...req.body,
        userId: req.user.id
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
  
  // Analyze speech transcript - primarily using Gemini AI
  app.post("/api/analyze-speech", async (req, res) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }
      
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
      
      log(`Analyzing speech transcript with Gemini (${transcript.length} chars, ${duration}s)`, "server");
      
      try {
        // Use Gemini API as the primary analysis provider
        const geminiAnalysis = await analyzeTranscriptWithGemini(transcript, duration, poseData);
            
        return res.status(200).json({ 
          success: true, 
          analysis: geminiAnalysis,
          provider: "gemini" 
        });
      } catch (geminiError) {
        const error = geminiError as GeminiError;
        console.error("Gemini API error:", error);
        
        // If Gemini fails, fall back to basic analysis without trying OpenAI
        log("Gemini API failed, using basic fallback analysis", "server");
        const basicFallbackAnalysis = generateFallbackAnalysis(transcript, duration, poseData);
        
        return res.status(200).json({ 
          success: true, 
          analysis: basicFallbackAnalysis,
          provider: "fallback"
        });
      }
    } catch (error) {
      console.error("Error analyzing speech:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to perform AI analysis at this time",
        error: "Error occurred during structure analysis"
      });
    }
  });
  
  // Fallback analysis function that doesn't require OpenAI
  function generateFallbackAnalysis(transcript: string, duration: number, poseData: any) {
    // Basic statistics with improved word counting
    const words = transcript.split(/\s+/).filter(word => word.trim().length > 0);
    const wordCount = words.length;
    const wordsPerMinute = wordCount / (duration / 60);
    
    // Enhanced filler word detection with more patterns
    const fillerWords = [
      'um', 'uh', 'like', 'you know', 'so', 'basically', 'actually', 'literally',
      'kind of', 'sort of', 'I mean', 'well', 'right', 'okay', 'anyway', 'anyways',
      'just', 'really', 'very', 'totally', 'completely', 'absolutely', 'definitely',
      'probably', 'maybe', 'perhaps', 'I think', 'I guess', 'I suppose'
    ];
    
    const fillerCount = fillerWords.reduce((count, filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = transcript.match(regex) || [];
      return count + matches.length;
    }, 0);
    
    // Improved sentence analysis
    const sentences = transcript.split(/[.!?]+/).filter(Boolean);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
    
    // Calculate speech score with enhanced metrics
    const speechScore = Math.min(100, Math.max(0, 
      // Base score
      70
      // Word count penalty if very low
      + (wordCount < 20 ? -15 : wordCount > 100 ? 10 : 0)
      // Words per minute penalty if too fast/slow
      + (wordsPerMinute < 100 ? -5 : (wordsPerMinute > 180 ? -10 : 5))
      // Filler words penalty with diminishing returns
      - Math.min(fillerCount * 2, 20)
      // Sentence length bonus/penalty
      + (avgSentenceLength > 5 && avgSentenceLength < 20 ? 5 : -5)
      // Bonus for longer speeches
      + (wordCount > 200 ? 5 : 0)
    ));
    
    // Calculate pose metrics if available
    let posture = 70;
    let gestures = 65;
    let movement = 75;
    
    if (poseData) {
      posture = poseData.posture || posture;
      gestures = poseData.gestures || gestures;
      movement = poseData.movement || movement;
    }
    
    // Generate specific feedback based on metrics
    const speechFeedback = [
      wordsPerMinute > 180 ? 'You speak quite fast. Consider slowing down for better clarity.' : null,
      wordsPerMinute < 100 ? 'Your speaking pace is a bit slow. Try to maintain a more engaging rhythm.' : null,
      fillerCount > 5 ? `You used ${fillerCount} filler words. Try to reduce these for a more professional delivery.` : null,
      avgSentenceLength > 20 ? 'Your sentences are quite long. Consider breaking them up for better clarity.' : null,
      avgSentenceLength < 5 && sentences.length > 3 ? 'Try using more complex sentence structures to sound more natural.' : null,
      wordCount < 50 ? 'Your speech was quite short. Consider elaborating more on your points.' : null,
    ].filter(Boolean).join(' ');
    
    return {
      speechContent: {
        score: speechScore,
        grammarAndLanguage: {
          score: speechScore,
          fillerWords: { count: fillerCount, instances: [], rate: fillerCount / wordCount },
          transitionWords: { count: 0, instances: [], coverage: 0, categories: {} },
          sentenceStructure: { 
            averageLength: avgSentenceLength, 
            complexityScore: 0, 
            varietyScore: 0,
            pacingScore: 0 
          },
          vocabularyRichness: 0,
          readabilityScore: 0,
          engagement: 0,
          coherence: 0,
          suggestions: [speechFeedback],
          advancedInsights: []
        },
        structure: {
          score: 70,
          hasIntroduction: false,
          hasConclusion: false,
          logicalFlow: 0,
          cohesiveness: 0,
        },
        insights: [speechFeedback],
      },
      bodyLanguage: {
        score: (posture + gestures + movement) / 3,
        posture,
        gestures,
        facialExpressions: 70,
        eyeContact: 70,
        movement,
        insights: ["Body language analysis based on available data."],
      },
      confidence: {
        score: Math.min(100, Math.max(0, 
          // Base score
          70
          // Speaking rate impact
          + (wordsPerMinute > 180 ? -10 : wordsPerMinute < 100 ? -5 : 5)
          // Filler words impact
          - Math.min(fillerCount, 10)
        )),
        voiceModulation: 70,
        pacing: Math.min(100, Math.max(0, 70 + (wordsPerMinute > 180 ? -10 : wordsPerMinute < 100 ? -5 : 5))),
        presence: 70,
        recovery: 70,
        insights: ["Confidence assessment based on speaking metrics."],
      },
      overallScore: Math.round(
        (speechScore * 0.4) +
        ((posture + gestures + movement) / 3 * 0.4) +
        (70 * 0.2)
      ),
      summary: "Basic analysis completed with available metrics.",
      topActionItems: [
        'Practice speaking in front of a mirror for 5 minutes daily to improve your posture and eye contact',
        'Record your next practice session on your phone and note moments when you use filler words',
        'Before your next speech, write a clear outline with an introduction that states your main point in the first 30 seconds',
        'Try the "pause technique" - replace filler words with deliberate 1-2 second pauses to seem more confident',
        'Practice varying your speaking pace to emphasize important points and maintain audience engagement'
      ],
    };
  }

  // Transcribe audio with Whisper API
  app.post("/api/transcribe-audio", async (req, res) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }
      
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
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }
      
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
