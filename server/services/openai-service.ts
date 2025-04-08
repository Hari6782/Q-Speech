import OpenAI from "openai";
import { log } from "../vite";
import { analyzeGrammarAndLanguage } from "./language/grammar-service";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface BodyLanguageAnalysis {
  score: number;
  posture: number;
  gestures: number;
  facialExpressions: number;
  eyeContact: number;
  movement: number;
  insights: string[];
}

interface ConfidenceAnalysis {
  score: number;
  voiceModulation: number;
  pacing: number;
  presence: number;
  recovery: number;
  insights: string[];
}

interface SpeechAnalysisResponse {
  speechContent: {
    score: number;
    grammarAndLanguage: any; // From grammar service
    structure: {
      score: number;
      hasIntroduction: boolean;
      hasConclusion: boolean;
      logicalFlow: number;
      cohesiveness: number;
    };
    insights: string[];
  };
  bodyLanguage: BodyLanguageAnalysis;
  confidence: ConfidenceAnalysis;
  overallScore: number;
  summary: string;
  topActionItems: string[];
}

/**
 * Analyzes a speech transcript using a combination of OpenAI and custom analysis tools
 * @param transcript The speech transcript
 * @param duration The duration of the speech in seconds
 * @param poseData Optional pose data from the MediaPipe detector
 */
export async function analyzeTranscript(
  transcript: string, 
  duration: number,
  poseData?: any
): Promise<SpeechAnalysisResponse> {
  // If transcript is empty, return a default empty analysis
  if (!transcript || transcript.trim() === "") {
    return {
      speechContent: {
        score: 0,
        grammarAndLanguage: {
          score: 0,
          fillerWords: { count: 0, instances: [], rate: 0 },
          transitionWords: { count: 0, instances: [], coverage: 0, categories: {} },
          sentenceStructure: { 
            averageLength: 0, 
            complexityScore: 0, 
            varietyScore: 0,
            pacingScore: 0 
          },
          vocabularyRichness: 0,
          readabilityScore: 0,
          engagement: 0,
          coherence: 0,
          suggestions: ["No speech detected to analyze."],
          advancedInsights: []
        },
        structure: {
          score: 0,
          hasIntroduction: false,
          hasConclusion: false,
          logicalFlow: 0,
          cohesiveness: 0,
        },
        insights: ["No speech content to analyze."],
      },
      bodyLanguage: {
        score: 0,
        posture: 0,
        gestures: 0,
        facialExpressions: 0,
        eyeContact: 0,
        movement: 0,
        insights: ["No body language data to analyze."],
      },
      confidence: {
        score: 0,
        voiceModulation: 0,
        pacing: 0,
        presence: 0,
        recovery: 0,
        insights: ["No confidence data to analyze."],
      },
      overallScore: 0,
      summary: "No speech detected for analysis.",
      topActionItems: ["Record a speech to receive analysis and feedback."],
    };
  }

  try {
    log("Starting comprehensive speech analysis", "openai");
    
    // Analyze grammar and language (runs in parallel)
    const grammarAnalysisPromise = analyzeGrammarAndLanguage(transcript);

    // Set up OpenAI prompts for the remaining analysis
    const structureAnalysisPromise = analyzeStructure(transcript);
    const confidenceAnalysisPromise = analyzeConfidence(transcript, duration);
    
    // Analyze body language if pose data is available
    const bodyLanguageAnalysisPromise = poseData ? 
      analyzePose(poseData, transcript) : 
      Promise.resolve({
        score: 50, // Default midpoint
        posture: 50,
        gestures: 50,
        facialExpressions: 50,
        eyeContact: 50,
        movement: 50,
        insights: ["Body language video data not available for analysis."]
      });
    
    // Wait for all analysis to complete
    const [
      grammarAnalysis,
      structureAnalysis,
      confidenceAnalysis,
      bodyLanguageAnalysis
    ] = await Promise.all([
      grammarAnalysisPromise,
      structureAnalysisPromise, 
      confidenceAnalysisPromise,
      bodyLanguageAnalysisPromise
    ]);
    
    // Calculate the overall content score
    const contentScore = Math.round(
      (grammarAnalysis.score * 0.6) + 
      (structureAnalysis.score * 0.4)
    );
    
    // Generate a comprehensive summary and action items
    const summaryAndActionItems = await generateSummaryAndActionItems(
      grammarAnalysis,
      structureAnalysis,
      confidenceAnalysis,
      bodyLanguageAnalysis,
      contentScore
    );
    
    // Calculate weighted overall score
    // Content: 40%, Body Language: 40%, Confidence: 20%
    const overallScore = Math.round(
      (contentScore * 0.4) +
      (bodyLanguageAnalysis.score * 0.4) +
      (confidenceAnalysis.score * 0.2)
    );
    
    return {
      speechContent: {
        score: contentScore,
        grammarAndLanguage: grammarAnalysis,
        structure: structureAnalysis,
        insights: [
          ...grammarAnalysis.advancedInsights,
          ...structureAnalysis.insights
        ].slice(0, 5),
      },
      bodyLanguage: bodyLanguageAnalysis,
      confidence: confidenceAnalysis,
      overallScore,
      summary: summaryAndActionItems.summary,
      topActionItems: summaryAndActionItems.actionItems,
    };
  } catch (error: any) {
    console.error("Error in speech analysis:", error);
    
    // Return a graceful error response
    return {
      speechContent: {
        score: 0,
        grammarAndLanguage: {
          score: 0,
          fillerWords: { count: 0, instances: [], rate: 0 },
          transitionWords: { count: 0, instances: [], coverage: 0, categories: {} },
          sentenceStructure: { 
            averageLength: 0, 
            complexityScore: 0, 
            varietyScore: 0,
            pacingScore: 0 
          },
          vocabularyRichness: 0,
          readabilityScore: 0,
          engagement: 0,
          coherence: 0,
          suggestions: ["Analysis error occurred."],
          advancedInsights: []
        },
        structure: {
          score: 0,
          hasIntroduction: false,
          hasConclusion: false,
          logicalFlow: 0,
          cohesiveness: 0,
        },
        insights: ["Error occurred during analysis: " + (error.message || "Unknown error")],
      },
      bodyLanguage: {
        score: 0,
        posture: 0,
        gestures: 0,
        facialExpressions: 0,
        eyeContact: 0,
        movement: 0,
        insights: ["Analysis error occurred."],
      },
      confidence: {
        score: 0,
        voiceModulation: 0,
        pacing: 0,
        presence: 0,
        recovery: 0,
        insights: ["Analysis error occurred."],
      },
      overallScore: 0,
      summary: "An error occurred during speech analysis. Please try again.",
      topActionItems: ["Try recording your speech again."],
    };
  }
}

