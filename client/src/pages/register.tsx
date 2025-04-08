import { RegisterForm } from "@/components/register-form";
import { ParticleBackground } from "@/components/particle-background";
import { WaveBackground } from "@/components/wave-background";
import { SoundWaveVisualizer } from "@/components/sound-wave-visualizer";
import { Logo } from "@/components/logo";
import { motion } from "framer-motion";

export default function Register() {
  return (
    <div className="font-sans text-light min-h-screen flex flex-col">
      {/* Background Elements */}
      <ParticleBackground />
      <WaveBackground />

      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row w-full relative z-10">
        {/* Left Side - Brand/Info */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center md:items-end">
          <motion.div 
            className="max-w-lg"
            animate={{ y: [0, -20, 0] }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            {/* Logo */}
            <div className="mb-6 flex items-center">
              <Logo />
              <h1 className="text-4xl font-bold font-special bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Q-Speech</h1>
            </div>
            
            {/* Animated Headline */}
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="block">Create Your</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-secondary-light">Account Today</span>
            </h2>
            
            {/* Animated Sound Wave Visualizer */}
            <SoundWaveVisualizer />
            
            {/* Features */}
            <div className="mt-8 space-y-4">
              <FeatureItem>Advanced AI-powered speech recognition</FeatureItem>
              <FeatureItem>Real-time translation in over 50 languages</FeatureItem>
              <FeatureItem>Voice commands for smart devices</FeatureItem>
              <FeatureItem>Custom voice profiles for personalization</FeatureItem>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <RegisterForm />
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-light-darker text-sm">
        <p>© {new Date().getFullYear()} Q-Speech AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-light" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="text-light-darker">{children}</p>
    </div>
  );
}