import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';

export default function SessionDetails() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessionDetails = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest("GET", `/api/speech-sessions/${params.id}`);
        setSession(response.session);
      } catch (error) {
        console.error("Error fetching session details:", error);
        toast({
          title: "Error",
          description: "Could not load session details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (params.id) {
      fetchSessionDetails();
    }
  }, [params.id, toast]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-dark-main to-dark-deeper text-light">
      {/* Header */}
      <header className="border-b border-dark-lighter bg-dark-deeper/70 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-2xl font-bold font-special bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Q-Speech</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-light-darker hover:text-light"
              onClick={() => setLocation('/dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className="text-light-darker hover:text-light"
              onClick={() => setLocation('/practice')}
            >
              New Practice
            </Button>
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center gap-2 text-light-darker"
          onClick={() => setLocation('/dashboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Button>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : session ? (
          <div>
            <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{session.title}</h1>
                  <p className="text-light-darker mt-1">{formatDate(session.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-light-darker">
                    <span className="text-sm font-medium">Duration</span>
                    <p className="text-xl">{formatDuration(session.duration)}</p>
                  </div>
                  <div className="bg-dark-lighter rounded-xl px-5 py-3">
                    <span className="text-sm font-medium text-light-darker">Overall Score</span>
                    <p className={`text-2xl font-bold ${
                      session.totalScore >= 80 ? 'text-green-400' :
                      session.totalScore >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {session.totalScore || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scores Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <ScoreCard title="Speech" score={session.speechScore} icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              } />
              <ScoreCard title="Body Language" score={session.bodyLanguageScore} icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              } />
              <ScoreCard title="Confidence" score={session.confidenceScore} icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              } />
            </div>
            
            {/* Transcript */}
            <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter mb-8">
              <h2 className="text-xl font-bold mb-4">Transcript</h2>
              <div className="bg-dark-lighter/30 p-4 rounded-lg max-h-64 overflow-y-auto">
                <p className="whitespace-pre-wrap">{session.transcript || "No transcript available."}</p>
              </div>
            </div>
            
            {/* Feedback */}
            <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter mb-8">
              <h2 className="text-xl font-bold mb-4">Feedback Analysis</h2>
              
              {/* Parse and display all feedback from the session */}
              {session.feedback ? (
                <div className="bg-dark-lighter/30 p-5 rounded-lg mb-6">
                  <h3 className="font-semibold mb-3 text-primary">AI Speech Analysis</h3>
                  <div className="whitespace-pre-wrap text-light-darker mb-4">
                    {session.feedback}
                  </div>
                  
                  {/* Visual separator */}
                  <div className="border-t border-dark-lighter my-4"></div>
                  
                  {/* Performance metrics visualization */}
                  {session.metrics && (
                    <div>
                      <h3 className="font-semibold mb-3">Performance Metrics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(session.metrics).map(([key, value]) => {
                          // Convert unknown value to number for safe comparison
                          const numValue = typeof value === 'number' ? value : 
                                          typeof value === 'string' ? parseFloat(value) : 0;
                          
                          return (
                            <div key={key} className="bg-dark-deeper rounded-lg p-3 text-center">
                              <div className={`text-xl font-medium ${
                                numValue >= 80 ? 'text-green-400' :
                                numValue >= 60 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {typeof value === 'number' ? value : 
                                 typeof value === 'string' ? value : '0'}%
                              </div>
                              <div className="text-xs text-light-darker capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FeedbackCard 
                    title="Speech Analysis" 
                    description="No speech feedback available." 
                  />
                  <FeedbackCard 
                    title="Body Language Analysis" 
                    description="No body language feedback available." 
                  />
                  <FeedbackCard 
                    title="Confidence Analysis" 
                    description="No confidence feedback available." 
                  />
                  <FeedbackCard 
                    title="Tips for Improvement" 
                    description="No improvement tips available." 
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-center gap-4 mt-12">
              <Button 
                variant="outline"
                className="px-6"
                onClick={() => setLocation('/dashboard')}
              >
                Back to Dashboard
              </Button>
              <Button 
                className="bg-primary hover:bg-primary-dark px-6"
                onClick={() => setLocation('/practice')}
              >
                Start New Practice
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-8 border border-dark-lighter text-center">
            <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
            <p className="text-light-darker mb-6">The practice session you're looking for doesn't exist or has been removed.</p>
            <Button 
              className="bg-primary hover:bg-primary-dark"
              onClick={() => setLocation('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function ScoreCard({ title, score, icon }: { title: string; score?: number; icon: React.ReactNode }) {
  return (
    <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-5 border border-dark-lighter">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">{title}</h3>
        <div className="text-primary">{icon}</div>
      </div>
      <div className="flex justify-center">
        <div className={`text-4xl font-bold ${
          (score ?? 0) >= 80 ? 'text-green-400' :
          (score ?? 0) >= 60 ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {score ?? 0}%
        </div>
      </div>
    </div>
  );
}

function FeedbackCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-dark-lighter/30 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-light-darker text-sm">{description}</p>
    </div>
  );
}