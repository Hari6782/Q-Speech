import { motion } from "framer-motion";

export function Logo() {
  return (
    <div className="relative w-12 h-12 mr-4">
      <motion.div 
        className="absolute inset-0 bg-primary rounded-lg"
        animate={{ rotate: 45 }}
        transition={{ duration: 0.5 }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="sound-wave w-8 h-8 flex items-end justify-center space-x-0.5">
          <motion.div
            className="bar bg-light"
            animate={{ height: ["10%", "80%", "10%"] }}
            transition={{
              duration: 1,
              ease: "easeInOut",
              repeat: Infinity,
              delay: 0
            }}
            style={{ width: "2px", borderRadius: "1px" }}
          />
          <motion.div
            className="bar bg-light"
            animate={{ height: ["10%", "60%", "10%"] }}
            transition={{
              duration: 1,
              ease: "easeInOut",
              repeat: Infinity,
              delay: 0.1
            }}
            style={{ width: "2px", borderRadius: "1px" }}
          />
          <motion.div
            className="bar bg-light"
            animate={{ height: ["10%", "100%", "10%"] }}
            transition={{
              duration: 1,
              ease: "easeInOut",
              repeat: Infinity,
              delay: 0.2
            }}
            style={{ width: "2px", borderRadius: "1px" }}
          />
          <motion.div
            className="bar bg-light"
            animate={{ height: ["10%", "70%", "10%"] }}
            transition={{
              duration: 1,
              ease: "easeInOut",
              repeat: Infinity,
              delay: 0.3
            }}
            style={{ width: "2px", borderRadius: "1px" }}
          />
          <motion.div
            className="bar bg-light"
            animate={{ height: ["10%", "45%", "10%"] }}
            transition={{
              duration: 1,
              ease: "easeInOut",
              repeat: Infinity,
              delay: 0.4
            }}
            style={{ width: "2px", borderRadius: "1px" }}
          />
        </div>
      </div>
    </div>
  );
}
