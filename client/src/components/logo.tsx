import { motion } from 'framer-motion';

export function Logo() {
  // Sound wave bar variants
  const barVariants = {
    initial: (i: number) => ({
      height: '30%',
      transition: {
        duration: 0.3,
        delay: i * 0.05,
      }
    }),
    animate: (i: number) => ({
      height: ['30%', `${60 + Math.random() * 40}%`, '30%'],
      transition: {
        duration: 1 + Math.random() * 0.5,
        delay: i * 0.05,
        repeat: Infinity,
        repeatType: 'reverse' as const,
        ease: 'easeInOut',
      }
    })
  };

  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      {/* Background circle with rotation */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary opacity-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Sound wave bars */}
      <div className="relative w-6 h-6 flex items-end justify-center gap-[2px]">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-[2px] bg-gradient-to-t from-primary to-secondary rounded-full"
            custom={i}
            initial="initial"
            animate="animate"
            variants={barVariants}
          />
        ))}
      </div>
    </div>
  );
}