'use client';

import React, { useState } from 'react';
import ClientLayoutShell from './ClientLayoutShell';
import ClientDashboardPulse from './ClientDashboardPulse';
import ClientSalesPipeline from './ClientSalesPipeline';
import ClientAssetsVault from './ClientAssetsVault';
import ClientForecast from './ClientForecast';
import ClientConversations from './ClientConversations';

type Section = 'dashboard' | 'pipeline' | 'assets' | 'forecast' | 'conversations';

const ClientDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <ClientDashboardPulse />;
      case 'pipeline':
        return <ClientSalesPipeline />;
      case 'assets':
        return <ClientAssetsVault />;
      case 'forecast':
        return <ClientForecast />;
      case 'conversations':
        return <ClientConversations />;
      default:
        return <ClientDashboardPulse />;
    }
  };

  return (
    <ClientLayoutShell
      activeSection={activeSection}
      setActiveSection={setActiveSection}
    >
      {renderActiveSection()}
    </ClientLayoutShell>
  );
};

export default ClientDashboard;