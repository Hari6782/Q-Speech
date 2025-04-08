import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Posedetector } from '@/components/pose-detector';
import { apiRequest } from '@/lib/queryClient';

// Status types
type PracticeStatus = 'setup' | 'recording' | 'processing' | 'results';

export default function Practice() {
  const [status, setStatus] = useState<PracticeStatus>('setup');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  
  const webcamRef = useRef<Webcam>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Speech Recognition
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle camera enable/disable
  const toggleCamera = async () => {
    try {
      if (!cameraEnabled) {
        setCameraEnabled(true);
      } else {
        // Stop camera
        const videoTrack = webcamRef.current?.video?.srcObject as MediaStream;
        if (videoTrack) {
          videoTrack.getTracks().forEach(track => track.stop());
        }
        setCameraEnabled(false);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  // Handle mic enable/disable
  const toggleMic = async () => {
    try {
      if (!micEnabled) {
        // Start listening when mic is enabled
        await SpeechRecognition.startListening({ continuous: true });
        setMicEnabled(true);
      } else {
        // Stop listening when mic is disabled
        SpeechRecognition.stopListening();
        setMicEnabled(false);
      }
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  // Start practice session
  const startPractice = () => {
    if (!cameraEnabled || !micEnabled) {
      toast({
        title: "Cannot Start Practice",
        description: "Please enable both camera and microphone to continue.",
        variant: "destructive"
      });
      return;
    }

    // Reset transcript
    resetTranscript();
    
    // Start recording
    setStatus('recording');
    setRecordingStartTime(Date.now());
    
    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  // End practice session
  const endPractice = () => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Stop listening
    SpeechRecognition.stopListening();
    
    // Set status to processing
    setStatus('processing');
    
    // Process results (simulate processing time)
    setTimeout(() => {
      // Generate simulated results
      const results = analyzeResults(transcript);
      setAnalysisResults(results);
      setStatus('results');
    }, 3000);
  };

  // Function to analyze results (basic implementation)
  const analyzeResults = (text: string) => {
    // Basic speech analysis (in real app, this would be more sophisticated)
    const wordCount = text.split(' ').filter(word => word.trim() !== '').length;
    
    // Simple time check (speaking too fast or too slow)
    const wordsPerMinute = wordCount / (elapsedTime / 60);
    
    // Check for filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'basically', 'actually', 'literally'];
    const fillerCount = fillerWords.reduce((count, filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = text.match(regex) || [];
      return count + matches.length;
    }, 0);
    
    // Simple grammar check
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
    
    // Calculate scores (simplified for demo)
    const speechScore = Math.min(100, Math.max(0, 
      // Base score
      70
      // Word count penalty if very low
      + (wordCount < 20 ? -10 : 0)
      // Words per minute penalty if too fast/slow
      + (wordsPerMinute < 100 ? -5 : (wordsPerMinute > 180 ? -10 : 5))
      // Filler words penalty
      - (fillerCount * 2)
      // Sentence length bonus/penalty
      + (avgSentenceLength > 5 && avgSentenceLength < 20 ? 5 : -5)
    ));
    
    const bodyLanguageScore = 75; // Placeholder - would be calculated from pose detection
    const confidenceScore = 80; // Placeholder - would be calculated from voice analysis
    
    // Calculate total score
    const totalScore = (
      (speechScore * 0.4) + 
      (bodyLanguageScore * 0.4) + 
      (confidenceScore * 0.2)
    );
    
    return {
      transcript: text,
      wordCount,
      fillerCount,
      wordsPerMinute,
      avgSentenceLength,
      duration: elapsedTime,
      scores: {
        speech: speechScore,
        bodyLanguage: bodyLanguageScore,
        confidence: confidenceScore,
        total: totalScore
      },
      suggestions: [
        // Sample suggestions (in a real app, these would be generated based on analysis)
        wordsPerMinute > 180 ? 'Try speaking a bit slower for better clarity.' : null,
        wordsPerMinute < 100 ? 'Consider picking up the pace a little to maintain audience interest.' : null,
        fillerCount > 5 ? `Watch out for filler words like "um" and "uh" - you used them ${fillerCount} times.` : null,
        avgSentenceLength > 20 ? 'Consider using shorter sentences for better clarity.' : null,
        avgSentenceLength < 5 && sentences.length > 3 ? 'Try using more complex sentence structures to sound more natural.' : null,
        wordCount < 50 ? 'Your speech was quite short. Consider elaborating more on your points.' : null,
      ].filter(Boolean)
    };
  };

  // Start over
  const startOver = () => {
    setStatus('setup');
    setElapsedTime(0);
    setRecordingStartTime(null);
    setAnalysisResults(null);
    resetTranscript();
  };

  // Go to dashboard
  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show browser compatibility warning if needed
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-main to-dark-deeper text-light p-4">
        <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-error">Browser Not Supported</h2>
          <p className="mb-6">
            Your browser doesn't support speech recognition. Please try using Chrome, Edge, or Safari for the best experience.
          </p>
          <Button onClick={goToDashboard}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-dark-main to-dark-deeper text-light">
      {/* Header */}
      <header className="border-b border-dark-lighter bg-dark-deeper/70 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-2xl font-bold font-special bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Q-Speech</h1>
          </div>
          {status !== 'results' && (
            <Button 
              variant="outline" 
              className="text-light-darker border-dark-lighter"
              onClick={goToDashboard}
            >
              Back to Dashboard
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Setup View */}
        {status === 'setup' && (
          <SetupView 
            cameraEnabled={cameraEnabled}
            micEnabled={micEnabled}
            toggleCamera={toggleCamera}
            toggleMic={toggleMic}
            startPractice={startPractice}
            webcamRef={webcamRef}
          />
        )}

        {/* Recording View */}
        {status === 'recording' && (
          <RecordingView 
            elapsedTime={elapsedTime}
            formatTime={formatTime}
            transcript={transcript}
            endPractice={endPractice}
            webcamRef={webcamRef}
            listening={listening}
          />
        )}

        {/* Processing View */}
        {status === 'processing' && (
          <ProcessingView />
        )}

        {/* Results View */}
        {status === 'results' && analysisResults && (
          <ResultsView 
            results={analysisResults}
            startOver={startOver}
            goToDashboard={goToDashboard}
          />
        )}
      </main>
    </div>
  );
}

function SetupView({ 
  cameraEnabled, 
  micEnabled, 
  toggleCamera, 
  toggleMic, 
  startPractice,
  webcamRef
}: { 
  cameraEnabled: boolean, 
  micEnabled: boolean,
  toggleCamera: () => void,
  toggleMic: () => void,
  startPractice: () => void,
  webcamRef: React.RefObject<Webcam>
}) {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Prepare for Your Practice Session</h2>
      
      <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter mb-8">
        <h3 className="text-xl font-semibold mb-4">Device Setup</h3>
        <p className="text-light-darker mb-6">
          Enable your camera and microphone to begin. We'll analyze your speech and body language to provide personalized feedback.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Camera Setup */}
          <div className="bg-dark-deeper rounded-lg overflow-hidden">
            <div className="aspect-video bg-black relative flex items-center justify-center">
              {cameraEnabled ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored={true}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-light-darker text-center p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p>Camera is disabled</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <Button 
                onClick={toggleCamera}
                className={cameraEnabled ? "bg-success hover:bg-success/90 w-full" : "w-full"}
              >
                {cameraEnabled ? "Camera Enabled" : "Enable Camera"}
              </Button>
            </div>
          </div>
          
          {/* Microphone Setup */}
          <div className="bg-dark-deeper rounded-lg overflow-hidden">
            <div className="aspect-video bg-black flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              
              <div className="w-3/4 h-12 bg-dark-lighter rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-60"
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: micEnabled ? ["0%", "100%", "0%"] : "0%" 
                  }}
                  transition={{ 
                    repeat: micEnabled ? Infinity : 0,
                    duration: 2,
                    ease: "easeInOut"
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-light-darker text-sm">
                    {micEnabled ? "Microphone active" : "Microphone inactive"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <Button 
                onClick={toggleMic}
                className={micEnabled ? "bg-success hover:bg-success/90 w-full" : "w-full"}
              >
                {micEnabled ? "Microphone Enabled" : "Enable Microphone"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary-dark text-white px-8 py-6 text-lg"
          disabled={!cameraEnabled || !micEnabled}
          onClick={startPractice}
        >
          Start Practice Session
        </Button>
        <p className="mt-4 text-light-darker">
          {!cameraEnabled || !micEnabled 
            ? "Please enable both camera and microphone to continue" 
            : "Everything is ready! Click the button to begin."}
        </p>
      </div>
    </div>
  );
}

function RecordingView({ 
  elapsedTime, 
  formatTime, 
  transcript, 
  endPractice,
  webcamRef,
  listening
}: { 
  elapsedTime: number, 
  formatTime: (seconds: number) => string, 
  transcript: string,
  endPractice: () => void,
  webcamRef: React.RefObject<Webcam>,
  listening: boolean
}) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Camera View */}
        <div className="lg:col-span-2">
          <div className="bg-black rounded-xl overflow-hidden relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={true}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-full object-cover"
            />
            
            {/* Pose Detector Overlay */}
            <div className="absolute inset-0">
              <Posedetector videoRef={webcamRef} />
            </div>
            
            {/* Recording Indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-dark-deeper/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="w-3 h-3 rounded-full bg-error animate-pulse"></div>
              <span className="text-sm font-medium">REC</span>
              <span className="text-sm">{formatTime(elapsedTime)}</span>
            </div>
            
            {/* Mic Status Indicator */}
            <div className="absolute top-4 right-4 bg-dark-deeper/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${listening ? 'text-success' : 'text-error'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-sm">{listening ? 'Listening' : 'Not listening'}</span>
            </div>
          </div>
          
          {/* Live Transcription */}
          <div className="mt-4 bg-dark-deeper/70 backdrop-blur-md rounded-xl p-4 border border-dark-lighter h-32 overflow-y-auto">
            <h3 className="text-sm font-medium text-light-darker mb-2">Live Transcription:</h3>
            <p className="text-light">
              {transcript || "Start speaking to see your words appear here..."}
            </p>
          </div>
        </div>
        
        {/* Right Column - Tips & Controls */}
        <div>
          <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-4 border border-dark-lighter mb-4">
            <h3 className="text-lg font-semibold mb-3">Tips for Success</h3>
            <ul className="space-y-2 text-light-darker">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Speak clearly and at a moderate pace</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Use hand gestures to emphasize points</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Maintain good posture throughout</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Vary your tone to keep the audience engaged</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Avoid filler words like "um" and "uh"</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-4 border border-dark-lighter">
            <h3 className="text-lg font-semibold mb-4">Session Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Restart
              </Button>
              <Button 
                className="w-full bg-primary hover:bg-primary-dark"
                onClick={endPractice}
              >
                Finish
              </Button>
            </div>
            <p className="mt-4 text-center text-light-darker text-sm">
              When you're done, click Finish to see your results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessingView() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-24 h-24 mb-8">
        <svg className="animate-spin w-24 h-24 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2">Analyzing Your Performance</h2>
      <p className="text-light-darker text-center max-w-md">
        We're processing your speech and body language data to provide you with detailed feedback. This will only take a moment...
      </p>
    </div>
  );
}

function ResultsView({ 
  results, 
  startOver, 
  goToDashboard 
}: { 
  results: any, 
  startOver: () => void, 
  goToDashboard: () => void 
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  
  // Helper function to determine score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-yellow-500';
    return 'text-error';
  };
  
  // Save session to database
  useEffect(() => {
    const saveSession = async () => {
      if (saved) return;
      
      setSaving(true);
      try {
        // Prepare session data
        const sessionData = {
          title: `Practice Session - ${new Date().toLocaleDateString()}`,
          transcript: results.transcript,
          duration: results.duration,
          speechScore: Math.round(results.scores.speech),
          bodyLanguageScore: Math.round(results.scores.bodyLanguage),
          confidenceScore: Math.round(results.scores.confidence),
          totalScore: Math.round(results.scores.total),
          feedback: results.suggestions.join('\n'),
          metrics: {
            vocabulary: results.wordCount > 50 ? 80 : 60,
            grammar: 75,
            fluency: 100 - results.fillerCount * 5,
            posture: 70,
            gestures: 75,
            eyeContact: 80,
            energy: 85,
            clarity: 75
          }
        };
        
        // Save to the server
        await apiRequest('POST', '/api/speech-sessions', sessionData);
        setSaved(true);
        toast({
          title: "Session Saved",
          description: "Your practice session has been saved to your history.",
        });
      } catch (error) {
        console.error("Error saving speech session:", error);
        toast({
          title: "Save Error",
          description: "Failed to save your practice session. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    };
    
    saveSession();
  }, [results, saved, toast]);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-1 text-center">Your Practice Results</h2>
      <p className="text-light-darker text-center mb-8">
        Session duration: {Math.floor(results.duration / 60)}m {results.duration % 60}s | {results.wordCount} words spoken
      </p>
      
      {/* Overall Score */}
      <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter mb-8 text-center">
        <div className="inline-block mb-4">
          <div className="relative">
            <svg className="w-32 h-32" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#444"
                strokeWidth="1"
                strokeDasharray="100, 100"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="3"
                strokeDasharray={`${results.scores.total}, 100`}
                className="drop-shadow-glow"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className={`text-3xl font-bold ${getScoreColor(results.scores.total)}`}>
                {Math.round(results.scores.total)}
              </div>
              <div className="text-xs text-light-darker">Total Score</div>
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-4">Performance Breakdown</h3>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-deeper p-4 rounded-lg">
            <div className={`text-2xl font-bold ${getScoreColor(results.scores.speech)}`}>
              {Math.round(results.scores.speech)}
            </div>
            <div className="text-sm text-light-darker">Speech (40%)</div>
          </div>
          <div className="bg-dark-deeper p-4 rounded-lg">
            <div className={`text-2xl font-bold ${getScoreColor(results.scores.bodyLanguage)}`}>
              {Math.round(results.scores.bodyLanguage)}
            </div>
            <div className="text-sm text-light-darker">Body Language (40%)</div>
          </div>
          <div className="bg-dark-deeper p-4 rounded-lg">
            <div className={`text-2xl font-bold ${getScoreColor(results.scores.confidence)}`}>
              {Math.round(results.scores.confidence)}
            </div>
            <div className="text-sm text-light-darker">Confidence (20%)</div>
          </div>
        </div>
      </div>
      
      {/* Speech Analysis */}
      <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter mb-8">
        <h3 className="text-xl font-bold mb-4">Speech Analysis</h3>
        
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Speech Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-deeper p-3 rounded-lg text-center">
              <div className="text-xl font-medium">{results.wordCount}</div>
              <div className="text-xs text-light-darker">Total Words</div>
            </div>
            <div className="bg-dark-deeper p-3 rounded-lg text-center">
              <div className="text-xl font-medium">{Math.round(results.wordsPerMinute)}</div>
              <div className="text-xs text-light-darker">Words/Minute</div>
            </div>
            <div className="bg-dark-deeper p-3 rounded-lg text-center">
              <div className="text-xl font-medium">{results.fillerCount}</div>
              <div className="text-xs text-light-darker">Filler Words</div>
            </div>
            <div className="bg-dark-deeper p-3 rounded-lg text-center">
              <div className="text-xl font-medium">{Math.round(results.avgSentenceLength)}</div>
              <div className="text-xs text-light-darker">Avg. Sentence Length</div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Transcript</h4>
          <div className="bg-dark-deeper p-4 rounded-lg max-h-48 overflow-y-auto">
            <p className="text-light-darker">
              {results.transcript || "No transcript available."}
            </p>
          </div>
        </div>
        
        {results.suggestions && results.suggestions.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Suggestions for Improvement</h4>
            <ul className="space-y-2">
              {results.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-start gap-2 bg-dark-deeper p-3 rounded-lg">
                  <div className="text-primary mt-1">💡</div>
                  <div>{suggestion}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Button 
          variant="outline" 
          size="lg"
          className="w-full sm:w-auto"
          onClick={startOver}
        >
          Practice Again
        </Button>
        <Button 
          className="w-full sm:w-auto bg-primary hover:bg-primary-dark"
          size="lg"
          onClick={goToDashboard}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}