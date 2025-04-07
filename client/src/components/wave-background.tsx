import { motion } from 'framer-motion';

export function WaveBackground() {
  return (
    <div className="wave-container">
      <motion.div 
        className="wave wave-1" 
        animate={{ x: [0, '-50%'] }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
      <motion.div 
        className="wave wave-2"
        animate={{ x: ['-50%', '0%'] }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
      <motion.div 
        className="wave wave-3"
        animate={{ x: [0, '-50%'] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
    </div>
  );
}
