'use client';

import React, { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Shield, Settings, Users, Activity, Zap } from 'lucide-react';

interface AdminLayoutShellProps {
  children: ReactNode;
}

const AdminLayoutShell: React.FC<AdminLayoutShellProps> = ({ children }) => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: Shield, label: 'God Dashboard', color: 'text-red-400' },
    { id: 'users', icon: Users, label: 'User Management', color: 'text-blue-400' },
    { id: 'system', icon: Settings, label: 'System Control', color: 'text-green-400' },
    { id: 'monitoring', icon: Activity, label: 'Neural Monitor', color: 'text-purple-400' },
    { id: 'boost', icon: Zap, label: 'Global Boost', color: 'text-yellow-400' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Matrix Background Effect */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated Matrix rain effect */}
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute text-green-500 font-mono text-xs opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                animation: `matrix-fall ${2 + Math.random() * 3}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              {Array.from({ length: 20 }, (_, j) => (
                <div key={j} className="leading-none">
                  {Math.random() > 0.5 ? '1' : '0'}
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sidebar Técnica */}
      <motion.aside
        className="fixed left-0 top-0 h-full w-80 bg-black/80 backdrop-blur-2xl border-r border-green-500/30"
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="mb-8">
            <motion.h1
              className="text-2xl font-bold text-green-400 mb-2 flex items-center gap-2"
              animate={{
                textShadow: [
                  '0 0 5px #10b981',
                  '0 0 10px #10b981',
                  '0 0 15px #10b981',
                  '0 0 10px #10b981'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="w-8 h-8" />
              GOD VIEW
            </motion.h1>
            <p className="text-sm text-gray-400">
              System Administrator Control Center
            </p>
          </div>

          {/* System Status Indicator */}
          <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">System Status</span>
              <motion.div
                className="w-2 h-2 bg-green-400 rounded-full"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="text-xs text-green-400 font-mono">
              ALL SYSTEMS OPERATIONAL
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                  activeSection === item.id
                    ? 'bg-green-500/20 border border-green-500/50 shadow-lg shadow-green-500/20'
                    : 'hover:bg-white/5 hover:border-green-500/20'
                }`}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <item.icon className={`w-6 h-6 ${item.color}`} />
                <div className="text-left">
                  <div className={`font-medium ${
                    activeSection === item.id ? 'text-green-300' : 'text-gray-300'
                  }`}>
                    {item.label}
                  </div>
                  {activeSection === item.id && (
                    <motion.div
                      className="w-full h-0.5 bg-green-400 rounded-full mt-1"
                      layoutId="activeIndicator"
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </nav>

          {/* Admin Info */}
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">SA</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  System Administrator
                </div>
                <div className="text-xs text-gray-400">
                  Full System Access
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-green-400 font-bold">24</div>
                <div className="text-gray-400">Active Users</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-blue-400 font-bold">99.9%</div>
                <div className="text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

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

      {/* Matrix CSS Animation */}
      <style jsx>{`
        @keyframes matrix-fall {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
};

export default AdminLayoutShell;