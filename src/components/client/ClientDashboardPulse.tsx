'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  MessageSquare,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

interface PulseData {
  totalConversations: number;
  activeConversations: number;
  conversionRate: number;
  averageResponseTime: string;
  leadsGenerated: number;
  aiInteractions: number;
  lastUpdate: string;
}

const ClientDashboardPulse: React.FC = () => {
  const [pulseData, setPulseData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando chamada para API
    const fetchPulseData = async () => {
      try {
        // Aqui seria uma chamada real para /api/pulse ou similar
        const mockData: PulseData = {
          totalConversations: 1247,
          activeConversations: 89,
          conversionRate: 23.4,
          averageResponseTime: '2.3s',
          leadsGenerated: 287,
          aiInteractions: 3421,
          lastUpdate: new Date().toISOString()
        };
        setPulseData(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pulse data:', error);
        setLoading(false);
      }
    };

    fetchPulseData();

    // Atualizar dados a cada 30 segundos
    const interval = setInterval(fetchPulseData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!pulseData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load dashboard data
          </p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Conversations',
      value: pulseData.totalConversations.toLocaleString(),
      icon: MessageSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: '+12%'
    },
    {
      title: 'Active Conversations',
      value: pulseData.activeConversations.toString(),
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: '+5%'
    },
    {
      title: 'Conversion Rate',
      value: `${pulseData.conversionRate}%`,
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: '+2.1%'
    },
    {
      title: 'Avg Response Time',
      value: pulseData.averageResponseTime,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      change: '-0.3s'
    }
  ];

  const secondaryMetrics = [
    {
      title: 'Leads Generated',
      value: pulseData.leadsGenerated.toLocaleString(),
      icon: Users,
      trend: 'up'
    },
    {
      title: 'AI Interactions',
      value: pulseData.aiInteractions.toLocaleString(),
      icon: Activity,
      trend: 'up'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Pulse
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time overview of your AI sales operations
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Last updated: {new Date(pulseData.lastUpdate).toLocaleTimeString()}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {metric.change}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {metric.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metric.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {secondaryMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.title}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[
            { action: 'New lead qualified', time: '2 min ago', status: 'success' },
            { action: 'AI conversation completed', time: '5 min ago', status: 'success' },
            { action: 'Follow-up message sent', time: '8 min ago', status: 'success' },
            { action: 'Campaign performance updated', time: '12 min ago', status: 'info' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.action}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ClientDashboardPulse;