declare module 'react-speech-recognition' {
  interface SpeechRecognitionOptions {
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
  }

  interface SpeechRecognition {
    startListening: (options?: SpeechRecognitionOptions) => Promise<void>;
    stopListening: () => void;
    abortListening: () => void;
    browserSupportsSpeechRecognition: boolean;
    getRecognition: () => any;
  }

  interface UseSpeechRecognitionResponse {
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
  }

  function useSpeechRecognition(options?: {
    transcribing?: boolean;
    clearTranscriptOnListen?: boolean;
    commands?: Array<{
      command: string | string[] | RegExp;
      callback: (...args: any[]) => void;
      matchInterim?: boolean;
      isFuzzyMatch?: boolean;
      fuzzyMatchingThreshold?: number;
      bestMatchOnly?: boolean;
    }>;
  }): UseSpeechRecognitionResponse;

  const SpeechRecognition: SpeechRecognition;
  
  export default SpeechRecognition;
  export { useSpeechRecognition };
}