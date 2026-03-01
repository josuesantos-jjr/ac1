'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../lib/stores';

const EclipseThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoordinates({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }
    toggleTheme();
  };

  const isDark = theme === 'dark';

  return (
    <>
      {/* Eclipse Animation Overlay */}
      <motion.div
        className="fixed inset-0 bg-black pointer-events-none z-50"
        initial={{ clipPath: `circle(0px at ${coordinates.x}px ${coordinates.y}px)` }}
        animate={{
          clipPath: isDark
            ? `circle(0px at ${coordinates.x}px ${coordinates.y}px)`
            : `circle(100vh at ${coordinates.x}px ${coordinates.y}px)`
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      {/* Toggle Button */}
      <motion.button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Sun Icon */}
        <motion.svg
          className="w-6 h-6 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          initial={{ scale: 1, rotate: 0 }}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? 180 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </motion.svg>

        {/* Moon Icon */}
        <motion.svg
          className="w-6 h-6 text-blue-200 absolute"
          fill="currentColor"
          viewBox="0 0 20 20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -180
          }}
          transition={{ duration: 0.3 }}
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </motion.svg>

        {/* Stars Animation */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: isDark ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Animated stars */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${20 + i * 10}%`,
                top: `${20 + (i % 2) * 10}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.button>
    </>
  );
};

export default EclipseThemeToggle;