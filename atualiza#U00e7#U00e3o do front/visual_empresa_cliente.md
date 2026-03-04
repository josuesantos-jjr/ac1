# Visualização Empresa Cliente - "Operational View" do Sistema CRM SaaS

## Visão Geral da Role

A Empresa Cliente possui acesso operacional simplificado, focando em dashboards essenciais para acompanhar o progresso das vendas e interações da IA. Sem controles administrativos, a interface enfatiza transparência e facilidade de uso.

## Análise do Estado Atual vs. Novo Visual

### Estado Atual
- **Acesso Compartilhado**: Mesmo dashboard administrativo
- **Complexidade Desnecessária**: Funcionalidades técnicas expostas
- **Falta de Foco**: Interface não otimizada para acompanhamento operacional

### Novo Visual "Operational View"
- **Dashboard Pulse**: Radar mostrando atividade da IA em tempo real
- **Pipeline Simplificado**: Visualizações claras do funil de vendas
- **Assets Vault**: Biblioteca de materiais enviados pela IA
- **Forecast Horizon**: Projeções de vendas baseadas em IA

## Impactos Específicos para Empresa Cliente

### Positivos
- **Transparência Total**: Visibilidade completa das ações da IA
- **Simplicidade Operacional**: Interface limpa focada no essencial
- **Engajamento Ativo**: Possibilidade de assumir controle quando necessário
- **Insights Valiosos**: Métricas claras de performance

### Negativos e Soluções
- **Perda de Controle Detalhado**: Não pode configurar regras complexas
  - **Solução**: Comunicação clara com manager para mudanças
- **Dependência da IA**: Resultados limitados à configuração do manager
  - **Solução**: Canal direto para feedback e ajustes
- **Informação Overload**: Muitos dados podem confundir
  - **Solução**: Dashboards progressivos, tooltips explicativos

## Planejamento de Implementação Detalhado

### Fase 1: Layout e Navegação Cliente (Semanas 1-2)

#### 1. Client Layout Shell
```tsx
// components/client/ClientLayoutShell.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Activity, BarChart3, FileText, TrendingUp, MessageSquare } from 'lucide-react';

const ClientLayoutShell = ({ children }) => {
  const [activeSection, setActiveSection] = useState('dashboard');

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
            {menuItems.map((item) => (
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
```

#### 2. Dashboard Pulse Component
```tsx
// components/client/DashboardPulse.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radar, Activity, Users, MessageSquare, Target } from 'lucide-react';

const DashboardPulse = () => {
  const [pulseData, setPulseData] = useState({
    aiActivity: 85,
    activeConversations: 12,
    leadsGenerated: 8,
    conversionRate: 23,
    currentStage: 'Qualification',
    recentActivities: []
  });

  useEffect(() => {
    fetchPulseData();
    const interval = setInterval(fetchPulseData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPulseData = async () => {
    try {
      const response = await axios.get('/api/client/dashboard-pulse');
      setPulseData(response.data);
    } catch (error) {
      console.error('Error fetching pulse data:', error);
    }
  };

  const metrics = [
    {
      label: 'AI Activity',
      value: pulseData.aiActivity,
      unit: '%',
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      description: 'Current AI engagement level'
    },
    {
      label: 'Active Conversations',
      value: pulseData.activeConversations,
      unit: '',
      icon: MessageSquare,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      description: 'Ongoing AI chats'
    },
    {
      label: 'Leads Generated',
      value: pulseData.leadsGenerated,
      unit: '',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/20',
      description: 'New leads this week'
    },
    {
      label: 'Conversion Rate',
      value: pulseData.conversionRate,
      unit: '%',
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/20',
      description: 'Lead to opportunity rate'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.h2
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Dashboard Pulse
        </motion.h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time view of your AI sales operations
        </p>
      </div>

      {/* Central Radar */}
      <motion.div
        className="flex justify-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          {/* Radar Background */}
          <div className="w-64 h-64 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
            <div className="w-48 h-48 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center">
              <Radar className="w-24 h-24 text-blue-500" />
            </div>
          </div>

          {/* Pulsing Rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-500/30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border border-purple-500/20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0, 0.2]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />

          {/* Status Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                AI Active
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Working on: {pulseData.currentStage}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}{metric.unit}
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {metric.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metric.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activities Feed */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Recent AI Activities
        </h3>
        <div className="space-y-4">
          {pulseData.recentActivities.map((activity, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`w-3 h-3 rounded-full ${
                activity.type === 'lead' ? 'bg-green-500' :
                activity.type === 'message' ? 'bg-blue-500' :
                activity.type === 'meeting' ? 'bg-purple-500' : 'bg-gray-500'
              }`}></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {activity.description}
                </p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {activity.time}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
```

