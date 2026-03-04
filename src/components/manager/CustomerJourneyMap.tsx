'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, MapPin, ArrowRight, TrendingUp, Calendar } from 'lucide-react';

interface JourneyStage {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'blocked' | 'upcoming';
  date?: string;
  description: string;
  actions?: string[];
  metrics?: Record<string, number | undefined>;
}

interface CustomerJourneyMapProps {
  clientId?: string;
}

const CustomerJourneyMap: React.FC<CustomerJourneyMapProps> = ({ clientId }) => {
  const [journeyData, setJourneyData] = useState<{
    stages: JourneyStage[];
    clientInfo: {
      name: string;
      industry: string;
      onboardingDate: string;
    };
  }>({
    stages: [],
    clientInfo: {
      name: '',
      industry: '',
      onboardingDate: ''
    }
  });
  const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);

  useEffect(() => {
    fetchJourneyData();
  }, [clientId]);

  const fetchJourneyData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData = {
        clientInfo: {
          name: 'TechCorp',
          industry: 'Technology',
          onboardingDate: '2024-01-15'
        },
        stages: [
          {
            id: 'initial_contact',
            name: 'Initial Contact',
            status: 'completed' as const,
            date: '2024-01-15',
            description: 'First outreach and initial conversation established',
            actions: ['Send introduction email', 'Schedule discovery call'],
            metrics: { responseRate: 85, engagementTime: 12 }
          },
          {
            id: 'qualification',
            name: 'Qualification',
            status: 'current' as const,
            description: 'Assessing needs, budget, and decision-making process',
            actions: ['Complete qualification questionnaire', 'Identify key stakeholders'],
            metrics: { budgetClarity: 70, timelineDefined: 60 }
          },
          {
            id: 'proposal',
            name: 'Proposal',
            status: 'upcoming' as const,
            description: 'Prepare and present customized solution proposal',
            actions: ['Create proposal document', 'Prepare presentation']
          },
          {
            id: 'negotiation',
            name: 'Negotiation',
            status: 'upcoming' as const,
            description: 'Discuss terms, pricing, and contract details',
            actions: ['Address objections', 'Finalize agreement terms']
          },
          {
            id: 'closure',
            name: 'Closure',
            status: 'upcoming' as const,
            description: 'Final agreement and onboarding preparation',
            actions: ['Sign contract', 'Set up account', 'Schedule training']
          }
        ]
      };

      setJourneyData(mockData);
    } catch (error) {
      console.error('Error fetching journey data:', error);
    }
  };

  const getStageIcon = (stage: JourneyStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />;
      case 'blocked':
        return <AlertTriangle className="w-6 h-6 text-red-500 animate-bounce" />;
      default:
        return <MapPin className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStageColor = (stage: JourneyStage) => {
    switch (stage.status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'current':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/50';
      case 'blocked':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse';
      default:
        return 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', text: 'Completed' },
      current: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', text: 'In Progress' },
      blocked: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', text: 'Blocked' },
      upcoming: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', text: 'Upcoming' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (!journeyData.stages.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Customer Journey
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {journeyData.clientInfo.name} • {journeyData.clientInfo.industry}
            </p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
          <div>Onboarded: {new Date(journeyData.clientInfo.onboardingDate).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="relative">
        {/* Connection Lines */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>

        <div className="relative z-10 flex justify-between">
          {journeyData.stages.map((stage, index) => (
            <motion.div
              key={stage.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Stage Node */}
              <motion.button
                onClick={() => setSelectedStage(stage)}
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${getStageColor(stage)} hover:scale-110`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {getStageIcon(stage)}
              </motion.button>

              {/* Stage Label */}
              <div className="text-center mt-3 max-w-24">
                <p className={`text-sm font-medium ${
                  stage.status === 'current' ? 'text-blue-600 dark:text-blue-400' :
                  stage.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                  stage.status === 'blocked' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {stage.name}
                </p>
                {stage.date && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(stage.date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Animated Flow */}
              {stage.status === 'current' && index < journeyData.stages.length - 1 && (
                <motion.div
                  className="absolute top-8 left-16 w-32 h-0.5 bg-gradient-to-r from-blue-500 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                  style={{
                    transformOrigin: 'left',
                    background: 'linear-gradient(90deg, #3b82f6 0%, transparent 100%)'
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stage Details */}
      {selectedStage && (
        <motion.div
          className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {getStageIcon(selectedStage)}
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {selectedStage.name}
              </h4>
            </div>
            {getStatusBadge(selectedStage.status)}
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-3">
            {selectedStage.description}
          </p>

          {selectedStage.actions && selectedStage.actions.length > 0 && (
            <div className="mb-4">
              <p className="font-medium text-gray-900 dark:text-white mb-2">Required Actions:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {selectedStage.actions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedStage.metrics && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(selectedStage.metrics).map(([key, value]) => (
                <div key={key} className="text-center p-2 bg-white dark:bg-gray-600 rounded">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{value}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setSelectedStage(null)}
            className="mt-4 px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            Close Details
          </button>
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Upcoming</span>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Journey Progress</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {journeyData.stages.filter(s => s.status === 'completed').length} of {journeyData.stages.length} stages completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round((journeyData.stages.filter(s => s.status === 'completed').length / journeyData.stages.length) * 100)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
          </div>
        </div>
        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${(journeyData.stages.filter(s => s.status === 'completed').length / journeyData.stages.length) * 100}%`
            }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerJourneyMap;