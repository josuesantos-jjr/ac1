'use client';

import React, { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Activity, BarChart3, FileText, TrendingUp, MessageSquare, Settings } from 'lucide-react';

interface ClientLayoutShellProps {
  children: ReactNode;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const ClientLayoutShell: React.FC<ClientLayoutShellProps> = ({
  children,
  activeSection,
  setActiveSection
}) => {

  const menuItems = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard Pulse', color: 'text-blue-400' },
    { id: 'pipeline', icon: BarChart3, label: 'Sales Pipeline', color: 'text-green-400' },
    { id: 'assets', icon: FileText, label: 'Assets Vault', color: 'text-purple-400' },
    { id: 'forecast', icon: TrendingUp, label: 'Forecast', color: 'text-orange-400' },
    { id: 'conversations', icon: MessageSquare, label: 'AI Conversations', color: 'text-pink-400' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.15) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Top Navigation Bar */}
      <motion.nav
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Operational View
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your AI-powered sales operations
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 dark:text-green-300">AI Active</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: 2 min ago
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Sidebar Navigation */}
      <motion.aside
        className="fixed left-6 top-24 bottom-6 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50"
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
      >
        <div className="p-6 h-full flex flex-col">
          <nav className="flex-1 space-y-3">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  activeSection === item.id
                    ? 'bg-blue-500/20 border border-blue-500/30 shadow-lg'
                    : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
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
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.label}
                  </div>
                </div>
              </motion.button>
            ))}
          </nav>

          {/* Help Section */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Need Help?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Contact your account manager for assistance
            </p>
            <button className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
              Request Support
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="ml-72 mr-6 mt-6 mb-6">
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
    </div>
  );
};

export default ClientLayoutShell;