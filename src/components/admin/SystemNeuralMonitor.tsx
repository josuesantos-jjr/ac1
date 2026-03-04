'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, HardDrive, Wifi, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  status: 'good' | 'warning' | 'danger';
  description?: string;
}

const SystemNeuralMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 67,
    disk: 23,
    network: 12,
    apiLatency: 245,
    aiConfidence: 87,
    activeConnections: 156,
    errorRate: 0.02
  });

  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>>([]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        disk: Math.max(0, Math.min(100, prev.disk + (Math.random() - 0.5) * 2)),
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 15)),
        apiLatency: Math.max(100, Math.min(1000, prev.apiLatency + (Math.random() - 0.5) * 50)),
        aiConfidence: Math.max(70, Math.min(95, prev.aiConfidence + (Math.random() - 0.5) * 2)),
        activeConnections: Math.max(100, Math.min(200, prev.activeConnections + Math.floor((Math.random() - 0.5) * 10))),
        errorRate: Math.max(0, Math.min(1, prev.errorRate + (Math.random() - 0.5) * 0.01))
      }));

      // Simulate occasional alerts
      if (Math.random() < 0.1) {
        const alertTypes = ['warning', 'error', 'info'];
        const messages = [
          'High CPU usage detected',
          'Memory threshold exceeded',
          'Network latency spike',
          'AI model performance degradation',
          'Backup process completed'
        ];

        setAlerts(prev => [
          {
            id: Date.now().toString(),
            type: alertTypes[Math.floor(Math.random() * alertTypes.length)] as any,
            message: messages[Math.floor(Math.random() * messages.length)],
            timestamp: new Date()
          },
          ...prev.slice(0, 4) // Keep only last 5 alerts
        ]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    unit,
    icon: Icon,
    color,
    bgColor,
    status,
    description
  }) => (
    <motion.div
      className={`bg-black/50 backdrop-blur-xl rounded-lg p-4 border border-gray-700/50`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span className={`text-sm font-medium ${
          status === 'good' ? 'text-green-400' :
          status === 'warning' ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {status === 'good' ? '✓' : status === 'warning' ? '⚠' : '✗'}
        </span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {typeof value === 'number' && unit === '%' ? `${Math.round(value)}` : value}{unit}
      </div>
      <div className="text-sm text-gray-400">{title}</div>
      {description && (
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      )}
      {unit === '%' && typeof value === 'number' && (
        <div className="mt-2 bg-gray-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${
              status === 'good' ? 'bg-green-400' :
              status === 'warning' ? 'bg-yellow-400' :
              'bg-red-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </motion.div>
  );

  const getStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'danger';
  };

  const getTrendingIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-8 h-8 text-green-400 animate-pulse" />
        <div>
          <h2 className="text-2xl font-bold text-white">System Neural Monitor</h2>
          <p className="text-gray-400">Real-time system health and performance metrics</p>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Usage"
          value={metrics.cpu}
          unit="%"
          icon={Cpu}
          color="text-red-400"
          bgColor="bg-red-500/20"
          status={getStatus(metrics.cpu, { good: 70, warning: 85 })}
          description="System processing load"
        />
        <MetricCard
          title="Memory"
          value={metrics.memory}
          unit="%"
          icon={HardDrive}
          color="text-blue-400"
          bgColor="bg-blue-500/20"
          status={getStatus(metrics.memory, { good: 80, warning: 90 })}
          description="RAM utilization"
        />
        <MetricCard
          title="Network I/O"
          value={metrics.network}
          unit="%"
          icon={Wifi}
          color="text-purple-400"
          bgColor="bg-purple-500/20"
          status={getStatus(metrics.network, { good: 60, warning: 80 })}
          description="Bandwidth usage"
        />
        <MetricCard
          title="API Latency"
          value={metrics.apiLatency}
          unit="ms"
          icon={Activity}
          color="text-green-400"
          bgColor="bg-green-500/20"
          status={getStatus(metrics.apiLatency, { good: 300, warning: 500 })}
          description="Response time"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="AI Confidence"
          value={metrics.aiConfidence}
          unit="%"
          icon={Activity}
          color="text-yellow-400"
          bgColor="bg-yellow-500/20"
          status={getStatus(metrics.aiConfidence, { good: 85, warning: 75 })}
          description="Model accuracy"
        />
        <MetricCard
          title="Active Connections"
          value={metrics.activeConnections}
          unit=""
          icon={Wifi}
          color="text-indigo-400"
          bgColor="bg-indigo-500/20"
          status="good"
          description="Concurrent users"
        />
        <MetricCard
          title="Error Rate"
          value={metrics.errorRate * 100}
          unit="%"
          icon={Activity}
          color="text-red-400"
          bgColor="bg-red-500/20"
          status={getStatus(metrics.errorRate * 100, { good: 0.1, warning: 1 })}
          description="System errors"
        />
        <MetricCard
          title="System Load"
          value={Math.round((metrics.cpu + metrics.memory + metrics.network) / 3)}
          unit="%"
          icon={Cpu}
          color="text-orange-400"
          bgColor="bg-orange-500/20"
          status={getStatus((metrics.cpu + metrics.memory + metrics.network) / 3, { good: 60, warning: 75 })}
          description="Overall system health"
        />
      </div>

      {/* Activity Feed and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Activity Feed */}
        <motion.div
          className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-green-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-white text-lg font-bold mb-4">Activity Feed</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[
              { time: '14:32:15', event: 'IA Model retrained successfully', type: 'success' },
              { time: '14:31:42', event: 'New client onboarded: TechCorp', type: 'info' },
              { time: '14:30:18', event: 'Cache flush completed', type: 'warning' },
              { time: '14:29:55', event: 'API latency spike detected', type: 'danger' },
              { time: '14:28:33', event: 'Manager login: john.doe', type: 'info' }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 p-2 rounded bg-gray-800/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`w-2 h-2 rounded-full ${
                  item.type === 'success' ? 'bg-green-400' :
                  item.type === 'warning' ? 'bg-yellow-400' :
                  item.type === 'danger' ? 'bg-red-400' :
                  'bg-blue-400'
                }`} />
                <span className="text-xs text-gray-500 font-mono">{item.time}</span>
                <span className="text-sm text-white flex-1">{item.event}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* System Alerts */}
        <motion.div
          className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-green-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white text-lg font-bold">System Alerts</h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">✓</div>
                <div>All systems operational</div>
              </div>
            ) : (
              alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
                    alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-blue-500/10 border-blue-500/30'
                  }`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.type === 'error' ? 'bg-red-400' :
                      alert.type === 'warning' ? 'bg-yellow-400' :
                      'bg-blue-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-white text-sm">{alert.message}</p>
                      <p className="text-gray-400 text-xs">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* System Overview */}
      <motion.div
        className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-green-500/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-white text-lg font-bold mb-4">System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {Math.round((metrics.cpu + metrics.memory + metrics.network) / 3)}%
            </div>
            <div className="text-sm text-gray-400">Average Load</div>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-green-400 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(metrics.cpu + metrics.memory + metrics.network) / 3}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {metrics.activeConnections}
            </div>
            <div className="text-sm text-gray-400">Active Sessions</div>
            <div className="text-xs text-gray-500 mt-1">
              Peak: {Math.max(150, metrics.activeConnections + 20)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {Math.round(metrics.aiConfidence)}%
            </div>
            <div className="text-sm text-gray-400">AI Performance</div>
            <div className="text-xs text-gray-500 mt-1">
              Confidence Score
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SystemNeuralMonitor;