import OpenAI from "openai";
import fs from "fs";
import { log } from "../../vite";

// The Whisper API is part of OpenAI's API, so we use the same client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Transcribes audio using OpenAI's Whisper API
 * This provides much more accurate transcription than the Web Speech API
 */
export async function transcribeAudio(audioBuffer: Buffer, audioFormat: string = "mp3"): Promise<{
  text: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  language?: string;
}> {
  try {
    // Create a temporary file to store the audio
    const tempFilePath = `./temp-audio-${Date.now()}.${audioFormat}`;
    fs.writeFileSync(tempFilePath, audioBuffer);

    // Use a readable stream for the file
    const audioFile = fs.createReadStream(tempFilePath);

    log(`Transcribing audio file using Whisper (${audioBuffer.length} bytes)`, "whisper");

    // Send the audio to Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    return {
      text: transcription.text,
      segments: transcription.segments?.map(segment => ({
        text: segment.text,
        start: segment.start || 0,
        end: segment.end || 0
      })),
      language: transcription.language
    };
  } catch (error: any) {
    console.error("Error transcribing audio with Whisper:", error);
    throw new Error(`Whisper transcription failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Analyzes delivery aspects from the audio (confident tone, clarity, pace, etc.)
 * @param segments Segments from Whisper transcription
 * @returns Analysis of speech delivery
 */
export function analyzeDelivery(segments: Array<{ text: string; start: number; end: number }>) {
  if (!segments || segments.length === 0) {
    return {
      pace: 0,
      clarity: 0,
      variability: 0
    };
  }

  // Calculate speech rate and pauses
  let totalWords = 0;
  let totalDuration = 0;
  let pauses = 0;
  let wordDurations: number[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentDuration = segment.end - segment.start;
    const words = segment.text.split(/\s+/).filter(w => w.trim() !== '').length;
    
    totalWords += words;
    totalDuration += segmentDuration;
    
    // Measure word duration for this segment
    const avgWordDuration = words > 0 ? segmentDuration / words : 0;
    if (avgWordDuration > 0) {
      wordDurations.push(avgWordDuration);
    }
    
    // Check for pauses between segments
    if (i < segments.length - 1) {
      const nextSegment = segments[i + 1];
      const pauseDuration = nextSegment.start - segment.end;
      
      // Consider a significant pause if it's longer than 0.5 seconds
      if (pauseDuration > 0.5) {
        pauses++;
      }
    }
  }

  // Words per minute
  const wpm = totalWords / (totalDuration / 60);
  
  // Assess pace (too slow: < 120 wpm, ideal: 140-170 wpm, too fast: > 190 wpm)
  let pace = 0;
  if (wpm < 80) pace = 40; // Too slow
  else if (wpm < 120) pace = 60; // Somewhat slow
  else if (wpm < 190) pace = 90; // Good pace
  else pace = 70; // Too fast
  
  // Calculate speech variability (variation in word timing indicates natural rhythm)
  let variability = 0;
  if (wordDurations.length > 5) {
    const avg = wordDurations.reduce((sum, val) => sum + val, 0) / wordDurations.length;
    const variance = wordDurations.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / wordDurations.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize to score (higher variability is better, to a point)
    const variabilityFactor = (stdDev / avg) * 100;
    if (variabilityFactor < 10) variability = 50; // Too monotone
    else if (variabilityFactor < 25) variability = 70; // Some variability
    else if (variabilityFactor < 50) variability = 90; // Good variability
    else variability = 75; // Too variable/inconsistent
  }
  
  // Clarity score (estimated based on segment confidence from Whisper)
  const clarity = 85; // Placeholder - Whisper doesn't provide confidence scores for segments
  
  return {
    pace,
    clarity,
    variability,
    wpm,
    pauses
  };
}