### Fase 2: Pipeline Multi-View Implementation (Semanas 3-4)

#### 1. Pipeline Multi-View Component
```tsx
// components/client/PipelineMultiView.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Kanban, Table, Calendar, Eye } from 'lucide-react';

const PipelineMultiView = () => {
  const [currentView, setCurrentView] = useState('kanban');

  const views = [
    { id: 'kanban', label: 'Kanban', icon: Kanban },
    { id: 'spreadsheet', label: 'Spreadsheet', icon: Table },
    { id: 'calendar', label: 'Calendar', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center gap-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {views.map((view) => (
          <motion.button
            key={view.id}
            onClick={() => setCurrentView(view.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              currentView === view.id
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <view.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{view.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {currentView === 'kanban' && (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <KanbanView />
          </motion.div>
        )}

        {currentView === 'spreadsheet' && (
          <motion.div
            key="spreadsheet"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SpreadsheetView />
          </motion.div>
        )}

        {currentView === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CalendarView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Kanban View Component
const KanbanView = () => {
  const [stages] = useState([
    { id: 'prospect', title: 'Prospects', color: 'bg-gray-500', leads: [] },
    { id: 'contact', title: 'Initial Contact', color: 'bg-blue-500', leads: [] },
    { id: 'qualification', title: 'Qualification', color: 'bg-yellow-500', leads: [] },
    { id: 'proposal', title: 'Proposal', color: 'bg-purple-500', leads: [] },
    { id: 'closing', title: 'Closing', color: 'bg-green-500', leads: [] }
  ]);

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {stages.map((stage, index) => (
        <motion.div
          key={stage.id}
          className="flex-shrink-0 w-80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{stage.title}</h3>
              <span className="ml-auto text-sm text-gray-500">{stage.leads.length}</span>
            </div>
            <div className="space-y-3">
              {stage.leads.map((lead) => (
                <motion.div
                  key={lead.id}
                  className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                  whileHover={{ scale: 1.02 }}
                  layout
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">{lead.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{lead.company}</p>
                  <p className="text-xs text-gray-500 mt-1">{lead.lastActivity}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Spreadsheet View Component
const SpreadsheetView = () => {
  const [leads] = useState([]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Activity</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {leads.map((lead, index) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{lead.name}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{lead.company}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {lead.stage}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{lead.value}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{lead.lastActivity}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Calendar View Component
const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events] = useState([]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Calendar</h3>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            ←
          </button>
          <span className="font-medium text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Days of week */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {Array.from({ length: 35 }, (_, i) => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - currentDate.getDay() + 1);
          const dayEvents = events.filter(event => event.date.toDateString() === date.toDateString());

          return (
            <motion.div
              key={i}
              className={`min-h-24 p-2 border border-gray-200 dark:border-gray-700 rounded-lg ${
                date.getMonth() === currentDate.getMonth() ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event, idx) => (
                  <div key={idx} className="text-xs p-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
```

### Fase 3: Assets Vault e Forecast Horizon (Semanas 5-6)

#### 1. Assets Vault Component
```tsx
// components/client/AssetsVault.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, Video, Download, Eye, BarChart } from 'lucide-react';

const AssetsVault = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/client/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const getAssetIcon = (type) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'image': return Image;
      case 'video': return Video;
      default: return FileText;
    }
  };

  const getAssetColor = (type) => {
    switch (type) {
      case 'pdf': return 'text-red-500 bg-red-500/20';
      case 'image': return 'text-blue-500 bg-blue-500/20';
      case 'video': return 'text-green-500 bg-green-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assets Vault</h2>
          <p className="text-gray-600 dark:text-gray-400">Materials sent by AI to leads</p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {assets.length} assets • Updated 5 min ago
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset, index) => {
          const IconComponent = getAssetIcon(asset.type);

          return (
            <motion.div
              key={asset.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${getAssetColor(asset.type)}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>{asset.sentCount} sent</div>
                  <div>{asset.openRate}% opened</div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {asset.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {asset.description}
                </p>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Open Rate</span>
                  <span className="font-medium text-gray-900 dark:text-white">{asset.openRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${asset.openRate}%` }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedAsset(asset)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Performance Overview */}
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <BarChart className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Overall Performance
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {assets.reduce((sum, asset) => sum + asset.sentCount, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Math.round(assets.reduce((sum, asset) => sum + asset.openRate, 0) / assets.length) || 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Open Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {assets.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Assets</div>
          </div>
        </div>
      </motion.div>

      {/* Asset Preview Modal */}
      {selectedAsset && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedAsset(null)}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedAsset.name}
                </h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Asset Preview */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-96 flex items-center justify-center mb-4">
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>Preview not available</p>
                  <p className="text-sm">Download to view content</p>
                </div>
              </div>

              {/* Asset Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedAsset.sentCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Times Sent</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {selectedAsset.openRate}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Open Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {selectedAsset.clickRate || 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Click Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {selectedAsset.conversionRate || 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Conversion</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
```

#### 2. Forecast Horizon Component
```tsx
// components/client/ForecastHorizon.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Calendar, DollarSign } from 'lucide-react';

const ForecastHorizon = () => {
  const [forecastData, setForecastData] = useState({
    currentSales: 45000,
    projectedSales: 67500,
    confidence: 78,
    timeline: [
      { month: 'Jan', actual: 42000, projected: 45000 },
      { month: 'Feb', actual: 38000, projected: 48000 },
      { month: 'Mar', actual: null, projected: 52000 },
      { month: 'Apr', actual: null, projected: 55000 },
      { month: 'May', actual: null, projected: 58000 },
      { month: 'Jun', actual: null, projected: 61000 }
    ],
    keyFactors: [
      { factor: 'Lead Quality', impact: '+15%', confidence: 85 },
      { factor: 'Market Conditions', impact: '+8%', confidence: 72 },
      { factor: 'Seasonal Trends', impact: '+12%', confidence: 90 },
      { factor: 'Competition', impact: '-5%', confidence: 65 }
    ]
  });

  const growthRate = ((forecastData.projectedSales - forecastData.currentSales) / forecastData.currentSales * 100).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.h2
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Forecast Horizon
        </motion.h2>
        <p className="text-gray-600 dark:text-gray-400">
          AI-powered sales projections and insights
        </p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Sales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${forecastData.currentSales.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Projected Sales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${forecastData.projectedSales.toLocaleString()}
              </p>
              <p className={`text-sm ${growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthRate > 0 ? '+' : ''}{growthRate}% growth
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Target className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI Confidence</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {forecastData.confidence}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <motion.div
                  className="bg-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${forecastData.confidence}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forecast Chart */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sales Projection Timeline</h3>

        <div className="space-y-4">
          {forecastData.timeline.map((month, index) => (
            <div key={month.month} className="flex items-center gap-4">
              <div className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400">
                {month.month}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {month.actual ? `Actual: $${month.actual.toLocaleString()}` : `Projected: $${month.projected.toLocaleString()}`}
                  </span>
                  {month.actual && (
                    <span className="text-xs text-green-600 font-medium">✓ Confirmed</span>
                  )}
                </div>

                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <motion.div
                      className={`h-3 rounded-full ${month.actual ? 'bg-green-500' : 'bg-blue-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(month.actual || month.projected) / 70000 * 100}%` }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                    />
                  </div>

                  {/* Dotted projection line */}
                  {!month.actual && (
                    <div
                      className="absolute top-0 h-3 border-l-2 border-dashed border-blue-400"
                      style={{ left: `${(forecastData.currentSales / 70000 * 100)}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Actual Sales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Projected Sales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-0.5 bg-blue-400 border-t border-dashed"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Projection Start</span>
          </div>
        </div>
      </motion.div>

      {/* Key Factors */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Key Influencing Factors</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forecastData.keyFactors.map((factor, index) => (
            <motion.div
              key={factor.factor}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.6 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{factor.factor}</h4>
                <span className={`text-sm font-medium ${
                  factor.impact.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {factor.impact}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-600 dark:text-gray-400">Confidence:</div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${factor.confidence}%` }}
                    transition={{ delay: index * 0.1 + 0.8, duration: 0.6 }}
                  />
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {factor.confidence}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
```

### Fase 4: Conversas IA e Central de Atendimento (Semanas 7-8)

#### 1. AI Conversations Component
```tsx
// components/client/AIConversations.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, User, Bot, Phone, AlertTriangle } from 'lucide-react';

const AIConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/client/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`/api/client/conversations/${conversationId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'client',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: "I'm taking over this conversation. How can I help you?",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const takeOverConversation = async () => {
    try {
      await axios.post(`/api/client/conversations/${selectedConversation.id}/takeover`);
      // Refresh conversation status
      fetchConversations();
    } catch (error) {
      console.error('Error taking over conversation:', error);
    }
  };

  return (
    <div className="h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      <div className="flex h-full">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Conversations</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {conversations.length} active chats
            </p>
          </div>

          <div className="overflow-y-auto h-full">
            {conversations.map((conv, index) => (
              <motion.button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {conv.contactName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    conv.status === 'active' ? 'bg-green-500' :
                    conv.status === 'waiting' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{conv.timeAgo}</span>
                  {conv.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {selectedConversation.contactName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedConversation.status === 'ai_active' ? 'AI is responding' : 'Waiting for response'}
                      </p>
                    </div>
                  </div>

                  {selectedConversation.status === 'ai_active' && (
                    <motion.button
                      onClick={takeOverConversation}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Phone className="w-4 h-4" />
                      Take Over
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'client'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <p>{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'client' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-1">
                        <Bot className="w-4 h-4 text-gray-500" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <motion.button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p>Choose a conversation from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

## Funções Existentes e Novas

### Funções Existentes Integradas
- **APIs de Conversa**: Integração com histórico de mensagens existentes
- **CRM Data**: Visualização de leads e contatos
- **Authentication**: Login via NextAuth

### Novas Funcionalidades Específicas
- **Dashboard Pulse**: Radar animado mostrando atividade da IA
- **Pipeline Multi-View**: Kanban, Spreadsheet e Calendar views
- **Assets Vault**: Galeria de materiais enviados pela IA
- **Forecast Horizon**: Projeções de vendas com IA
- **AI Conversations**: Interface iMessage-style com botão "Take Over"

### APIs Necessárias
```javascript
// /api/client/dashboard-pulse
GET - Dados para dashboard em tempo real

// /api/client/pipeline
GET - Dados do funil de vendas

// /api/client/assets
GET - Lista de assets enviados

// /api/client/forecast
GET - Projeções de vendas

// /api/client/conversations
GET - Lista de conversas ativas

// /api/client/conversations/[id]/takeover
POST - Assumir controle da conversa
```

### Permissões Hierárquicas
```
Cliente (criado por Manager ou Super Admin)
├── Visualização apenas da própria empresa
├── Sem acesso a configurações
├── Sem criação de usuários
├── Comunicação direta com AI
└── Relatórios limitados aos próprios dados
```

### Considerações de Segurança
- **Data Isolation**: Clientes só veem dados da própria empresa
- **Audit Trail**: Todas as ações do cliente são logadas
- **Rate Limiting**: Limites para assumir conversas e enviar mensagens
- **Content Filtering**: Validação de mensagens enviadas

Este planejamento cria uma experiência operacional limpa e focada, permitindo ao cliente acompanhar o progresso das vendas impulsionadas por IA sem complexidade técnica desnecessária.