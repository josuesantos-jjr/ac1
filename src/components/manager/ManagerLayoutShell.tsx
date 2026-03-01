'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, TrendingUp, Calendar, Plus, Activity } from 'lucide-react';
import axios from 'axios';

interface ManagerLayoutShellProps {
  children: ReactNode;
}

const ManagerLayoutShell: React.FC<ManagerLayoutShellProps> = ({ children }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [pulseData, setPulseData] = useState({
    overallHealth: 75,
    clientCount: 12,
    managerName: 'John Doe',
    managerInitials: 'JD'
  });

  const menuItems = [
    { id: 'dashboard', icon: Heart, label: 'Relationship Pulse', color: 'text-red-400' },
    { id: 'clients', icon: Users, label: 'My Clients', color: 'text-blue-400' },
    { id: 'analytics', icon: TrendingUp, label: 'Performance', color: 'text-green-400' },
    { id: 'calendar', icon: Calendar, label: 'Schedule', color: 'text-purple-400' },
    { id: 'onboard', icon: Plus, label: 'Onboard Client', color: 'text-yellow-400' }
  ];

  useEffect(() => {
    fetchPulseData();
  }, []);

  const fetchPulseData = async () => {
    try {
      // Mock data - replace with actual API
      setPulseData(prev => ({
        ...prev,
        overallHealth: Math.floor(Math.random() * 30) + 65, // 65-95
        clientCount: Math.floor(Math.random() * 10) + 8 // 8-18
      }));
    } catch (error) {
      console.error('Error fetching pulse data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
      {/* Relationship Pulse Background Animation */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated pulse waves */}
          {Array.from({ length: 3 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-blue-200/20 dark:border-blue-800/20"
              style={{
                width: '200px',
                height: '200px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [1, 2, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Sidebar Flutuante */}
      <aside
        className="fixed left-6 top-6 bottom-6 w-72 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
      >
        <div className="p-6 h-full flex flex-col">
          <div className="mb-8">
            <motion.h1
              className="text-2xl font-bold text-gray-800 dark:text-white mb-2"
              animate={{
                color: ['#1f2937', '#3b82f6', '#1f2937']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Relationship View
            </motion.h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Managing client connections
            </p>
          </div>

          {/* Pulse Indicator */}
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200/50 dark:border-red-800/50">
            <div className="flex items-center gap-3 mb-2">
              <Heart
                className="w-5 h-5 text-red-500 animate-pulse"
                style={{
                  animation: `pulse 2s ease-in-out infinite`,
                  filter: `drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))`
                }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Relationship Health
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-red-400 to-pink-400 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pulseData.overallHealth}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {pulseData.overallHealth}%
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  activeSection === item.id
                    ? 'bg-blue-500/20 border border-blue-500/30 shadow-lg'
                    : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <item.icon className={`w-6 h-6 ${item.color}`} />
                <div className="text-left">
                  <div className={`font-medium ${
                    activeSection === item.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.label}
                  </div>
                  {item.id === 'clients' && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {pulseData.clientCount} active clients
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </nav>

          {/* Manager Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {pulseData.managerInitials}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-white">
                  {pulseData.managerName}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Account Manager
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-white/50 dark:bg-gray-700/50 rounded">
                <div className="text-blue-600 dark:text-blue-400 font-bold">
                  {pulseData.clientCount}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Clients</div>
              </div>
              <div className="text-center p-2 bg-white/50 dark:bg-gray-700/50 rounded">
                <div className="text-green-600 dark:text-green-400 font-bold">
                  {pulseData.overallHealth}%
                </div>
                <div className="text-gray-600 dark:text-gray-400">Health</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
      <main className="ml-80 p-6">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Floating Action Button for Quick Actions */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default ManagerLayoutShell;
