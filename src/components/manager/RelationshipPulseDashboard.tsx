'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, MessageCircle, Calendar, AlertCircle, Users, Target, Activity } from 'lucide-react';
import axios from 'axios';

interface ClientPulse {
  id: string;
  name: string;
  health: number;
  activityLevel: number;
  engagement: number;
  daysSinceLastContact: number;
  lastActivity: string;
  industry: string;
  status: 'active' | 'at_risk' | 'inactive';
}

const RelationshipPulseDashboard: React.FC = () => {
  const [pulseData, setPulseData] = useState<{
    overallHealth: number;
    clients: ClientPulse[];
    alerts: Array<{
      clientName: string;
      message: string;
      severity: 'warning' | 'danger';
    }>;
  }>({
    overallHealth: 75,
    clients: [],
    alerts: []
  });

  useEffect(() => {
    fetchPulseData();
    // Update every 30 seconds
    const interval = setInterval(fetchPulseData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPulseData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData = {
        overallHealth: 78,
        clients: [
          {
            id: '1',
            name: 'TechCorp',
            health: 85,
            activityLevel: 8,
            engagement: 92,
            daysSinceLastContact: 2,
            lastActivity: '2 hours ago',
            industry: 'Technology',
            status: 'active' as const
          },
          {
            id: '2',
            name: 'InnovateCo',
            health: 65,
            activityLevel: 6,
            engagement: 78,
            daysSinceLastContact: 5,
            lastActivity: '5 days ago',
            industry: 'Consulting',
            status: 'at_risk' as const
          },
          {
            id: '3',
            name: 'GlobalTech',
            health: 92,
            activityLevel: 9,
            engagement: 95,
            daysSinceLastContact: 1,
            lastActivity: '1 hour ago',
            industry: 'Manufacturing',
            status: 'active' as const
          },
          {
            id: '4',
            name: 'StartupXYZ',
            health: 45,
            activityLevel: 3,
            engagement: 45,
            daysSinceLastContact: 12,
            lastActivity: '12 days ago',
            industry: 'Software',
            status: 'inactive' as const
          }
        ],
        alerts: [
          {
            clientName: 'InnovateCo',
            message: 'Client engagement dropped below 80%',
            severity: 'warning' as const
          },
          {
            clientName: 'StartupXYZ',
            message: 'No activity for 12 days - at risk of churn',
            severity: 'danger' as const
          }
        ]
      };

      setPulseData(mockData);
    } catch (error) {
      console.error('Error fetching pulse data:', error);
    }
  };

  const getPulseColor = (health: number) => {
    if (health >= 80) return 'text-green-500';
    if (health >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPulseBg = (health: number) => {
    if (health >= 80) return 'bg-green-500';
    if (health >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', text: 'Active' },
      at_risk: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', text: 'At Risk' },
      inactive: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', text: 'Inactive' }
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Header */}
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${getPulseBg(pulseData.overallHealth)}/20`}>
              <Heart className={`w-8 h-8 ${getPulseColor(pulseData.overallHealth)}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Relationship Pulse
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Health of your client relationships
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-4xl font-bold ${getPulseColor(pulseData.overallHealth)}`}>
              {pulseData.overallHealth}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Overall Health
            </div>
          </div>
        </div>

        {/* Pulse Wave Animation */}
        <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${getPulseBg(pulseData.overallHealth)} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${pulseData.overallHealth}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Client Pulse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pulseData.clients.map((client, index) => (
          <motion.div
            key={client.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getPulseBg(client.health)}`}></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {client.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {client.industry}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getPulseColor(client.health)}`}>
                  {client.health}%
                </div>
                {getStatusBadge(client.status).text && (
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusBadge(client.status).color}`}>
                    {getStatusBadge(client.status).text}
                  </span>
                )}
              </div>
            </div>

            {/* Health Indicators */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">Activity</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {client.activityLevel}/10
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">Engagement</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {client.engagement}%
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600 dark:text-gray-400">Last Contact</span>
                </div>
                <span className={`font-medium ${
                  client.daysSinceLastContact <= 3 ? 'text-green-600' :
                  client.daysSinceLastContact <= 7 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {client.daysSinceLastContact}d ago
                </span>
              </div>
            </div>

            {/* Health Wave */}
            <div className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getPulseBg(client.health)} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${client.health}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {/* Open client details */}}
                className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => {/* Start conversation */}}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerts Section */}
      {pulseData.alerts.length > 0 && (
        <motion.div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Relationship Alerts
            </h3>
          </div>

          <div className="space-y-3">
            {pulseData.alerts.map((alert, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.severity === 'danger' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {alert.clientName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {alert.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {/* Handle alert */}}
                  className={`px-3 py-1 text-sm rounded hover:opacity-80 transition-opacity ${
                    alert.severity === 'danger'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-500 text-black'
                  }`}
                >
                  Address
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {pulseData.clients.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Clients</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {pulseData.clients.filter(c => c.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {pulseData.clients.filter(c => c.status === 'at_risk').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">At Risk</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <Activity className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {pulseData.clients.filter(c => c.status === 'inactive').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Inactive</div>
        </div>
      </motion.div>
    </div>
  );
};

export default RelationshipPulseDashboard;