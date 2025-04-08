/**
 * Advanced grammar and language analysis service using AI-powered NLP techniques
 * Combines rule-based analysis with advanced OpenAI language model insights
 */

import OpenAI from "openai";
import { log } from "../../vite";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Advanced filler words patterns with context awareness
const FILLER_PATTERNS = [
  // Common filler words
  '\\b(um|uh|er|ah|hmm|like|you\\s+know|basically|actually|literally|anyway|so|right|well)\\b',
  // Hedge phrases
  '\\b(sort\\s+of|kind\\s+of|type\\s+of|i\\s+guess|i\\s+think|i\\s+mean|i\\s+suppose)\\b',
  // Unnecessary qualifiers
  '\\b(just|very|really|quite|pretty|fairly|extremely|totally|absolutely|definitely)\\b'
];

// Transition patterns that indicate logical flow and structure
const TRANSITION_CATEGORIES = {
  addition: [
    'additionally', 'furthermore', 'moreover', 'also', 'besides', 'in addition', 'as well as'
  ],
  contrast: [
    'however', 'nevertheless', 'although', 'whereas', 'despite', 'instead', 'otherwise', 'unlike', 'regardless'
  ],
  cause: [
    'therefore', 'consequently', 'thus', 'hence', 'as a result', 'because', 'since', 'due to'
  ],
  sequence: [
    'first', 'second', 'third', 'finally', 'initially', 'lastly', 'next', 'meanwhile', 'subsequently'
  ],
  summary: [
    'in conclusion', 'to summarize', 'in summary', 'in short', 'to conclude', 'overall', 'to sum up'
  ]
};

// Low-information content phrases - these add little semantic value
const LOW_CONTENT_PHRASES = [
  'at the end of the day', 'when all is said and done', 'needless to say', 'for what it\'s worth',
  'to be honest', 'if you will', 'if you know what i mean', 'as a matter of fact'
];

interface GrammarAnalysisResult {
  score: number;
  fillerWords: {
    count: number;
    instances: string[];
    rate: number; // Percentage of total words
  };
  transitionWords: {
    count: number;
    instances: string[];
    coverage: number; // How well transitions cover major points
    categories: Record<string, number>; // Distribution across categories
  };
  sentenceStructure: {
    averageLength: number;
    complexityScore: number; 
    varietyScore: number;
    pacingScore: number; // How well sentence lengths are varied for rhetorical effect
  };
  vocabularyRichness: number; // Lexical diversity measure
  readabilityScore: number; // Derived from multiple factors
  engagement: number; // Estimated listener engagement based on content
  coherence: number; // How well ideas connect and flow
  suggestions: string[];
  advancedInsights: string[]; // AI-generated specific insights
}

/**
 * Performs comprehensive language analysis combining rule-based techniques and AI
 * @param transcript The speech transcript to analyze
 */
