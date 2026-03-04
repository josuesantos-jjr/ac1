'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingContextType {
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  globalLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType>({
  setLoading: () => {},
  isLoading: () => false,
  globalLoading: false,
});

export const useGlobalLoading = () => useContext(LoadingContext);

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

export const GlobalLoadingProvider: React.FC<GlobalLoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  const globalLoading = Object.values(loadingStates).some(Boolean);

  return (
    <LoadingContext.Provider value={{ setLoading, isLoading, globalLoading }}>
      {children}
      <AnimatePresence>
        {globalLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl flex flex-col items-center max-w-sm w-full mx-4"
            >
              <motion.div
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Loading...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Please wait while we process your request
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
};