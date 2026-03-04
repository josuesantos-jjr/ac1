'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar
} from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  count: number;
  value: number;
  conversionRate: number;
  color: string;
}

interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  lastActivity: string;
  probability: number;
}

const ClientSalesPipeline: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando dados da pipeline
    const mockPipeline: PipelineStage[] = [
      {
        id: 'prospect',
        name: 'Prospect',
        count: 45,
        value: 225000,
        conversionRate: 100,
        color: 'bg-gray-400'
      },
      {
        id: 'qualified',
        name: 'Qualified',
        count: 32,
        value: 180000,
        conversionRate: 71,
        color: 'bg-blue-500'
      },
      {
        id: 'proposal',
        name: 'Proposal',
        count: 18,
        value: 120000,
        conversionRate: 56,
        color: 'bg-yellow-500'
      },
      {
        id: 'negotiation',
        name: 'Negotiation',
        count: 12,
        value: 85000,
        conversionRate: 67,
        color: 'bg-orange-500'
      },
      {
        id: 'closed',
        name: 'Closed Won',
        count: 8,
        value: 60000,
        conversionRate: 67,
        color: 'bg-green-500'
      }
    ];

    const mockDeals: Deal[] = [
      { id: '1', name: 'Tech Corp Deal', value: 50000, stage: 'negotiation', lastActivity: '2 hours ago', probability: 85 },
      { id: '2', name: 'Startup Inc', value: 35000, stage: 'proposal', lastActivity: '1 day ago', probability: 60 },
      { id: '3', name: 'Enterprise Ltd', value: 25000, stage: 'qualified', lastActivity: '3 hours ago', probability: 40 },
      { id: '4', name: 'Small Business Co', value: 15000, stage: 'prospect', lastActivity: '5 hours ago', probability: 20 }
    ];

    setPipelineData(mockPipeline);
    setDeals(mockDeals);
    setLoading(false);
  }, []);

  const totalValue = pipelineData.reduce((sum, stage) => sum + stage.value, 0);
  const totalDeals = pipelineData.reduce((sum, stage) => sum + stage.count, 0);

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sales Pipeline
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your deals through the sales process
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Calendar className="w-4 h-4" />
            This Month
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalValue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Pipeline Value
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalDeals}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Deals
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <Target className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                17.8%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Win Rate
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pipeline Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Pipeline Overview
        </h3>
        <div className="space-y-4">
          {pipelineData.map((stage, index) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.4 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
            >
              <div className={`w-4 h-4 rounded-full ${stage.color}`}></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {stage.name}
                  </h4>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${stage.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {stage.count} deals
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${stage.color}`}
                      style={{ width: `${stage.conversionRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stage.conversionRate}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Top Deals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Top Deals
        </h3>
        <div className="space-y-4">
          {deals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.9 }}
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {deal.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {deal.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {deal.lastActivity}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  ${deal.value.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    deal.probability >= 70 ? 'bg-green-500' :
                    deal.probability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {deal.probability}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ClientSalesPipeline;