# Visualização Super Admin - "God View" do Sistema CRM SaaS

## Visão Geral da Role

O Super Admin possui acesso total ao sistema, sendo responsável por:
- **Gestão Global**: Configurações system-wide, criação de usuários, dashboards administrativos
- **Monitoramento Neural**: Visualização técnica em tempo real da saúde do sistema
- **Time Travel Debugging**: Capacidade de visualizar estados passados do sistema
- **Controle de Boost Global**: Switches para otimização system-wide

## Análise do Estado Atual vs. Novo Visual

### Estado Atual
- **Acesso**: Dashboard flat compartilhado com outras roles
- **Visual**: Mesmos modais e componentes que managers/clientes
- **Funcionalidades**: Limitadas, sem distinção visual clara
- **Permissões**: Não diferenciadas visualmente

### Novo Visual "God View"
- **Layout Exclusivo**: Interface técnica com elementos Matrix/Terminal
- **Neural Network Map**: Grafo interativo de toda a estrutura organizacional
- **Time Travel Slider**: Controle temporal para debugging histórico
- **Global Boost Controls**: Switches skeuomórficos para ações system-wide

## Impactos Específicos para Super Admin

### Positivos
- **Controle Total Visualizado**: Interface clara mostra poder administrativo completo
- **Debugging Avançado**: Time travel permite resolução rápida de issues
- **Visão Sistêmica**: Neural map facilita compreensão de relacionamentos complexos
- **Ações Imediatas**: Boost controls permitem intervenções rápidas

### Negativos e Soluções
- **Complexidade Visual**: Interface técnica pode intimidar usuários não-técnicos
  - **Solução**: Tooltips explicativos, onboarding contextual, modo simplificado opcional
- **Performance com Dados Grandes**: Neural map com muitos nodes pode lag
  - **Solução**: Virtualização, clustering de nodes, lazy loading de dados
- **Responsabilidade Elevada**: Ações globais podem causar downtime
  - **Solução**: Confirmações duplas, rollback automático, notificações preemptivas

## Planejamento de Implementação Detalhado

### Fase 1: Base Administrativa (Semanas 1-2)

#### 1. Layout Shell Admin
```tsx
// components/admin/AdminLayoutShell.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Shield, Settings, Users, Activity } from 'lucide-react';

const AdminLayoutShell = ({ children }) => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: Shield, label: 'God Dashboard', color: 'text-red-400' },
    { id: 'users', icon: Users, label: 'User Management', color: 'text-blue-400' },
    { id: 'system', icon: Settings, label: 'System Control', color: 'text-green-400' },
    { id: 'monitoring', icon: Activity, label: 'Neural Monitor', color: 'text-purple-400' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Matrix Background Effect */}
      <div className="fixed inset-0 opacity-10">
        <div className="matrix-rain"></div>
      </div>

      {/* Sidebar Técnica */}
      <motion.aside
        className="fixed left-0 top-0 h-full w-80 bg-black/80 backdrop-blur-2xl border-r border-green-500/30"
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-green-400 mb-8 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            GOD VIEW
          </h1>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === item.id
                    ? 'bg-green-500/20 border border-green-500/50'
                    : 'hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-white">{item.label}</span>
              </motion.button>
            ))}
          </nav>
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
    </div>
  );
};
```

