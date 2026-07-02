import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShutterhausLogo } from "./ShutterhausLogo";

export function StartupScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide the startup screen after a brief delay to allow initial assets to load/render
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-oatmeal dark:bg-cocoa flex flex-col items-center justify-center cursor-pointer p-6"
          onClick={() => setIsVisible(false)}
          title="Click to skip"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center gap-8"
          >
            <div className="flex items-center justify-center text-espresso dark:text-alabaster mb-4">
              <ShutterhausLogo variant="mark" iconSize={64} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center flex flex-col items-center gap-4"
            >
              <h1 className="text-3xl font-serif italic tracking-tighter text-espresso dark:text-alabaster leading-none block">
                SHUTTERHAUS
              </h1>
              <p className="text-xs font-mono uppercase tracking-widest text-[#7c7265] dark:text-[#9a9088] block">
                Loading Visuals...
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
