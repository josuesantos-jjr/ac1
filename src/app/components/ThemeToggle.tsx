'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function EclipseThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const currentTheme = theme === 'dark';
      setIsDark(currentTheme);
      document.documentElement.setAttribute('data-theme', currentTheme ? 'dark' : 'light');
    }
  }, [theme, mounted]);

  if (!mounted) return null;

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const clickX = event.clientX;
      const clickY = event.clientY;

      // Store click coordinates for animation
      const clickCoordinates = { x: clickX - centerX, y: clickY - centerY };
      buttonRef.current?.style.setProperty('--click-x', `${clickCoordinates.x}px`);
      buttonRef.current?.style.setProperty('--click-y', `${clickCoordinates.y}px`);
    }

    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    setIsDark(!isDark);
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={toggleTheme}
      className="relative w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      aria-label="Alternar tema"
    >
      {/* Background Eclipse Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 dark:from-yellow-400 dark:to-orange-500"
        initial={false}
        animate={{
          clipPath: isDark
            ? "circle(0% at var(--click-x, 50%) var(--click-y, 50%))"
            : "circle(150% at var(--click-x, 50%) var(--click-y, 50%))"
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      {/* Icons Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={false}
          animate={{
            opacity: isDark ? 0 : 1,
            scale: isDark ? 0.5 : 1,
            rotate: isDark ? -180 : 0
          }}
          transition={{ duration: 0.4, delay: isDark ? 0 : 0.2 }}
        >
          <Sun className="w-6 h-6 text-slate-700" />
        </motion.div>

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={false}
          animate={{
            opacity: isDark ? 1 : 0,
            scale: isDark ? 1 : 0.5,
            rotate: isDark ? 0 : 180
          }}
          transition={{ duration: 0.4, delay: isDark ? 0.2 : 0 }}
        >
          <Moon className="w-6 h-6 text-slate-200" />
        </motion.div>
      </div>

      {/* Ripple Effect */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          originX: 0.5,
          originY: 0.5,
        }}
        key={isDark ? 'dark' : 'light'} // Re-trigger animation on theme change
      />

      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/10 dark:to-transparent rounded-full pointer-events-none" />
    </motion.button>
  );
}