#### 2. Sistema de Criação de Usuários
```tsx
// components/admin/UserCreationWizard.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const UserCreationWizard = () => {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    role: 'manager', // manager ou client
    permissions: [],
    assignedManager: '' // para clients
  });

  const handleCreateUser = async () => {
    try {
      // API call para criar usuário
      const response = await axios.post('/api/auth/create-user', {
        ...userData,
        createdBy: 'super_admin'
      });

      // Notificação de sucesso com confetti
      // Redirecionar ou mostrar sucesso
    } catch (error) {
      // Handle error
    }
  };

  const steps = [
    { title: 'Informações Básicas', fields: ['email', 'password'] },
    { title: 'Definição de Role', fields: ['role'] },
    { title: 'Permissões Específicas', fields: ['permissions'] },
    { title: 'Atribuições', fields: ['assignedManager'] }
  ];

  return (
    <motion.div
      className="max-w-2xl mx-auto bg-black/50 backdrop-blur-xl rounded-xl p-8 border border-green-500/30"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {/* Wizard Header */}
      <div className="flex justify-between items-center mb-8">
        {steps.map((s, index) => (
          <motion.div
            key={index}
            className={`flex items-center ${index < step ? 'text-green-400' : index === step ? 'text-blue-400' : 'text-gray-600'}`}
            animate={{ scale: index + 1 === step ? 1.1 : 1 }}
          >
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
              index < step ? 'border-green-400 bg-green-400/20' :
              index === step ? 'border-blue-400 bg-blue-400/20' :
              'border-gray-600'
            }`}>
              {index + 1}
            </div>
            <span className="hidden md:block">{s.title}</span>
          </motion.div>
        ))}
      </div>

      {/* Form Steps */}
      <div className="min-h-64">
        {step === 1 && (
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h3 className="text-xl text-white mb-4">Informações Básicas</h3>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white mb-4"
              value={userData.email}
              onChange={(e) => setUserData({...userData, email: e.target.value})}
            />
            <input
              type="password"
              placeholder="Senha Temporária"
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              value={userData.password}
              onChange={(e) => setUserData({...userData, password: e.target.value})}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h3 className="text-xl text-white mb-4">Tipo de Usuário</h3>
            <div className="space-y-3">
              {['manager', 'client'].map((role) => (
                <label key={role} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={userData.role === role}
                    onChange={(e) => setUserData({...userData, role: e.target.value})}
                    className="text-green-400"
                  />
                  <span className="text-white capitalize">{role}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h3 className="text-xl text-white mb-4">Permissões Específicas</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                'create_clients', 'view_reports', 'manage_backups',
                'system_monitoring', 'user_management', 'global_settings'
              ].map((perm) => (
                <label key={perm} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={userData.permissions.includes(perm)}
                    onChange={(e) => {
                      const newPerms = userData.permissions.includes(perm)
                        ? userData.permissions.filter(p => p !== perm)
                        : [...userData.permissions, perm];
                      setUserData({...userData, permissions: newPerms});
                    }}
                    className="text-green-400"
                  />
                  <span className="text-white text-sm">{perm.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h3 className="text-xl text-white mb-4">Atribuições</h3>
            {userData.role === 'client' && (
              <select
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                value={userData.assignedManager}
                onChange={(e) => setUserData({...userData, assignedManager: e.target.value})}
              >
                <option value="">Selecionar Manager</option>
                {/* Options populated from API */}
              </select>
            )}
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
        >
          Anterior
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Próximo
          </button>
        ) : (
          <motion.button
            onClick={handleCreateUser}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Criar Usuário
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
```

### Fase 2: Neural Network Map (Semanas 3-4)

#### 1. Componente Neural Map
```tsx
// components/admin/NeuralNetworkMap.tsx
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

const NeuralNetworkMap = () => {
  const svgRef = useRef(null);
  const [data, setData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    // Fetch organizational data
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const response = await axios.get('/api/admin/neural-network');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching network data:', error);
    }
  };

  useEffect(() => {
    if (!data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    // Clear previous render
    svg.selectAll('*').remove();

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', d => d.churnRisk ? '#ef4444' : '#10b981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => d.churnRisk ? '5,5' : 'none');

    // Create nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', d => d.type === 'manager' ? 20 : d.type === 'client' ? 15 : 25)
      .attr('fill', d => {
        switch(d.type) {
          case 'super_admin': return '#ef4444';
          case 'manager': return '#3b82f6';
          case 'client': return '#10b981';
          default: return '#6b7280';
        }
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .on('click', (event, d) => setSelectedNode(d))
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add labels
    const labels = svg.append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('fill', '#ffffff')
      .attr('text-anchor', 'middle')
      .attr('dy', 35);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // Add zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        svg.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

  }, [data]);

  return (
    <div className="relative w-full h-96 bg-black/50 backdrop-blur-xl rounded-xl border border-green-500/30 overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-black/80 p-3 rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-white">Super Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-white">Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-white">Client</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Zoom: {Math.round(zoom * 100)}% | Drag nodes to reposition
        </div>
      </div>

      <svg ref={svgRef} width="100%" height="100%" className="cursor-move">
        {/* D3 will populate this */}
      </svg>

      {/* Node Details Panel */}
      {selectedNode && (
        <motion.div
          className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-xl p-4 rounded-lg border border-green-500/30 max-w-xs"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h3 className="text-white font-bold mb-2">{selectedNode.name}</h3>
          <p className="text-gray-300 text-sm mb-2">Type: {selectedNode.type}</p>
          {selectedNode.churnRisk && (
            <p className="text-red-400 text-sm">⚠️ High Churn Risk</p>
          )}
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-2 px-3 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
          >
            Close
          </button>
        </motion.div>
      )}
    </div>
  );
};
```

#### 2. Time Travel Slider
```tsx
// components/admin/TimeTravelSlider.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const TimeTravelSlider = ({ onTimeChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const minTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const maxTime = new Date();

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = new Date(prev.getTime() + speed * 60 * 1000); // Advance by speed minutes
          if (newTime > maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  useEffect(() => {
    onTimeChange(currentTime);
  }, [currentTime, onTimeChange]);

  const handleSliderChange = (e) => {
    const timestamp = parseInt(e.target.value);
    setCurrentTime(new Date(timestamp));
  };

  const formatTime = (date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      className="bg-black/80 backdrop-blur-xl rounded-xl p-6 border border-green-500/30"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-green-400" />
        Time Travel Debugger
      </h3>

      <div className="space-y-4">
        {/* Current Time Display */}
        <div className="text-center">
          <div className="text-2xl text-green-400 font-mono">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-gray-400">
            {currentTime > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 'Recent' : 'Historical'}
          </div>
        </div>

        {/* Time Slider */}
        <div className="relative">
          <input
            type="range"
            min={minTime.getTime()}
            max={maxTime.getTime()}
            value={currentTime.getTime()}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-green"
          />

          {/* Time markers */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(minTime)}</span>
            <span>{formatTime(maxTime)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentTime(maxTime)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Now
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 rounded text-sm ${
              isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>

          <select
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
          >
            <option value={1}>1x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
            <option value={60}>1h/min</option>
          </select>
        </div>

        {/* Warning */}
        <div className="text-yellow-400 text-sm text-center bg-yellow-400/10 p-2 rounded">
          ⚠️ Time travel shows historical data. Actions may not be available.
        </div>
      </div>
    </motion.div>
  );
};
```

### Fase 3: Global Boost Controls (Semanas 5-6)

#### 1. Boost Controls Component
```tsx
// components/admin/GlobalBoostControls.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCw, Database, Cpu } from 'lucide-react';
import axios from 'axios';

const GlobalBoostControls = () => {
  const [boosts, setBoosts] = useState({
    iaRetraining: false,
    cacheFlush: false,
    backupOptimize: false,
    systemTune: false
  });

  const [loading, setLoading] = useState({});

  const handleBoostToggle = async (boostType, enabled) => {
    setLoading(prev => ({ ...prev, [boostType]: true }));

    try {
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
      description: 'Force immediate retraining of all IA models',
      icon: Cpu,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/50'
    },
    {
      id: 'cacheFlush',
      label: 'Global Cache Flush',
      description: 'Clear all system caches for fresh data',
      icon: Database,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/50'
    },
    {
      id: 'backupOptimize',
      label: 'Backup Optimization',
      description: 'Optimize and compress backup storage',
      icon: RefreshCw,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50'
    },
    {
      id: 'systemTune',
      label: 'System Auto-Tune',
      description: 'Automatically optimize system performance',
      icon: Zap,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {boostOptions.map((boost) => (
        <motion.div
          key={boost.id}
          className={`p-6 rounded-xl border ${boost.bgColor} ${boost.borderColor} backdrop-blur-xl`}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <boost.icon className={`w-8 h-8 ${boost.color}`} />
              <div>
                <h3 className={`font-bold ${boost.color}`}>{boost.label}</h3>
                <p className="text-gray-300 text-sm">{boost.description}</p>
              </div>
            </div>

            <motion.button
              onClick={() => handleBoostToggle(boost.id, !boosts[boost.id])}
              disabled={loading[boost.id]}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                boosts[boost.id] ? boost.bgColor.replace('/20', '/40') : 'bg-gray-600'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className={`absolute top-1 w-6 h-6 rounded-full shadow-md ${
                  boosts[boost.id] ? 'bg-white right-1' : 'bg-gray-400 left-1'
                }`}
                layout
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
            <div className={`w-2 h-2 rounded-full ${boosts[boost.id] ? 'bg-green-400' : 'bg-gray-500'}`}></div>
            <span className={boosts[boost.id] ? 'text-green-400' : 'text-gray-500'}>
              {boosts[boost.id] ? 'Active' : 'Inactive'}
            </span>
          </div>
        </motion.div>
      ))}

      {/* System Status Overview */}
      <motion.div
        className="md:col-span-2 bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-green-500/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-white text-lg font-bold mb-4">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl text-green-400">98%</div>
            <div className="text-sm text-gray-400">System Health</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-blue-400">1.2s</div>
            <div className="text-sm text-gray-400">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-purple-400">24</div>
            <div className="text-sm text-gray-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-yellow-400">99.9%</div>
            <div className="text-sm text-gray-400">Uptime</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
```

### Fase 4: System Neural Monitor (Semanas 7-8)

#### 1. Real-time Monitoring Dashboard
```tsx
// components/admin/SystemNeuralMonitor.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react';

const SystemNeuralMonitor = () => {
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

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 15)),
        apiLatency: Math.max(100, Math.min(1000, prev.apiLatency + (Math.random() - 0.5) * 50)),
        aiConfidence: Math.max(70, Math.min(95, prev.aiConfidence + (Math.random() - 0.5) * 2)),
        activeConnections: Math.max(100, Math.min(200, prev.activeConnections + Math.floor((Math.random() - 0.5) * 10))),
        errorRate: Math.max(0, Math.min(1, prev.errorRate + (Math.random() - 0.5) * 0.01))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ title, value, unit, icon: Icon, color, status }) => (
    <motion.div
      className="bg-black/50 backdrop-blur-xl rounded-lg p-4 border border-gray-700/50"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-sm font-medium ${status === 'good' ? 'text-green-400' : status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
          {status === 'good' ? '✓' : status === 'warning' ? '⚠' : '✗'}
        </span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {typeof value === 'number' && unit === '%' ? `${Math.round(value)}` : value}{unit}
      </div>
      <div className="text-sm text-gray-400">{title}</div>
      {unit === '%' && (
        <div className="mt-2 bg-gray-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${color.replace('bg-', 'bg-')}`}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </motion.div>
  );

  const getStatus = (value, thresholds) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-8 h-8 text-green-400" />
        <h2 className="text-2xl font-bold text-white">System Neural Monitor</h2>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Usage"
          value={metrics.cpu}
          unit="%"
          icon={Cpu}
          color="bg-red-500/20 text-red-400"
          status={getStatus(metrics.cpu, { good: 70, warning: 85 })}
        />
        <MetricCard
          title="Memory"
          value={metrics.memory}
          unit="%"
          icon={HardDrive}
          color="bg-blue-500/20 text-blue-400"
          status={getStatus(metrics.memory, { good: 80, warning: 90 })}
        />
        <MetricCard
          title="Network I/O"
          value={metrics.network}
          unit="%"
          icon={Wifi}
          color="bg-purple-500/20 text-purple-400"
          status={getStatus(metrics.network, { good: 60, warning: 80 })}
        />
        <MetricCard
          title="API Latency"
          value={metrics.apiLatency}
          unit="ms"
          icon={Activity}
          color="bg-green-500/20 text-green-400"
          status={getStatus(metrics.apiLatency, { good: 300, warning: 500 })}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="AI Confidence"
          value={metrics.aiConfidence}
          unit="%"
          icon={Activity}
          color="bg-yellow-500/20 text-yellow-400"
          status={getStatus(metrics.aiConfidence, { good: 85, warning: 75 })}
        />
        <MetricCard
          title="Active Connections"
          value={metrics.activeConnections}
          unit=""
          icon={Wifi}
          color="bg-indigo-500/20 text-indigo-400"
          status="good"
        />
        <MetricCard
          title="Error Rate"
          value={metrics.errorRate}
          unit="%"
          icon={Activity}
          color="bg-red-500/20 text-red-400"
          status={getStatus(metrics.errorRate * 100, { good: 0.1, warning: 1 })}
        />
        <MetricCard
          title="System Load"
          value={Math.round((metrics.cpu + metrics.memory + metrics.network) / 3)}
          unit="%"
          icon={Cpu}
          color="bg-orange-500/20 text-orange-400"
          status={getStatus((metrics.cpu + metrics.memory + metrics.network) / 3, { good: 60, warning: 75 })}
        />
      </div>

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
                item.type === 'danger' ? 'bg-red-400' : 'bg-blue-400'
              }`} />
              <span className="text-xs text-gray-500 font-mono">{item.time}</span>
              <span className="text-sm text-white flex-1">{item.event}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
```

## Funções Existentes e Novas

### Funções Existentes Integradas
- **NextAuth**: Autenticação e autorização para criação de usuários
- **Backup APIs**: Integração com backup-scheduler para exportações automáticas
- **CRM Components**: Visualização de dados organizacionais no Neural Map
- **System Monitoring**: Extensão dos monitoring services existentes

### Novas Funcionalidades Específicas
- **User Creation Wizard**: Fluxo guiado para criação de managers e clients
- **Neural Network Map**: Visualização D3.js da estrutura organizacional
- **Time Travel Debugging**: Slider temporal para análise histórica
- **Global Boost Controls**: Switches para ações system-wide
- **System Neural Monitor**: Dashboard em tempo real de métricas

### APIs Necessárias
```javascript
// /api/admin/neural-network
GET - Retorna dados do grafo organizacional

// /api/admin/global-boost
POST - Executa ações de boost global

// /api/admin/time-travel
GET - Retorna dados históricos por timestamp

// /api/auth/create-user
POST - Cria usuários com validações hierárquicas
```

### Permissões Hierárquicas
```
Super Admin
├── Pode criar Managers (login/senha)
├── Pode criar Clients (login/senha)
├── Acesso total a todas as funções
├── View As qualquer role
└── Global system controls

Manager (criado por Super Admin)
└── Pode criar Clients apenas para sua carteira
    ├── Validação automática de assignment
    └── Permissões limitadas ao seu scope
```

### Considerações de Segurança
- **Audit Logging**: Todas as ações do Super Admin são logadas
- **Two-Factor Authentication**: Obrigatório para Super Admin
- **IP Whitelisting**: Acesso restrito a IPs autorizados
- **Session Management**: Timeouts curtos e invalidação automática

Este planejamento detalhado estabelece uma interface verdadeiramente poderosa para o Super Admin, combinando elementos técnicos avançados com usabilidade intuitiva.