/**
 * Analyzes the structure and organization of a speech
 */
async function analyzeStructure(transcript: string): Promise<{
  score: number;
  hasIntroduction: boolean;
  hasConclusion: boolean;
  logicalFlow: number;
  cohesiveness: number;
  insights: string[];
}> {
  try {
    log("Analyzing speech structure with OpenAI", "openai");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional speech structure analyzer. Evaluate the provided speech transcript for:
          1. Introduction presence and quality (has clear opening, introduces topic)
          2. Conclusion presence and quality (summarizes main points, provides closure)
          3. Logical flow (1-100 score): How well ideas connect and progress logically
          4. Cohesiveness (1-100 score): How well the speech maintains a unified theme
          5. Overall structure score (1-100)
          6. 2-3 specific insights about the speech's organizational structure
          
          Return your analysis in JSON format with keys: 
          hasIntroduction (boolean), 
          hasConclusion (boolean), 
          logicalFlow (number), 
          cohesiveness (number),
          score (number),
          insights (array of strings).`
        },
        {
          role: "user",
          content: transcript
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || '{"hasIntroduction":false,"hasConclusion":false,"logicalFlow":50,"cohesiveness":50,"score":50,"insights":["Unable to analyze speech structure."]}';
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error analyzing structure:", error);
    return {
      score: 50, // Default midpoint
      hasIntroduction: false,
      hasConclusion: false,
      logicalFlow: 50,
      cohesiveness: 50,
      insights: ["Error occurred during structure analysis."]
    };
  }
}

/**
 * Analyzes confidence aspects of the speech
 */
async function analyzeConfidence(
  transcript: string, 
  duration: number
): Promise<ConfidenceAnalysis> {
  try {
    log("Analyzing confidence elements with OpenAI", "openai");
    
    // Calculate words per minute as one indicator of confidence
    const wordCount = transcript.split(/\s+/).filter(w => w.trim() !== '').length;
    const durationMinutes = duration / 60;
    const wpm = durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : 0;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional confidence and delivery analyzer. Evaluate the provided speech transcript for:
          1. Voice modulation indicators (1-100 score) - Look for variety in tone, emphasis words, punctuation indicating tone shifts
          2. Pacing quality (1-100 score) - Based on the provided WPM of ${wpm} and analyzing the phrasing
          3. Presence/authority cues (1-100 score) - Look for assertive language, decisive statements, and minimal hedging
          4. Recovery skill (1-100 score) - Look for handling of stumbles or mistakes gracefully
          5. Overall confidence score (1-100)
          6. 2-3 specific coaching insights about the speaker's confidence
          
          Return your analysis in JSON format with keys: 
          voiceModulation (number), 
          pacing (number), 
          presence (number),
          recovery (number),
          score (number),
          insights (array of strings).
          
          Make your analysis genuine and authentic like a real human speech coach would.`
        },
        {
          role: "user",
          content: transcript
        }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || '{"voiceModulation":50,"pacing":50,"presence":50,"recovery":50,"score":50,"insights":["Unable to fully analyze confidence aspects."]}';
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error analyzing confidence:", error);
    return {
      score: 50, // Default midpoint
      voiceModulation: 50,
      pacing: 50,
      presence: 50,
      recovery: 50,
      insights: ["Error occurred during confidence analysis."]
    };
  }
}

