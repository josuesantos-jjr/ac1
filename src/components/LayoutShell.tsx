'use client';

import React, { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface LayoutShellProps {
  children: ReactNode;
  role?: 'super_admin' | 'manager' | 'client';
}

const LayoutShell: React.FC<LayoutShellProps> = ({ children, role }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { data: session } = useSession();

  // Determine sidebar width based on expansion state
  const sidebarWidth = sidebarExpanded ? 280 : 80;

  // Role-based background gradients
  const getBackgroundClasses = () => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900';
      case 'manager':
        return 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900';
      case 'client':
        return 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900';
      default:
        return 'bg-[#1e1e1e]';
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundClasses()}`}>
      {/* Matrix Background Effect for Super Admin */}
      {role === 'super_admin' && (
        <div className="fixed inset-0 opacity-10">
          <div className="matrix-rain"></div>
        </div>
      )}

      {/* Relationship Pulse Background for Manager */}
      {role === 'manager' && (
        <div className="fixed inset-0 opacity-30">
          <div className="pulse-wave"></div>
        </div>
      )}

      {/* Sidebar Dock */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 18,
          mass: 0.8
        }}
        className="fixed left-0 top-0 h-full bg-[#252526]/80 backdrop-blur-2xl border-r border-white/10"
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            {role === 'super_admin' && 'GOD VIEW'}
            {role === 'manager' && 'RELATIONSHIP VIEW'}
            {role === 'client' && 'OPERATIONAL VIEW'}
          </h1>

          {/* Role-specific sidebar content will be added in respective components */}
          <div className="text-white/60 text-sm">
            {role ? `${role.replace('_', ' ').toUpperCase()} MODE` : 'LOADING...'}
          </div>
        </div>
      </motion.aside>

      {/* Header with Backdrop Blur */}
      <header className="fixed top-0 right-0 left-80 h-16 bg-transparent backdrop-blur-3xl border-b border-white/10">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={sidebarExpanded ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
                />
              </svg>
            </button>

            {/* Header Title */}
            <h2 className="text-xl font-semibold text-white">
              {role === 'super_admin' && 'System Control Center'}
              {role === 'manager' && 'Client Relationship Hub'}
              {role === 'client' && 'AI Operations Dashboard'}
            </h2>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="text-white/80 text-sm">
              Welcome, {session?.user?.name || 'User'}
            </div>

            {/* Role Badge */}
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
              {role?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-80 mt-16 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default LayoutShell;