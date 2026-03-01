'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface ForecastData {
  period: string;
  projected: number;
  actual: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

const ClientForecast: React.FC = () => {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando dados de forecast
    const mockData: ForecastData[] = [
      { period: 'Jan', projected: 45000, actual: 42000, confidence: 85, trend: 'up' },
      { period: 'Feb', projected: 52000, actual: 48000, confidence: 78, trend: 'up' },
      { period: 'Mar', projected: 48000, actual: 51000, confidence: 92, trend: 'up' },
      { period: 'Apr', projected: 55000, actual: 0, confidence: 65, trend: 'up' },
      { period: 'May', projected: 60000, actual: 0, confidence: 58, trend: 'stable' },
      { period: 'Jun', projected: 58000, actual: 0, confidence: 52, trend: 'down' }
    ];

    setForecastData(mockData);
    setLoading(false);
  }, []);

  const metrics: Metric[] = [
    {
      label: 'Monthly Target',
      value: '$58,000',
      change: '+12.5%',
      trend: 'up'
    },
    {
      label: 'Forecast Accuracy',
      value: '87.3%',
      change: '+2.1%',
      trend: 'up'
    },
    {
      label: 'Growth Rate',
      value: '18.2%',
      change: '+5.7%',
      trend: 'up'
    },
    {
      label: 'Risk Level',
      value: 'Low',
      change: 'Stable',
      trend: 'neutral'
    }
  ];

  const periods = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' }
  ];

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
            Sales Forecast
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AI-powered revenue predictions and trend analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.label}
              </h3>
              <div className={`flex items-center gap-1 text-sm ${
                metric.trend === 'up' ? 'text-green-600' :
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                {metric.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                <span>{metric.change}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Forecast Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Revenue Projection
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Projected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Actual</span>
            </div>
          </div>
        </div>

        <div className="h-80 flex items-end justify-between gap-2">
          {forecastData.map((data, index) => (
            <motion.div
              key={data.period}
              initial={{ height: 0 }}
              animate={{ height: `${(data.projected / 65000) * 100}%` }}
              transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative group">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: data.actual > 0 ? `${(data.actual / 65000) * 100}%` : '0%' }}
                  transition={{ delay: index * 0.1 + 0.7, duration: 0.5 }}
                  className="bg-green-500 rounded-t absolute bottom-0 left-0 right-0"
                ></motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.9 }}
                  className="bg-blue-500 rounded-t absolute bottom-0 left-0 right-0 opacity-60"
                ></motion.div>

                {/* Tooltip */}
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-medium">{data.period}</div>
                  <div>Projected: ${data.projected.toLocaleString()}</div>
                  {data.actual > 0 && <div>Actual: ${data.actual.toLocaleString()}</div>}
                  <div className="text-xs text-gray-300 mt-1">Confidence: {data.confidence}%</div>
                </div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{data.period}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Forecast Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Detailed Forecast
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Period</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Projected</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actual</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Variance</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Confidence</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Trend</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((data, index) => {
                const variance = data.actual > 0 ? ((data.actual - data.projected) / data.projected) * 100 : 0;
                return (
                  <motion.tr
                    key={data.period}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.7 }}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                      {data.period}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                      ${data.projected.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                      {data.actual > 0 ? `$${data.actual.toLocaleString()}` : '-'}
                    </td>
                    <td className={`py-4 px-4 text-right ${
                      variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {data.actual > 0 ? `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              data.confidence >= 80 ? 'bg-green-500' :
                              data.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${data.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {data.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {data.trend === 'up' && <ArrowUpRight className="w-5 h-5 text-green-500 mx-auto" />}
                      {data.trend === 'down' && <ArrowDownRight className="w-5 h-5 text-red-500 mx-auto" />}
                      {data.trend === 'stable' && <Activity className="w-5 h-5 text-gray-500 mx-auto" />}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Risk Assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-700"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Forecast Insights
            </h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>• Revenue projection shows strong upward trend for Q2</p>
              <p>• Confidence levels are high for completed months (85%+)</p>
              <p>• April projection may be conservative - consider increasing target</p>
              <p>• Market conditions suggest potential for 15-20% growth acceleration</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ClientForecast;