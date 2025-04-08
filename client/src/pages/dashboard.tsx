import { useState, useEffect } from 'react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-dark-main to-dark-deeper text-light">
      {/* Header */}
      <header className="border-b border-dark-lighter bg-dark-deeper/70 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-2xl font-bold font-special bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Q-Speech</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              className={activeTab === 'home' ? 'text-primary' : 'text-light-darker hover:text-light'}
              onClick={() => setActiveTab('home')}
            >
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className={activeTab === 'history' ? 'text-primary' : 'text-light-darker hover:text-light'}
              onClick={() => setActiveTab('history')}
            >
              History
            </Button>
            <Button 
              variant="ghost" 
              className={activeTab === 'profile' ? 'text-primary' : 'text-light-darker hover:text-light'}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </Button>
            <div className="h-6 w-px bg-dark-lighter mx-2"></div>
            <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {activeTab === 'home' && <DashboardHome />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </main>

      <footer className="py-4 text-center text-light-darker text-sm">
        <p>© {new Date().getFullYear()} Q-Speech AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

function DashboardHome() {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Welcome to Q-Speech Coach</h2>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <motion.div 
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
          className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter hover:border-primary/30 transition-colors"
        >
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Start New Speech</h3>
          <p className="text-light-darker mb-4">Practice your public speaking skills with real-time feedback and analysis.</p>
          <Button 
            className="w-full bg-primary hover:bg-primary-dark text-white" 
            size="lg"
            onClick={() => window.location.href = '/practice'}
          >
            Begin Practice
          </Button>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
          className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter hover:border-primary/30 transition-colors"
        >
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">View Progress</h3>
          <p className="text-light-darker mb-4">Track your improvement over time and see detailed analytics of your speaking skills.</p>
          <Button variant="outline" className="w-full" size="lg">
            View Analytics
          </Button>
        </motion.div>
      </div>

      <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter">
        <h3 className="text-xl font-bold mb-4">Recent Practice Sessions</h3>
        <div className="text-center text-light-darker py-8">
          <p>You haven't completed any practice sessions yet.</p>
          <p className="mt-2">Start a new session to see your results here!</p>
        </div>
      </div>
    </div>
  );
}

function HistoryTab() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest("GET", "/api/speech-sessions");
        if (response && typeof response === 'object' && 'sessions' in response) {
          setSessions(response.sessions || []);
        } else {
          setSessions([]); // Set empty array as fallback
        }
      } catch (error) {
        console.error("Error fetching speech sessions:", error);
        toast({
          title: "Error",
          description: "Could not load speech history. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessions();
  }, [toast]);
  
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
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Practice History</h2>
      <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-dark-lighter">
                  <th className="text-left p-4 text-light-darker font-medium">Title</th>
                  <th className="text-left p-4 text-light-darker font-medium">Date</th>
                  <th className="text-left p-4 text-light-darker font-medium">Duration</th>
                  <th className="text-center p-4 text-light-darker font-medium">Overall Score</th>
                  <th className="text-right p-4 text-light-darker font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-dark-lighter hover:bg-dark-lighter/30 transition-colors">
                    <td className="p-4">{session.title}</td>
                    <td className="p-4 text-light-darker">{formatDate(session.createdAt)}</td>
                    <td className="p-4 text-light-darker">{formatDuration(session.duration)}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center bg-dark-lighter rounded-full px-3 py-1">
                        <span className={`text-sm font-medium ${
                          session.totalScore >= 80 ? 'text-green-400' :
                          session.totalScore >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {session.totalScore || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="text-primary">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-light-darker py-8">
            <p>You haven't completed any practice sessions yet.</p>
            <p className="mt-2">Start a new session to see your history here!</p>
            <Button 
              className="mt-6 bg-primary hover:bg-primary-dark" 
              onClick={() => window.location.href = '/practice'}
            >
              Start Practice
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileTab() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest("GET", "/api/user/profile");
        setUser(response);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Error",
          description: "Could not load profile information. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [toast]);
  
  // Get initials from username or email
  const getInitials = () => {
    if (!user) return "U";
    
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    } else if (user.email) {
      return user.email.substring(0, 1).toUpperCase();
    }
    
    return "U";
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Your Profile</h2>
      <div className="bg-dark-deeper/70 backdrop-blur-md rounded-xl p-6 border border-dark-lighter">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : user ? (
          <>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                {getInitials()}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{user.username || "User"}</h3>
                <p className="text-light-darker">{user.email || "No email provided"}</p>
                <p className="text-light-darker mt-1 text-sm">Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-3">Account Settings</h4>
                <Button variant="outline" className="w-full justify-start mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full justify-start mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change Password
                </Button>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-3">Preferences</h4>
                <Button variant="outline" className="w-full justify-start mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Notification Settings
                </Button>
                <Button variant="outline" className="w-full justify-start mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  Customize Dashboard
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-light-darker">Could not load profile information.</p>
            <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}