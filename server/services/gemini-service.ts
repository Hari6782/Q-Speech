import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

/**
 * Uses Gemini API to analyze a speech transcript
 * @param transcript The speech transcript text
 * @param duration Duration of the speech in seconds
 * @param poseData Optional pose data captured during the speech
 */
export async function analyzeTranscriptWithGemini(
  transcript: string, 
  duration: number, 
  poseData?: any
): Promise<any> {
  try {
    // Calculate basic metrics for context
    const wordCount = transcript.split(' ').filter(word => word.trim() !== '').length;
    const wordsPerMinute = wordCount / (duration / 60);
    const hasValidPoseData = poseData && typeof poseData === 'object';
    
    // Build the prompt with transcript and metrics
    const systemPrompt = `You are an expert speech coach analyzing a public speaking performance. 
    The speech transcript is ${wordCount} words long and was delivered at a pace of ${wordsPerMinute} words per minute.
    ${hasValidPoseData ? 'Body language data from pose detection is also available.' : ''}
    Provide detailed feedback on:
    1. Speech content, grammar, and structure
    2. Body language and non-verbal communication
    3. Overall confidence and delivery
    Format the response as a structured JSON object with these exact keys:
    {
      "speechContent": {
        "score": <number 0-100>,
        "grammarAndLanguage": {
          "score": <number 0-100>,
          "fillerWords": {
            "count": <estimated number>,
            "rate": <percentage of words>
          },
          "vocabularyRichness": <number 0-100>,
          "readabilityScore": <number 0-100>,
          "sentenceStructure": {
            "averageLength": <estimated number>,
            "varietyScore": <number 0-100>
          }
        },
        "structure": {
          "score": <number 0-100>,
          "hasIntroduction": <boolean>,
          "hasConclusion": <boolean>,
          "logicalFlow": <number 0-100>,
          "cohesiveness": <number 0-100>
        },
        "insights": [<string>, <string>] // 1-3 key insights
      },
      "bodyLanguage": {
        "score": <number 0-100>,
        "posture": <number 0-100>,
        "gestures": <number 0-100>,
        "movement": <number 0-100>,
        "facialExpressions": <number 0-100>,
        "eyeContact": <number 0-100>,
        "insights": [<string>, <string>] // 1-3 key insights
      },
      "confidence": {
        "score": <number 0-100>,
        "voiceModulation": <number 0-100>,
        "pacing": <number 0-100>,
        "presence": <number 0-100>,
        "recovery": <number 0-100>,
        "insights": [<string>, <string>] // 1-3 key insights
      },
      "overallScore": <number 0-100>,
      "summary": <string>, // 2-3 sentence summary
      "topActionItems": [<string>, <string>, <string>] // 3-5 action items
    }`;

    // Pose metrics if available
    let poseInfo = '';
    if (hasValidPoseData) {
      poseInfo = `
        Body language metrics from video analysis:
        - Posture score: ${poseData.posture || 'N/A'}/100
        - Gesture score: ${poseData.gestures || 'N/A'}/100
        - Movement score: ${poseData.movement || 'N/A'}/100
        - Stability score: ${poseData.stability || 'N/A'}/100
      `;
    }
    
    // User prompt with transcript and context
    const userPrompt = `
    SPEECH TRANSCRIPT:
    "${transcript}"
    
    SPEECH DURATION: ${duration} seconds
    WORD COUNT: ${wordCount} words
    PACE: ${Math.round(wordsPerMinute)} words per minute
    
    ${poseInfo}
    
    Analyze this speech comprehensively, focusing on content quality, structure, grammar, delivery, and body language.
    Provide actionable feedback that would help improve future performances.
    Use the exact JSON structure specified. Ensure all scores are realistic and match the quality of the speech.
    `;

    // Send to Gemini API
    const result = await geminiModel.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    const textResponse = response.text();
    
    // Extract JSON from response
    const jsonMatch = textResponse.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error('Invalid response format - JSON not found');
    }
    
    const jsonStr = jsonMatch[1];
    try {
      const analysisData = JSON.parse(jsonStr);
      
      // Ensure all required fields exist and have sensible values
      validateAndSanitizeAnalysis(analysisData);
      
      return analysisData;
    } catch (parseError) {
      console.error('Error parsing Gemini response JSON:', parseError);
      throw new Error('Failed to parse Gemini analysis response');
    }
  } catch (error) {
    console.error('Error in Gemini speech analysis:', error);
    throw error;
  }
}

/**
 * Validates and sanitizes the analysis data to ensure all required fields exist
 */
function validateAndSanitizeAnalysis(analysis: any) {
  // Ensure speechContent exists
  if (!analysis.speechContent) {
    analysis.speechContent = { score: 70, insights: ['Analysis generated with limited data'] };
  }
  
  // Ensure bodyLanguage exists
  if (!analysis.bodyLanguage) {
    analysis.bodyLanguage = { score: 70, insights: ['Body language analysis limited by available data'] };
  }
  
  // Ensure confidence exists
  if (!analysis.confidence) {
    analysis.confidence = { score: 70, insights: ['Confidence assessment based on limited signals'] };
  }
  
  // Ensure overall score exists
  if (!analysis.overallScore) {
    const speechScore = analysis.speechContent.score || 70;
    const bodyScore = analysis.bodyLanguage.score || 70;
    const confidenceScore = analysis.confidence.score || 70;
    analysis.overallScore = (speechScore * 0.4) + (bodyScore * 0.4) + (confidenceScore * 0.2);
  }
  
  // Ensure action items exist
  if (!analysis.topActionItems || !Array.isArray(analysis.topActionItems) || analysis.topActionItems.length === 0) {
    analysis.topActionItems = [
      'Practice regularly to build confidence and fluency',
      'Record yourself to observe and improve body language',
      'Prepare structured content with clear introduction and conclusion'
    ];
  }
  
  // Ensure scores are within valid range
  const scoreFields = [
    'analysis.speechContent.score',
    'analysis.bodyLanguage.score',
    'analysis.confidence.score',
    'analysis.overallScore'
  ];
  
  scoreFields.forEach(fieldPath => {
    const parts = fieldPath.split('.');
    let obj = analysis;
    for (let i = 1; i < parts.length; i++) {
      if (obj[parts[i]] !== undefined) {
        if (typeof obj[parts[i]] === 'number') {
          // Ensure score is between 0-100
          obj[parts[i]] = Math.max(0, Math.min(100, obj[parts[i]]));
        }
      }
      if (i < parts.length - 1) {
        obj = obj[parts[i]];
      }
    }
  });
  
  return analysis;
}