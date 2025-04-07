import { motion } from "framer-motion";

export function SoundWaveVisualizer() {
  // Array for the sound wave bars
  const bars = Array(10).fill(0);
  
  return (
    <div className="sound-wave my-8 h-16 flex items-center">
      {bars.map((_, index) => (
        <motion.div
          key={index}
          className="bar bg-gradient-to-b from-primary to-secondary h-full w-[6px] rounded-[3px] mx-[2px]"
          animate={{ height: ["10%", "100%", "10%"] }}
          transition={{
            duration: 1.2,
            ease: "easeInOut",
            repeat: Infinity,
            delay: index * 0.1,
          }}
          initial={{ height: "10%" }}
        />
      ))}
    </div>
  );
}
