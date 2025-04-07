import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const particleCount = window.innerWidth < 768 ? 30 : 50;
    
    // Clear any existing particles
    container.innerHTML = '';
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 6 + 3;
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.opacity = `${Math.random() * 0.5 + 0.2}`;
      
      // Create unique animation for each particle
      const delayRandom = Math.random() * 5;
      const durationRandom = Math.random() * 10 + 8;
      
      particle.style.animation = `particle-float ${durationRandom}s ease-in-out infinite`;
      particle.style.animationDelay = `${delayRandom}s`;
      
      container.appendChild(particle);
    }
    
    // Cleanup function
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="particle-container fixed inset-0 overflow-hidden z-0"
    />
  );
}
