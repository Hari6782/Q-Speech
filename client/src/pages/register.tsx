import { RegisterForm } from "@/components/register-form";
import { ParticleBackground } from "@/components/particle-background";
import { WaveBackground } from "@/components/wave-background";
import { SoundWaveVisualizer } from "@/components/sound-wave-visualizer";
import { Logo } from "@/components/logo";

export default function Register() {
  return (
    <div className="min-h-screen bg-dark-main flex flex-col overflow-hidden relative">
      {/* Background Effects */}
      <WaveBackground />
      <ParticleBackground />
      
      {/* Animated Sound Wave Visualizer */}
      <div className="absolute top-0 left-0 right-0 h-72 pointer-events-none">
        <SoundWaveVisualizer />
      </div>
      
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Logo Area */}
        <div className="flex justify-center mt-6 mb-10">
          <Logo />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row gap-12 items-center justify-center">
          {/* Registration Form Column */}
          <div className="w-full max-w-md">
            <RegisterForm />
          </div>
          
          {/* Features Column */}
          <div className="w-full max-w-md text-light">
            <h2 className="text-3xl font-bold mb-6 font-special">Experience Q-Speech</h2>
            <div className="space-y-6">
              <FeatureItem>
                Advanced AI-powered speech recognition that adapts to your voice and accent
              </FeatureItem>
              <FeatureItem>
                Real-time translation in over 50 languages with natural-sounding voices
              </FeatureItem>
              <FeatureItem>
                Voice commands that integrate with your favorite applications and smart devices
              </FeatureItem>
              <FeatureItem>
                Custom voice profiles for personalized audio experiences
              </FeatureItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-dark-deeper/70 backdrop-blur-sm rounded-xl border border-dark-lighter">
      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary-light/20 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
      </div>
      <p className="text-light-darker">{children}</p>
    </div>
  );
}