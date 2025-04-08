import { RegisterForm } from "@/components/register-form";
import { ParticleBackground } from "@/components/particle-background";
import { WaveBackground } from "@/components/wave-background";
import { SoundWaveVisualizer } from "@/components/sound-wave-visualizer";
import { Logo } from "@/components/logo";
import { motion } from "framer-motion";

export default function Register() {
  return (
    <div className="font-sans text-light min-h-screen flex flex-col bg-gradient-to-b from-dark-main to-dark-deeper">
      {/* Header with Logo */}
      <header className="relative z-20 pt-6 px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="text-3xl font-bold font-special bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Q-Speech</h1>
        </div>
        <a href="/" className="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors duration-300">
          Sign In
        </a>
      </header>

      {/* Background Elements (different arrangement) */}
      <div className="absolute inset-0 z-0 opacity-70">
        <ParticleBackground />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <WaveBackground />
      </div>

      {/* Main Content - Center Layout */}
      <main className="flex-grow flex justify-center items-center relative z-10 pb-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 px-6">
          {/* Left Side - Form */}
          <div className="order-2 lg:order-1 flex justify-center items-center">
            <RegisterForm />
          </div>

          {/* Right Side - Content */}
          <div className="order-1 lg:order-2 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-4">
                <div className="mb-2">Join the</div>
                <div className="bg-clip-text text-transparent bg-gradient-to-r from-primary-light via-secondary-light to-primary-light animate-gradient-x">
                  Speech Revolution
                </div>
              </h2>

              <div className="h-24 my-8 relative">
                <SoundWaveVisualizer />
              </div>

              <p className="text-xl text-light-darker mb-10 max-w-xl">
                Create your account today and experience the next generation of AI-powered speech technology.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureCard icon="microphone" title="Speech Recognition">
                  State-of-the-art AI that understands natural speech
                </FeatureCard>
                <FeatureCard icon="globe" title="Translation">
                  Real-time translation across 50+ languages
                </FeatureCard>
                <FeatureCard icon="sliders" title="Customization">
                  Personalized voice profiles for your needs
                </FeatureCard>
                <FeatureCard icon="zap" title="Performance">
                  Ultra-fast processing with minimal latency
                </FeatureCard>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-light-darker text-sm">
        <p>© {new Date().getFullYear()} Q-Speech AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  const iconComponents: Record<string, React.ReactNode> = {
    microphone: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    globe: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    sliders: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    zap: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  };

  return (
    <div className="bg-dark-deeper/80 backdrop-blur-md rounded-xl p-5 border border-dark-lighter/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-light transition-colors duration-300">
          {iconComponents[icon]}
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">{title}</h3>
          <p className="text-light-darker text-sm">{children}</p>
        </div>
      </div>
    </div>
  );
}