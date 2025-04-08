import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeTranscript(transcript: string, duration: number) {
  // Don't attempt to analyze empty or very short transcripts
  if (!transcript || transcript.trim() === '') {
    return {
      speechScore: 0,
      confidenceScore: 0,
      speechFeedback: "No speech detected. Please try again and make sure your microphone is working properly.",
      confidenceFeedback: "No speech data available for confidence assessment.",
      improvementTips: "Make sure your microphone is properly connected and speak clearly into it during your practice sessions."
    };
  }
  
  // Very minimal transcript - not enough for meaningful analysis
  if (transcript.length < 10) {
    return {
      speechScore: 20,
      confidenceScore: 20,
      speechFeedback: "The transcript was too short to provide detailed analysis. Please speak more for a thorough evaluation.",
      confidenceFeedback: "Unable to assess confidence from the limited speech sample.",
      improvementTips: "Please speak more during your practice sessions for better analysis. Aim for at least 30 seconds of continuous speech."
    };
  }

  try {
    // Calculate words per minute
    const wordCount = transcript.split(/\s+/).filter(word => word.trim() !== '').length;
    const wordsPerMinute = wordCount / (duration / 60);

    // Prepare the prompt for OpenAI
    const prompt = `
You are an expert speech coach analyzing a public speaking practice session. 
Analyze the following transcript and provide detailed feedback:

Transcript: """
${transcript}
"""

Speaking duration: ${duration} seconds
Word count: ${wordCount} words
Speaking rate: ${wordsPerMinute.toFixed(1)} words per minute

Provide an analysis in JSON format with the following fields:
1. speechScore: A number from 0-100 evaluating grammar, vocabulary, clarity, and structure
2. confidenceScore: A number from 0-100 evaluating the apparent confidence level
3. speechFeedback: Detailed feedback on language, grammar, vocabulary, and structure (150-200 words)
4. confidenceFeedback: Assessment of confidence based on word choice, pacing, and clarity (100-150 words)
5. improvementTips: 3-5 specific, actionable tips to improve (bullet points)

For the scores, use these guidelines:
- 90-100: Exceptional, professional-level speaking
- 80-89: Very good, minor improvements needed
- 70-79: Good, shows competence with some issues
- 60-69: Adequate but needs significant improvement
- Below 60: Needs substantial work in multiple areas

Only respond with valid JSON. Do not include any preamble or explanations outside the JSON.
`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const analysisText = response.choices[0].message.content;
    
    if (!analysisText) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const analysis = JSON.parse(analysisText);
    
    return {
      speechScore: analysis.speechScore || 70,
      confidenceScore: analysis.confidenceScore || 70,
      speechFeedback: analysis.speechFeedback || "Unable to generate detailed speech feedback.",
      confidenceFeedback: analysis.confidenceFeedback || "Unable to analyze confidence level.",
      improvementTips: analysis.improvementTips || "No specific improvement tips available."
    };
  } catch (error) {
    console.error("Error analyzing transcript with OpenAI:", error);
    
    // Fallback analysis in case of API errors
    return {
      speechScore: 65,
      confidenceScore: 65,
      speechFeedback: "We encountered an error analyzing your speech. This score is an estimate based on basic metrics.",
      confidenceFeedback: "We couldn't perform a detailed confidence analysis due to a technical issue.",
      improvementTips: "Try again with a different speech sample. Focus on clear articulation and varied pacing."
    };
  }
}