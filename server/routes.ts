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
    // Basic statistics
    const words = transcript.split(/\s+/).filter(word => word.trim().length > 0);
    const wordCount = words.length;
    const wordsPerMinute = wordCount / (duration / 60);
    
    // Count filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'basically', 'actually', 'literally'];
    const fillerCount = fillerWords.reduce((count, filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = transcript.match(regex) || [];
      return count + matches.length;
    }, 0);
    
    // Calculate sentences
    const sentences = transcript.split(/[.!?]+/).filter(Boolean);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
    
    // Calculate pose metrics if available
    let posture = 70;
    let gestures = 65;
    let movement = 75;
    
    if (poseData) {
      posture = poseData.posture || posture;
      gestures = poseData.gestures || gestures;
      movement = poseData.movement || movement;
    }
    
    // Calculate speech score
    const speechScore = Math.min(100, Math.max(0, 
      // Base score
      70
      // Word count penalty if very low
      + (wordCount < 20 ? -15 : wordCount > 100 ? 10 : 0)
      // Words per minute penalty if too fast/slow
      + (wordsPerMinute < 100 ? -5 : (wordsPerMinute > 180 ? -10 : 5))
      // Filler words penalty
      - (fillerCount * 2)
      // Sentence length bonus/penalty
      + (avgSentenceLength > 5 && avgSentenceLength < 20 ? 5 : -5)
    ));
    
    // Create grammar analysis feedback
    let grammarFeedback = 'Your speech was analyzed with our basic analytics system.';
    
    if (wordCount < 20) {
      grammarFeedback += ' Your speech was quite short, which makes detailed analysis difficult. Try speaking for at least 30 seconds for a more thorough evaluation.';
    } else {
      if (wordsPerMinute > 180) {
        grammarFeedback += ' Your speaking pace was quite fast. Consider slowing down to improve clarity and comprehension.';
      } else if (wordsPerMinute < 100) {
        grammarFeedback += ' Your speaking pace was somewhat slow. A slightly faster pace might help maintain audience engagement.';
      } else {
        grammarFeedback += ' Your speaking pace was good, making it easy for listeners to follow along.';
      }
      
      if (fillerCount > 5) {
        grammarFeedback += ` You used filler words like "um" and "uh" ${fillerCount} times. Reducing these would make your speech sound more polished.`;
      } else if (fillerCount > 0) {
        grammarFeedback += ' You used a few filler words, but not enough to significantly impact your speech quality.';
      } else {
        grammarFeedback += ' You did a great job avoiding filler words, which made your speech sound more professional.';
      }
    }
    
    // Create body language feedback
    let bodyLanguageFeedback = 'Based on the video analysis';
    
    if (posture > 80) {
      bodyLanguageFeedback += ', your posture was excellent, which conveys confidence and authority.';
    } else if (posture > 60) {
      bodyLanguageFeedback += ', your posture was generally good but could be improved for a more commanding presence.';
    } else {
      bodyLanguageFeedback += ', improving your posture would significantly enhance your speaking presence.';
    }
    
    if (gestures > 80) {
      bodyLanguageFeedback += ' Your use of gestures was natural and effective in emphasizing key points.';
    } else if (gestures > 60) {
      bodyLanguageFeedback += ' Consider using more purposeful hand gestures to emphasize important points.';
    } else {
      bodyLanguageFeedback += ' Adding more hand gestures would help engage your audience and highlight key points.';
    }
    
    // Create confidence feedback
    let confidenceFeedback = 'In terms of confidence, ';
    if (posture > 70 && wordsPerMinute > 120) {
      confidenceFeedback += 'you presented with a good level of energy and assurance.';
    } else if (posture > 60 || wordsPerMinute > 110) {
      confidenceFeedback += 'you showed moderate confidence, but there\'s room for improvement.';
    } else {
      confidenceFeedback += 'working on your speaking confidence would make your presentation more impactful.';
    }
    
    // Create detailed, specific suggestions
    const suggestions = [];
    
    if (wordCount < 50) {
      suggestions.push('Before your next practice, create a detailed outline with 3-5 main points and supporting evidence to develop your ideas more fully.');
    }
    
    if (wordsPerMinute > 180) {
      suggestions.push('Practice the "slow breath" technique: take a deep breath between sentences to naturally slow your pace and improve clarity.');
    } else if (wordsPerMinute < 100) {
      suggestions.push('Try marking your speech notes with "speed up" reminders at specific points to maintain audience engagement.');
    }
    
    if (fillerCount > 5) {
      suggestions.push('Record yourself on your phone for 2 minutes and count your filler words. Then practice the same content again, replacing each filler with a deliberate pause.');
    }
    
    if (posture < 70) {
      suggestions.push('Practice speaking in front of a mirror for 5 minutes daily with shoulders back and spine straight to build muscle memory for confident posture.');
    }
    
    if (gestures < 70) {
      suggestions.push('Plan 3-5 specific hand gestures that match key points in your next speech to emphasize important concepts naturally.');
    }
    
    suggestions.push('Schedule three 10-minute practice sessions this week, focusing on one specific skill (pace, gestures, or structure) in each session.');
    
    // Create the analysis object structure that matches the OpenAI version
    return {
      speechContent: {
        score: speechScore,
        grammarAndLanguage: {
          score: speechScore,
          fillerWords: {
            count: fillerCount,
            rate: (fillerCount / wordCount) * 100
          },
          vocabularyRichness: 65,
          readabilityScore: 70,
          sentenceStructure: {
            averageLength: avgSentenceLength,
            varietyScore: 65
          }
        },
        structure: {
          score: 65,
          hasIntroduction: wordCount > 30,
          hasConclusion: wordCount > 50,
          logicalFlow: 70,
          cohesiveness: 70
        },
        insights: [grammarFeedback]
      },
      bodyLanguage: {
        score: (posture + gestures + movement) / 3,
        posture: posture,
        gestures: gestures,
        movement: movement,
        facialExpressions: 70,
        eyeContact: 75,
        insights: [bodyLanguageFeedback]
      },
      confidence: {
        score: (posture + 70 + 75) / 3, // Average of posture, voice modulation, and presence
        voiceModulation: 70,
        pacing: wordsPerMinute > 120 ? 75 : 65,
        presence: 75,
        recovery: 80,
        insights: [confidenceFeedback]
      },
      overallScore: (speechScore * 0.4) + ((posture + gestures + movement) / 3 * 0.4) + (75 * 0.2),
      summary: "Speech analysis complete. Your delivery showed some strengths and areas for improvement.",
      topActionItems: suggestions
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