export async function analyzeGrammarAndLanguage(transcript: string): Promise<GrammarAnalysisResult> {
  // Handle empty transcripts
  if (!transcript || transcript.trim() === '') {
    return {
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
      suggestions: ['No speech detected to analyze.'],
      advancedInsights: []
    };
  }

  // Normalize transcript
  const normalizedText = transcript.trim();
  
  // Split into sentences using more advanced regex that handles abbreviations better
  const sentences = normalizedText
    .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
    .split("|")
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // Word tokenization with better handling of contractions and punctuation
  const words = normalizedText
    .replace(/[^\w\s']|_/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(w => w.trim() !== '');
  
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  
  // Calculate vocabulary richness using advanced MTLD (Measure of Textual Lexical Diversity)
  // Simplified implementation, real MTLD is more complex
  const vocabularyRichness = calculateMTLD(words);
  
  // Find filler words and phrases using regex patterns
  const fillerInstances: string[] = [];
  let fillerCount = 0;
  
  FILLER_PATTERNS.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    let match;
    while ((match = regex.exec(normalizedText)) !== null) {
      fillerCount++;
      fillerInstances.push(match[0]);
    }
  });
  
  // Find transition words/phrases with categorization
  const transitionInstances: string[] = [];
  let transitionCount = 0;
  const transitionCategories: Record<string, number> = {};
  
  Object.entries(TRANSITION_CATEGORIES).forEach(([category, terms]) => {
    transitionCategories[category] = 0;
    
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = normalizedText.match(regex);
      
      if (matches) {
        transitionCount += matches.length;
        transitionInstances.push(...matches);
        transitionCategories[category] += matches.length;
      }
    });
  });
  
  // Advanced sentence structure analysis
  const sentenceLengths = sentences.map(s => {
    const cleaned = s.replace(/[^\w\s']|_/g, " ").replace(/\s+/g, " ").trim();
    return cleaned.split(" ").filter(w => w.trim() !== '').length;
  });
  
  const averageSentenceLength = sentenceLengths.length > 0 ? 
    sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length : 0;
  
  // Calculate sentence complexity using multiple factors
  let totalComplexity = 0;
  
  sentences.forEach(sentence => {
    let complexity = 0;
    
    // Count subordinating conjunctions (indicates complex sentences)
    const subordinators = ['although', 'because', 'since', 'unless', 'while', 'whereas', 'if', 'when', 'before', 'after', 'until', 'once'];
    subordinators.forEach(sub => {
      const regex = new RegExp(`\\b${sub}\\b`, 'gi');
      complexity += (sentence.match(regex) || []).length * 2;
    });
    
    // Count commas (often indicates clauses)
    complexity += (sentence.match(/,/g) || []).length;
    
    // Count semicolons (advanced punctuation)
    complexity += (sentence.match(/;/g) || []).length * 3;
    
    // Count advanced structures like parentheticals
    complexity += (sentence.match(/\(.*?\)/g) || []).length * 2;
    
    // Count colons (explanation, elaboration)
    complexity += (sentence.match(/:/g) || []).length * 2;
    
    totalComplexity += complexity;
  });
  
  const complexityScore = sentences.length > 0 ? 
    Math.min((totalComplexity / sentences.length) * 10, 100) : 0;
  
  // Calculate sentence variety score using statistical measures
  let varietyScore = 0;
  if (sentenceLengths.length > 2) {
    const mean = averageSentenceLength;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize to a 0-100 score
    // Higher standard deviation = more variety
    varietyScore = Math.min(stdDev * 5, 100);
  }
  
  // Calculate pacing score - how well sentence lengths are varied for rhetorical effect
  // Look for patterns like short sentences followed by long ones, or declining lengths for emphasis
  let pacingScore = 50; // Default moderate score
  
  if (sentenceLengths.length > 3) {
    // Check for purposeful patterns - short followed by long (buildup) or long followed by short (punch)
    let patternCount = 0;
    
    for (let i = 0; i < sentenceLengths.length - 1; i++) {
      const current = sentenceLengths[i];
      const next = sentenceLengths[i + 1];
      
      // Pattern: very short sentence followed by longer one
      if (current < 5 && next > current * 2) {
        patternCount++;
      }
      
      // Pattern: long sentence followed by punch (short sentence)
      if (current > 15 && next < 8) {
        patternCount++;
      }
    }
    
    const patternDensity = patternCount / sentenceLengths.length;
    pacingScore = Math.min(50 + (patternDensity * 100), 100);
  }
  
  // Use AI to generate advanced insights using OpenAI
  let aiInsights: string[] = [];
  let coherenceScore = 50; // Default moderate score
  let engagementScore = 50; // Default moderate score
  let readabilityScore = 50; // Default moderate score
  
  try {
    // Only perform AI analysis if there's substantial content
    if (words.length > 20) {
      log("Requesting AI analysis of transcript", "grammar");
      
      const openaiResponse = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a professional speech and communication analyst. Evaluate the provided speech transcript for:
            1. Coherence (1-100): How well the ideas connect and flow logically
            2. Engagement (1-100): How engaging and interesting the content is
            3. Readability (1-100): How easy the language is to understand
            4. List 2-4 specific detailed insights about the speech's language patterns
            
            Return your analysis in JSON format with keys: 
            coherence (number), 
            engagement (number), 
            readability (number), 
            insights (array of strings).
            
            Make your analysis as authentic as a real human speech coach would.`
          },
          {
            role: "user",
            content: transcript
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      });
      
      const content = openaiResponse.choices[0].message.content || '{"coherence":50,"engagement":50,"readability":50,"insights":["Unable to analyze speech."]}';
      const aiAnalysis = JSON.parse(content);
      
      // Extract scores and insights
      coherenceScore = aiAnalysis.coherence;
      engagementScore = aiAnalysis.engagement;
      readabilityScore = aiAnalysis.readability;
      aiInsights = aiAnalysis.insights;
    }
  } catch (error: any) {
    console.error("Error during AI analysis:", error);
    aiInsights = ["Unable to perform advanced AI analysis at this time."];
  }

  // Combine rule-based and AI analysis to generate suggestions
  const suggestions: string[] = [];
  
  // Filler word suggestions
  const fillerRate = words.length > 0 ? fillerCount / words.length : 0;
  if (fillerRate > 0.05) {
    suggestions.push(`You used filler words like "${fillerInstances.slice(0, 3).join('", "')}" frequently (${Math.round(fillerRate * 100)}% of your words). Try to reduce these for more confident delivery.`);
  }
  
  // Transition word suggestions
  if (sentences.length > 3) {
    const transitionDensity = transitionCount / sentences.length;
    
    if (transitionDensity < 0.15) {
      suggestions.push("Your speech could use more transition words to connect ideas and improve flow.");
    }
    
    // Check for balance in transition types
    const categories = Object.keys(transitionCategories);
    const usedCategories = categories.filter(cat => transitionCategories[cat] > 0);
    
    if (usedCategories.length < categories.length / 2 && sentences.length > 5) {
      const missingTypes = categories
        .filter(cat => transitionCategories[cat] === 0)
        .slice(0, 2)
        .join(" and ");
      
      suggestions.push(`Try incorporating ${missingTypes} transitions to better structure your speech.`);
    }
  }
  
  // Sentence structure suggestions
  if (averageSentenceLength > 25 && sentences.length > 2) {
    suggestions.push("Your sentences are quite long. Consider breaking some into shorter ones for better clarity.");
  } else if (averageSentenceLength < 8 && sentences.length > 3) {
    suggestions.push("Your sentences are very short. Try combining some ideas for better flow and variety.");
  }
  
  if (varietyScore < 40 && sentences.length > 4) {
    suggestions.push("Try varying your sentence structure more for a more engaging delivery.");
  }
  
  if (vocabularyRichness < 0.6 && words.length > 50) {
    suggestions.push("Consider using more diverse vocabulary to express your ideas more precisely.");
  }
  
  // Calculate overall score using a weighted combination of metrics
  // This advanced scoring algorithm uses multiple factors:
  const grammarWeights = {
    fillerPenalty: 0.15,
    transitionBonus: 0.15,
    complexity: 0.10,
    variety: 0.10,
    pacing: 0.10,
    vocabulary: 0.10,
    coherence: 0.15,
    engagement: 0.10,
    readability: 0.05
  };
  
  const fillerPenalty = Math.min(fillerRate * 100 * 2, 100);
  const transitionBonus = Math.min((transitionCount / Math.max(1, sentences.length)) * 30, 100);
  
  // Calculate normalized scores for each component (0-100)
  const scores = {
    fillerScore: 100 - fillerPenalty,
    transitionScore: transitionBonus,
    complexityScore,
    varietyScore,
    pacingScore,
    vocabularyScore: vocabularyRichness * 100, // Convert to 0-100 scale
    coherenceScore,
    engagementScore,
    readabilityScore
  };
  
  // Calculate weighted score
  let finalScore = 0;
  Object.entries(grammarWeights).forEach(([key, weight]) => {
    const scoreKey = key.replace('Penalty', 'Score').replace('Bonus', 'Score');
    // Type-safe access to scores
    if (scoreKey === 'fillerScore') finalScore += scores.fillerScore * weight;
    else if (scoreKey === 'transitionScore') finalScore += scores.transitionScore * weight;
    else if (scoreKey === 'complexityScore') finalScore += scores.complexityScore * weight;
    else if (scoreKey === 'varietyScore') finalScore += scores.varietyScore * weight;
    else if (scoreKey === 'pacingScore') finalScore += scores.pacingScore * weight;
    else if (scoreKey === 'vocabularyScore') finalScore += scores.vocabularyScore * weight;
    else if (scoreKey === 'coherenceScore') finalScore += scores.coherenceScore * weight;
    else if (scoreKey === 'engagementScore') finalScore += scores.engagementScore * weight;
    else if (scoreKey === 'readabilityScore') finalScore += scores.readabilityScore * weight;
  });
  
  // Ensure score is in 0-100 range and rounded
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));
  
  return {
    score: finalScore,
    fillerWords: {
      count: fillerCount,
      instances: Array.from(new Set(fillerInstances)).slice(0, 10), // Unique instances, limited to 10
      rate: fillerRate
    },
    transitionWords: {
      count: transitionCount,
      instances: Array.from(new Set(transitionInstances)).slice(0, 10),
      coverage: transitionCount / Math.max(1, sentences.length),
      categories: transitionCategories
    },
    sentenceStructure: {
      averageLength: averageSentenceLength,
      complexityScore,
      varietyScore,
      pacingScore
    },
    vocabularyRichness: vocabularyRichness,
    readabilityScore,
    engagement: engagementScore,
    coherence: coherenceScore,
    suggestions: suggestions.slice(0, 5), // Limit to 5 most important suggestions
    advancedInsights: aiInsights
  };
}

/**
 * Calculate MTLD (Measure of Textual Lexical Diversity)
 * This is a simplified version of the algorithm
 * @param words Array of words in the text
 */
function calculateMTLD(words: string[]): number {
  if (words.length < 10) {
    return words.length > 0 ? (new Set(words.map(w => w.toLowerCase())).size / words.length) : 0;
  }
  
  const factor = 0.72; // Standard TTR factor
  let segments = 0;
  let ttr = 1.0;
  let wordTypes = new Set<string>();
  let wordTokens = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    wordTypes.add(word);
    wordTokens++;
    
    ttr = wordTypes.size / wordTokens;
    
    if (ttr <= factor) {
      segments++;
      wordTypes = new Set<string>();
      wordTokens = 0;
    }
  }
  
  // Handle remaining segment
  if (wordTokens > 0) {
    segments += (1 - ttr) / (1 - factor);
  }
  
  const mtld = words.length / Math.max(1, segments);
  
  // Normalize to 0-1 scale for compatibility
  return Math.min(mtld / 100, 1);
}