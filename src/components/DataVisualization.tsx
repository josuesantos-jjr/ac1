'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface DataVisualizationProps {
  type: 'bar' | 'line' | 'pie' | 'metric';
  data: ChartData[];
  title?: string;
  className?: string;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  type,
  data,
  title,
  className = ''
}) => {
  const maxValue = Math.max(...data.map(item => item.value));

  const renderBarChart = () => (
    <div className="space-y-4">
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate">
            {item.label}
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${item.color || 'bg-blue-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 1, delay: index * 0.1 }}
            />
          </div>
          <div className="w-16 text-right text-sm font-medium text-gray-900 dark:text-white">
            {item.value}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderMetric = () => (
    <div className="text-center">
      <motion.div
        className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
      >
        {data[0]?.value || 0}
      </motion.div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {data[0]?.label || 'Metric'}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'metric':
        return renderMetric();
      default:
        return <div>Chart type not implemented yet</div>;
    }
  };

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {title}
        </h3>
      )}
      {renderContent()}
    </motion.div>
  );
};

export default DataVisualization;