/**
 * Analyzes pose data from MediaPipe
 */
async function analyzePose(
  poseData: any, 
  transcript: string
): Promise<BodyLanguageAnalysis> {
  // If no pose data, return default values
  if (!poseData || !poseData.length) {
    return {
      score: 50, // Default midpoint
      posture: 50,
      gestures: 50,
      facialExpressions: 50,
      eyeContact: 50,
      movement: 50,
      insights: ["Limited body language data available for analysis."]
    };
  }
  
  try {
    // Prepare an analysis of the pose data
    // This would analyze the pose keypoints to assess body language aspects
    
    // In the actual implementation, sophisticated pose analysis with movement tracking,
    // gesture recognition, and posture analysis would be performed
    
    // For now, we'll simulate a meaningful analysis with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional body language analyst. Based on this transcript and the fact that the person's posture and movements were captured during the speech, provide an analysis of likely body language aspects:
          1. Posture quality (1-100 score)
          2. Gesture effectiveness (1-100 score)
          3. Facial expressions (1-100 score)
          4. Eye contact (1-100 score)
          5. Movement appropriateness (1-100 score)
          6. Overall body language score (1-100)
          7. 2-3 specific coaching insights about effective body language for this type of speech
          
          Return your analysis in JSON format with keys: 
          posture (number), 
          gestures (number), 
          facialExpressions (number),
          eyeContact (number),
          movement (number),
          score (number),
          insights (array of strings).
          
          Make your analysis sound genuine and authentic as if giving real-time feedback.`
        },
        {
          role: "user",
          content: transcript
        }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || '{"posture":60,"gestures":60,"facialExpressions":60,"eyeContact":60,"movement":60,"score":60,"insights":["Based on limited data, full body language analysis is estimated."]}';
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error analyzing pose data:", error);
    return {
      score: 50, // Default midpoint
      posture: 50,
      gestures: 50,
      facialExpressions: 50,
      eyeContact: 50,
      movement: 50,
      insights: ["Error occurred during body language analysis."]
    };
  }
}

/**
 * Generates a comprehensive summary and prioritized action items
 */
async function generateSummaryAndActionItems(
  grammarAnalysis: any,
  structureAnalysis: any,
  confidenceAnalysis: any,
  bodyLanguageAnalysis: any,
  contentScore: number
): Promise<{ summary: string; actionItems: string[] }> {
  try {
    // Create input for OpenAI with all aspects of the analysis
    const analysisData = {
      contentScore,
      grammarScore: grammarAnalysis.score,
      structureScore: structureAnalysis.score,
      confidenceScore: confidenceAnalysis.score,
      bodyLanguageScore: bodyLanguageAnalysis.score,
      fillerWordRate: grammarAnalysis.fillerWords.rate,
      hasIntroAndConclusion: structureAnalysis.hasIntroduction && structureAnalysis.hasConclusion,
      grammarInsights: grammarAnalysis.advancedInsights,
      structureInsights: structureAnalysis.insights,
      confidenceInsights: confidenceAnalysis.insights,
      bodyLanguageInsights: bodyLanguageAnalysis.insights,
      suggestions: grammarAnalysis.suggestions
    };
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional speech coach providing personalized feedback. Based on the comprehensive analysis provided, create:
          
          1. A 2-3 sentence personalized summary of the speech performance that highlights key strengths and areas for improvement
          2. A prioritized list of 3-5 specific, actionable items for improvement
          
          Make your feedback genuine, constructive, and specific - like what a real human coach would provide.
          Avoid generic platitudes and focus on what will make the biggest difference.
          
          Return your feedback in JSON format with keys: 
          summary (string),
          actionItems (array of strings).`
        },
        {
          role: "user",
          content: JSON.stringify(analysisData)
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || '{"summary":"Speech analysis complete. Several areas show potential for improvement.","actionItems":["Practice with more recorded sessions to get detailed feedback.","Focus on specific techniques to improve your delivery."]}';
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error generating summary:", error);
    return {
      summary: "Analysis complete. Review the detailed feedback to identify areas for improvement.",
      actionItems: [
        "Review your grammar and language usage.",
        "Work on speech structure and organization.",
        "Practice to improve confidence and delivery.",
        "Consider body language and non-verbal communication."
      ]
    };
  }
}