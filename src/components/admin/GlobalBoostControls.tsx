'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCw, Database, Cpu, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const GlobalBoostControls: React.FC = () => {
  const [boosts, setBoosts] = useState({
    iaRetraining: false,
    cacheFlush: false,
    backupOptimize: false,
    systemTune: false
  });

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 45,
    memory: 67,
    network: 12,
    apiLatency: 245,
    activeConnections: 156
  });

  // Simulate real-time metrics updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 5)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 3)),
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 8)),
        apiLatency: Math.max(100, Math.min(1000, prev.apiLatency + (Math.random() - 0.5) * 20)),
        activeConnections: Math.max(100, Math.min(200, prev.activeConnections + Math.floor((Math.random() - 0.5) * 5)))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleBoostToggle = async (boostType: string, enabled: boolean) => {
    setLoading(prev => ({ ...prev, [boostType]: true }));

    try {
      // API call to execute boost action
      const response = await axios.post('/api/admin/global-boost', {
        action: boostType,
        enabled
      });

      setBoosts(prev => ({ ...prev, [boostType]: enabled }));

      // Show success notification
      console.log('Boost action completed:', response.data);
    } catch (error) {
      console.error('Boost action failed:', error);
      // Show error notification
    } finally {
      setLoading(prev => ({ ...prev, [boostType]: false }));
    }
  };

  const boostOptions = [
    {
      id: 'iaRetraining',
      label: 'IA Force Retraining',
      description: 'Force immediate retraining of all IA models across the system',
      icon: Cpu,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/50',
      danger: true
    },
    {
      id: 'cacheFlush',
      label: 'Global Cache Flush',
      description: 'Clear all system caches for fresh data across all services',
      icon: Database,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/50',
      danger: false
    },
    {
      id: 'backupOptimize',
      label: 'Backup Optimization',
      description: 'Optimize and compress backup storage automatically',
      icon: RefreshCw,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50',
      danger: false
    },
    {
      id: 'systemTune',
      label: 'System Auto-Tune',
      description: 'Automatically optimize system performance parameters',
      icon: Zap,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50',
      danger: true
    }
  ];

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <motion.div
        className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-green-500/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-green-400" />
          <h3 className="text-lg font-semibold text-white">System Status</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(systemMetrics.cpu, { good: 70, warning: 85 })}`}>
              {Math.round(systemMetrics.cpu)}%
            </div>
            <div className="text-xs text-gray-400">CPU</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(systemMetrics.memory, { good: 80, warning: 90 })}`}>
              {Math.round(systemMetrics.memory)}%
            </div>
            <div className="text-xs text-gray-400">Memory</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(systemMetrics.network, { good: 60, warning: 80 })}`}>
              {Math.round(systemMetrics.network)}%
            </div>
            <div className="text-xs text-gray-400">Network</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(systemMetrics.apiLatency, { good: 300, warning: 500 })}`}>
              {Math.round(systemMetrics.apiLatency)}ms
            </div>
            <div className="text-xs text-gray-400">API Latency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {systemMetrics.activeConnections}
            </div>
            <div className="text-xs text-gray-400">Connections</div>
          </div>
        </div>
      </motion.div>

      {/* Boost Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {boostOptions.map((boost, index) => (
          <motion.div
            key={boost.id}
            className={`p-6 rounded-xl border ${boost.bgColor} ${boost.borderColor} backdrop-blur-xl`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <boost.icon className={`w-8 h-8 ${boost.color}`} />
                <div>
                  <h3 className={`font-bold ${boost.color}`}>{boost.label}</h3>
                  <p className="text-gray-300 text-sm">{boost.description}</p>
                  {boost.danger && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span className="text-red-400 text-xs">High Impact Action</span>
                    </div>
                  )}
                </div>
              </div>

              <motion.button
                onClick={() => handleBoostToggle(boost.id, !boosts[boost.id as keyof typeof boosts])}
                disabled={loading[boost.id]}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  boosts[boost.id as keyof typeof boosts]
                    ? boost.danger ? 'bg-red-600' : 'bg-green-600'
                    : 'bg-gray-600'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{
                    left: boosts[boost.id as keyof typeof boosts] ? 'calc(100% - 1.75rem)' : '0.25rem'
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
                {loading[boost.id] && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                boosts[boost.id as keyof typeof boosts] ? 'bg-green-400' : 'bg-gray-500'
              }`} />
              <span className={boosts[boost.id as keyof typeof boosts] ? 'text-green-400' : 'text-gray-500'}>
                {boosts[boost.id as keyof typeof boosts] ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Confirmation for dangerous actions */}
            {boost.danger && boosts[boost.id as keyof typeof boosts] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2 text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>System-wide action in progress. Monitor system status.</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Actions Log */}
      <motion.div
        className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-green-500/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Recent System Actions</h3>
        <div className="space-y-3">
          {[
            { time: '14:32:15', action: 'IA Force Retraining initiated', status: 'running', type: 'danger' },
            { time: '14:31:42', action: 'Global Cache Flush completed', status: 'completed', type: 'success' },
            { time: '14:30:18', action: 'Backup Optimization scheduled', status: 'scheduled', type: 'info' },
            { time: '14:29:55', action: 'System Auto-Tune completed', status: 'completed', type: 'success' }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`w-3 h-3 rounded-full ${
                item.status === 'completed' ? 'bg-green-400' :
                item.status === 'running' ? 'bg-blue-400 animate-pulse' :
                item.status === 'scheduled' ? 'bg-yellow-400' :
                'bg-gray-400'
              }`} />
              <div className="flex-1">
                <p className="text-white font-medium">{item.action}</p>
                <p className="text-gray-400 text-sm">{item.time}</p>
              </div>
              <div className={`px-2 py-1 text-xs rounded ${
                item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                item.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                item.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {item.status}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default GlobalBoostControls;