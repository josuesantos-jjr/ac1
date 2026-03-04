'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import axios from 'axios';

interface RitualCard {
  id: string;
  clientName: string;
  industry: string;
  question: string;
  options: Array<{
    label: string;
    description: string;
  }>;
  context?: string;
  leadsChange: number;
  activeConversations: number;
  lastActivity: string;
}

interface MorningRitualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const MorningRitualModal: React.FC<MorningRitualModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [ritualData, setRitualData] = useState<RitualCard[]>([]);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchMorningRitualData();
    }
  }, [isOpen]);

  const fetchMorningRitualData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData: RitualCard[] = [
        {
          id: 'client1',
          clientName: 'TechCorp',
          industry: 'Technology',
          question: 'What action should we take for TechCorp?',
          options: [
            {
              label: 'Tweak AI Prompt',
              description: 'Adjust the AI\'s communication strategy'
            },
            {
              label: 'Monitor Only',
              description: 'Keep current strategy, monitor progress'
            }
          ],
          context: 'Lead quality has decreased by 15% this week',
          leadsChange: -15,
          activeConversations: 3,
          lastActivity: '2 hours ago'
        },
        {
          id: 'client2',
          clientName: 'InnovateCo',
          industry: 'Consulting',
          question: 'How should we proceed with InnovateCo?',
          options: [
            {
              label: 'Increase Engagement',
              description: 'Send follow-up messages more frequently'
            },
            {
              label: 'Quality Over Quantity',
              description: 'Focus on higher-quality interactions'
            }
          ],
          leadsChange: 8,
          activeConversations: 7,
          lastActivity: '30 min ago'
        }
      ];
      setRitualData(mockData);
    } catch (error) {
      console.error('Error fetching ritual data:', error);
    }
  };

  const handleResponse = (cardId: string, response: string) => {
    setResponses(prev => ({ ...prev, [cardId]: response }));
  };

  const handleNext = () => {
    if (currentCard < ritualData.length - 1) {
      setDirection(1);
      setCurrentCard(currentCard + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setDirection(-1);
      setCurrentCard(currentCard - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await axios.post('/api/manager/morning-ritual/complete', { responses });
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing ritual:', error);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      // Swipe right
      handlePrevious();
    } else if (info.offset.x < -threshold) {
      // Swipe left
      handleNext();
    }
  };

  if (!isOpen || ritualData.length === 0) return null;

  const currentRitualCard = ritualData[currentCard];
  const progress = ((currentCard + 1) / ritualData.length) * 100;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Morning Ritual</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/30 rounded-full h-2 mb-2">
            <motion.div
              className="bg-white h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm opacity-90">
            {currentCard + 1} of {ritualData.length} reviews
          </p>
        </div>

        {/* Card Content */}
        <div className="p-6 flex-1 overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentCard}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.3 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
            >
              {/* Client Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {currentRitualCard.clientName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {currentRitualCard.clientName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentRitualCard.industry}
                  </p>
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {currentRitualCard.leadsChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      currentRitualCard.leadsChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(currentRitualCard.leadsChange)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Leads</p>
                </div>

                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {currentRitualCard.activeConversations}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active Chats</p>
                </div>
              </div>

              {/* Main Question */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {currentRitualCard.question}
                </h4>

                {/* Response Options */}
                <div className="space-y-3">
                  {currentRitualCard.options.map((option, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleResponse(currentRitualCard.id, option.label)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                        responses[currentRitualCard.id] === option.label
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          responses[currentRitualCard.id] === option.label
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {responses[currentRitualCard.id] === option.label && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className={`font-medium ${
                          responses[currentRitualCard.id] === option.label
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {option.label}
                        </span>
                      </div>
                      {option.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-9">
                          {option.description}
                        </p>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Additional Context */}
              {currentRitualCard.context && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Context
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {currentRitualCard.context}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Swipe Instructions */}
              <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                ← Swipe left/right or use buttons →
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-gray-50 dark:bg-gray-800">
          <button
            onClick={handlePrevious}
            disabled={currentCard === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!responses[currentRitualCard.id]}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentCard === ritualData.length - 1 ? 'Complete Ritual' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MorningRitualModal;