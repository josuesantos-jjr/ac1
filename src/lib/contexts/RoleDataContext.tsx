'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RoleDataContextType {
  // Super Admin data
  adminStats: any;
  setAdminStats: (data: any) => void;

  // Manager data
  managerPortfolio: any[];
  setManagerPortfolio: (data: any[]) => void;
  managerClients: any[];
  setManagerClients: (data: any[]) => void;

  // Client data
  clientDashboard: any;
  setClientDashboard: (data: any) => void;
  clientAssets: any[];
  setClientAssets: (data: any[]) => void;
}

const RoleDataContext = createContext<RoleDataContextType | undefined>(undefined);

export const useRoleData = () => {
  const context = useContext(RoleDataContext);
  if (!context) {
    throw new Error('useRoleData must be used within a RoleDataProvider');
  }
  return context;
};

interface RoleDataProviderProps {
  children: ReactNode;
}

export const RoleDataProvider: React.FC<RoleDataProviderProps> = ({ children }) => {
  // Super Admin state
  const [adminStats, setAdminStats] = useState(null);

  // Manager state
  const [managerPortfolio, setManagerPortfolio] = useState<any[]>([]);
  const [managerClients, setManagerClients] = useState<any[]>([]);

  // Client state
  const [clientDashboard, setClientDashboard] = useState<any>(null);
  const [clientAssets, setClientAssets] = useState<any[]>([]);

  const value = {
    // Super Admin
    adminStats,
    setAdminStats,

    // Manager
    managerPortfolio,
    setManagerPortfolio,
    managerClients,
    setManagerClients,

    // Client
    clientDashboard,
    setClientDashboard,
    clientAssets,
    setClientAssets,
  };

  return (
    <RoleDataContext.Provider value={value}>
      {children}
    </RoleDataContext.Provider>
  );
};