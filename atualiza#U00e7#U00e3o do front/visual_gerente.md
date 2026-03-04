# Visualização Account Manager - "Relationship View" do Sistema CRM SaaS

## Visão Geral da Role

O Account Manager possui permissões intermediárias, focando em gestão de equipe e relatórios limitados. Responsável por:
- **Gestão de Carteira**: Clientes atribuídos ao seu gerenciamento
- **Criação de Clientes**: Apenas para sua própria carteira com validações automáticas
- **Relacionamento**: Monitoramento de saúde dos relacionamentos com clientes
- **Onboarding**: Processo guiado para novos clientes

## Análise do Estado Atual vs. Novo Visual

### Estado Atual
- **Acesso Compartilhado**: Mesmo dashboard que Super Admin e Clients
- **Funcionalidades Limitadas**: Sem distinção visual clara de permissões
- **Relacionamento Passivo**: Sem indicadores visuais de saúde do relacionamento

### Novo Visual "Relationship View"
- **Morning Ritual**: Interface de stories com swipe para revisão diária
- **Customer Journey Timeline**: Trajeto visual do cliente com status animados
- **Relationship Pulse**: Indicadores visuais de engajamento e saúde
- **Impersonation Mode**: Visualização como cliente com bordas diferenciadas

## Impactos Específicos para Account Manager

### Positivos
- **Foco no Relacionamento**: Interface dedicada ao acompanhamento de clientes
- **Produtividade Diária**: Morning ritual agiliza revisão de carteira
- **Visibilidade de Saúde**: Indicadores visuais facilitam identificação de problemas
- **Empatia com Cliente**: Impersonation mode ajuda debugging

### Negativos e Soluções
- **Limitações de Permissões**: Não pode criar outros managers
  - **Solução**: Interface clara mostra apenas ações permitidas, tooltips explicativos
- **Dependência de Super Admin**: Para mudanças estruturais
  - **Solução**: Comunicação automática, requests system para escalação
- **Complexidade da Timeline**: Curva de aprendizado para jornada complexa
  - **Solução**: Tutoriais interativos, simplificação progressiva

## Planejamento de Implementação Detalhado

### Fase 1: Layout e Navegação Manager (Semanas 1-2)

#### 1. Manager Layout Shell
```tsx
// components/manager/ManagerLayoutShell.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Heart, Users, TrendingUp, Calendar, Plus } from 'lucide-react';

const ManagerLayoutShell = ({ children }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [pulseData, setPulseData] = useState({});

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
      const response = await axios.get('/api/manager/pulse');
      setPulseData(response.data);
    } catch (error) {
      console.error('Error fetching pulse data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
      {/* Relationship Pulse Background Animation */}
      <div className="fixed inset-0 opacity-30">
        <div className="pulse-wave"></div>
      </div>

      {/* Sidebar Flutuante */}
      <motion.aside
        className="fixed left-6 top-6 bottom-6 w-72 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Relationship View
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Managing client connections
            </p>
          </div>

          {/* Pulse Indicator */}
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200/50 dark:border-red-800/50">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Relationship Health
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-red-400 to-pink-400 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pulseData.overallHealth || 75}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {pulseData.overallHealth || 75}%
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
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
              >
                <item.icon className={`w-6 h-6 ${item.color}`} />
                <div className="text-left">
                  <div className={`font-medium ${activeSection === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.label}
                  </div>
                  {item.id === 'clients' && pulseData.clientCount && (
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
                  {pulseData.managerInitials || 'JD'}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-white">
                  {pulseData.managerName || 'John Doe'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Account Manager
                </div>
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
    </div>
  );
};
```

#### 2. Client Creation Wizard (Manager Scope)
```tsx
// components/manager/ClientOnboardingWizard.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import axios from 'axios';

const ClientOnboardingWizard = ({ onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [clientData, setClientData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    industry: '',
    companySize: '',
    painPoints: '',
    goals: '',
    budget: '',
    timeline: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { title: 'Company Info', fields: ['companyName', 'industry', 'companySize'] },
    { title: 'Contact Details', fields: ['contactName', 'email', 'phone'] },
    { title: 'Business Needs', fields: ['painPoints', 'goals'] },
    { title: 'Deal Parameters', fields: ['budget', 'timeline'] },
    { title: 'AI Personality', fields: ['aiPersonality'] }
  ];

  const aiPersonalities = [
    {
      id: 'consultant',
      name: 'Consultivo',
      description: 'Foco em entender necessidades, construir confiança',
      icon: '🤝',
      color: 'bg-blue-500'
    },
    {
      id: 'hunter',
      name: 'Caçador',
      description: 'Direto ao ponto, foco em fechamento rápido',
      icon: '🎯',
      color: 'bg-red-500'
    },
    {
      id: 'nurturer',
      name: 'Nutridor',
      description: 'Construir relacionamento longo prazo',
      icon: '🌱',
      color: 'bg-green-500'
    }
  ];

  const validateStep = (stepNumber) => {
    const newErrors = {};
    const currentFields = steps[stepNumber - 1].fields;

    currentFields.forEach(field => {
      if (!clientData[field] || clientData[field].trim() === '') {
        newErrors[field] = 'Este campo é obrigatório';
      }
    });

    // Email validation
    if (currentFields.includes('email') && clientData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientData.email)) {
        newErrors.email = 'Email inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      // Create client via API
      const response = await axios.post('/api/manager/create-client', {
        ...clientData,
        assignedManagerId: getCurrentManagerId() // From auth context
      });

      // Create login credentials
      await axios.post('/api/auth/create-client-login', {
        clientId: response.data.clientId,
        email: clientData.email,
        tempPassword: generateTempPassword()
      });

      onComplete(response.data);
    } catch (error) {
      console.error('Error creating client:', error);
      setErrors({ submit: 'Erro ao criar cliente. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Onboard New Client
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex items-center gap-2">
            {steps.map((s, index) => (
              <div key={index} className="flex items-center flex-1">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < step
                      ? 'bg-green-500 text-white'
                      : index === step
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {index < step ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    index < step - 1 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {step === 1 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Company Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <input
                    type="text"
                    value={clientData.companyName}
                    onChange={(e) => setClientData({...clientData, companyName: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter company name"
                  />
                  {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <select
                    value={clientData.industry}
                    onChange={(e) => setClientData({...clientData, industry: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company Size</label>
                  <select
                    value={clientData.companySize}
                    onChange={(e) => setClientData({...clientData, companySize: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                  {errors.companySize && <p className="text-red-500 text-sm mt-1">{errors.companySize}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Contact Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Name</label>
                  <input
                    type="text"
                    value={clientData.contactName}
                    onChange={(e) => setClientData({...clientData, contactName: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Full name"
                  />
                  {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({...clientData, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="contact@company.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="+55 (11) 99999-9999"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Business Needs
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pain Points</label>
                  <textarea
                    value={clientData.painPoints}
                    onChange={(e) => setClientData({...clientData, painPoints: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-24"
                    placeholder="What challenges is the company facing?"
                  />
                  {errors.painPoints && <p className="text-red-500 text-sm mt-1">{errors.painPoints}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Goals</label>
                  <textarea
                    value={clientData.goals}
                    onChange={(e) => setClientData({...clientData, goals: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-24"
                    placeholder="What does the company want to achieve?"
                  />
                  {errors.goals && <p className="text-red-500 text-sm mt-1">{errors.goals}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Deal Parameters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Budget Range</label>
                  <select
                    value={clientData.budget}
                    onChange={(e) => setClientData({...clientData, budget: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select budget range</option>
                    <option value="0-5000">R$ 0 - R$ 5.000</option>
                    <option value="5000-15000">R$ 5.000 - R$ 15.000</option>
                    <option value="15000-50000">R$ 15.000 - R$ 50.000</option>
                    <option value="50000+">R$ 50.000+</option>
                  </select>
                  {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Timeline</label>
                  <select
                    value={clientData.timeline}
                    onChange={(e) => setClientData({...clientData, timeline: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select timeline</option>
                    <option value="asap">ASAP (1-3 months)</option>
                    <option value="3-6months">3-6 months</option>
                    <option value="6-12months">6-12 months</option>
                    <option value="exploring">Just exploring</option>
                  </select>
                  {errors.timeline && <p className="text-red-500 text-sm mt-1">{errors.timeline}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                AI Personality Selection
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose the AI personality that best fits this client's communication style and needs.
              </p>

              <div className="grid gap-4">
                {aiPersonalities.map((personality) => (
                  <motion.label
                    key={personality.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      clientData.aiPersonality === personality.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="radio"
                      name="aiPersonality"
                      value={personality.id}
                      checked={clientData.aiPersonality === personality.id}
                      onChange={(e) => setClientData({...clientData, aiPersonality: e.target.value})}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${personality.color} rounded-full flex items-center justify-center text-2xl`}>
                        {personality.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {personality.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {personality.description}
                        </p>
                      </div>
                      {clientData.aiPersonality === personality.id && (
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                  </motion.label>
                ))}
              </div>
              {errors.aiPersonality && <p className="text-red-500 text-sm mt-2">{errors.aiPersonality}</p>}
            </motion.div>
          )}

          {errors.submit && (
            <motion.div
              className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Client
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
```

### Fase 2: Morning Ritual Implementation (Semanas 3-4)

#### 1. Morning Ritual Modal
```tsx
// components/manager/MorningRitualModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const MorningRitualModal = ({ isOpen, onClose, onComplete }) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [responses, setResponses] = useState({});
  const [ritualData, setRitualData] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchMorningRitualData();
    }
  }, [isOpen]);

  const fetchMorningRitualData = async () => {
    try {
      const response = await axios.get('/api/manager/morning-ritual');
      setRitualData(response.data.cards || []);
    } catch (error) {
      console.error('Error fetching ritual data:', error);
    }
  };

  const handleResponse = (cardId, response) => {
    setResponses(prev => ({ ...prev, [cardId]: response }));
  };

  const handleNext = () => {
    if (currentCard < ritualData.length - 1) {
      setCurrentCard(currentCard + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await axios.post('/api/manager/morning-ritual/complete', { responses });
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing ritual:', error);
    }
  };

  if (!isOpen || ritualData.length === 0) return null;

  const currentRitualCard = ritualData[currentCard];
  const progress = ((currentCard + 1) / ritualData.length) * 100;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Morning Ritual</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/30 rounded-full h-2 mb-2">
            <motion.div
              className="bg-white h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm opacity-90">
            {currentCard + 1} of {ritualData.length} reviews
          </p>
        </div>

        {/* Card Content */}
        <div className="p-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="min-h-64"
            >
              {/* Client Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {currentRitualCard.clientName?.charAt(0) || 'C'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {currentRitualCard.clientName || 'Client Name'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentRitualCard.industry || 'Industry'}
                  </p>
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {currentRitualCard.leadsChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      currentRitualCard.leadsChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(currentRitualCard.leadsChange || 0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Leads</p>
                </div>

                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {currentRitualCard.activeConversations || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active Chats</p>
                </div>
              </div>

              {/* Main Question */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {currentRitualCard.question || 'What action should we take?'}
                </h4>

                {/* Response Options */}
                <div className="space-y-3">
                  {currentRitualCard.options?.map((option, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleResponse(currentRitualCard.id, option)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                        responses[currentRitualCard.id] === option
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          responses[currentRitualCard.id] === option
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {responses[currentRitualCard.id] === option && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className={`font-medium ${
                          responses[currentRitualCard.id] === option
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {option.label}
                        </span>
                      </div>
                      {option.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-9">
                          {option.description}
                        </p>
                      )}
                    </motion.button>
                  )) || (
                    // Default options if not provided
                    <>
                      <motion.button
                        onClick={() => handleResponse(currentRitualCard.id, 'tweak_prompt')}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                          responses[currentRitualCard.id] === 'tweak_prompt'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            responses[currentRitualCard.id] === 'tweak_prompt'
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {responses[currentRitualCard.id] === 'tweak_prompt' && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className={`font-medium ${
                            responses[currentRitualCard.id] === 'tweak_prompt'
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            Tweak AI Prompt
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-9">
                          Adjust the AI's communication strategy
                        </p>
                      </motion.button>

                      <motion.button
                        onClick={() => handleResponse(currentRitualCard.id, 'ignore')}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                          responses[currentRitualCard.id] === 'ignore'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            responses[currentRitualCard.id] === 'ignore'
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {responses[currentRitualCard.id] === 'ignore' && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className={`font-medium ${
                            responses[currentRitualCard.id] === 'ignore'
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            Monitor Only
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-9">
                          Keep current strategy, monitor progress
                        </p>
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* Additional Context */}
              {currentRitualCard.context && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Context
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {currentRitualCard.context}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentCard === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!responses[currentRitualCard.id]}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentCard === ritualData.length - 1 ? 'Complete Ritual' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
```

### Fase 3: Customer Journey Timeline (Semanas 5-6)

#### 1. Living Customer Journey Component
```tsx
// components/manager/CustomerJourneyMap.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, MapPin, ArrowRight } from 'lucide-react';

const CustomerJourneyMap = ({ clientId }) => {
  const [journeyData, setJourneyData] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);

  useEffect(() => {
    fetchJourneyData();
  }, [clientId]);

  const fetchJourneyData = async () => {
    try {
      const response = await axios.get(`/api/manager/client-journey/${clientId}`);
      setJourneyData(response.data);
    } catch (error) {
      console.error('Error fetching journey data:', error);
    }
  };

  if (!journeyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getStageIcon = (stage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />;
      case 'blocked':
        return <AlertTriangle className="w-6 h-6 text-red-500 animate-bounce" />;
      default:
        return <MapPin className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStageColor = (stage) => {
    switch (stage.status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'current':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/50';
      case 'blocked':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse';
      default:
        return 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-blue-500" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Customer Journey
        </h3>
      </div>

      {/* Journey Timeline */}
      <div className="relative">
        {/* Connection Lines */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>

        <div className="relative z-10 flex justify-between">
          {journeyData.stages.map((stage, index) => (
            <motion.div
              key={stage.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Stage Node */}
              <motion.button
                onClick={() => setSelectedStage(stage)}
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${getStageColor(stage)} hover:scale-110`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {getStageIcon(stage)}
              </motion.button>

              {/* Stage Label */}
              <div className="text-center mt-3 max-w-24">
                <p className={`text-sm font-medium ${
                  stage.status === 'current' ? 'text-blue-600 dark:text-blue-400' :
                  stage.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                  stage.status === 'blocked' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {stage.name}
                </p>
                {stage.date && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(stage.date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Animated Flow */}
              {stage.status === 'current' && index < journeyData.stages.length - 1 && (
                <motion.div
                  className="absolute top-8 left-16 w-32 h-0.5 bg-gradient-to-r from-blue-500 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                  style={{
                    transformOrigin: 'left',
                    background: 'linear-gradient(90deg, #3b82f6 0%, transparent 100%)'
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stage Details */}
      {selectedStage && (
        <motion.div
          className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-3">
            {getStageIcon(selectedStage)}
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {selectedStage.name}
            </h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              selectedStage.status === 'completed' ? 'bg-green-100 text-green-800' :
              selectedStage.status === 'current' ? 'bg-blue-100 text-blue-800' :
              selectedStage.status === 'blocked' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedStage.status}
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-3">
            {selectedStage.description}
          </p>

          {selectedStage.actions && selectedStage.actions.length > 0 && (
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-2">Required Actions:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {selectedStage.actions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedStage.metrics && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {Object.entries(selectedStage.metrics).map(([key, value]) => (
                <div key={key} className="text-center p-2 bg-white dark:bg-gray-600 rounded">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Upcoming</span>
        </div>
      </div>
    </div>
  );
};
```

### Fase 4: Relationship Pulse Features (Semanas 7-8)

#### 1. Relationship Pulse Dashboard
```tsx
// components/manager/RelationshipPulseDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, MessageCircle, Calendar, AlertCircle } from 'lucide-react';

const RelationshipPulseDashboard = () => {
  const [pulseData, setPulseData] = useState({
    overallHealth: 75,
    clients: [],
    alerts: []
  });

  useEffect(() => {
    fetchPulseData();
    const interval = setInterval(fetchPulseData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPulseData = async () => {
    try {
      const response = await axios.get('/api/manager/relationship-pulse');
      setPulseData(response.data);
    } catch (error) {
      console.error('Error fetching pulse data:', error);
    }
  };

  const getPulseColor = (health) => {
    if (health >= 80) return 'text-green-500';
    if (health >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPulseBg = (health) => {
    if (health >= 80) return 'bg-green-500';
    if (health >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Header */}
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${getPulseBg(pulseData.overallHealth)}/20`}>
              <Heart className={`w-8 h-8 ${getPulseColor(pulseData.overallHealth)}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Relationship Pulse
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Health of your client relationships
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-4xl font-bold ${getPulseColor(pulseData.overallHealth)}`}>
              {pulseData.overallHealth}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Overall Health
            </div>
          </div>
        </div>

        {/* Pulse Wave Animation */}
        <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${getPulseBg(pulseData.overallHealth)} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${pulseData.overallHealth}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Client Pulse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pulseData.clients.map((client, index) => (
          <motion.div
            key={client.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getPulseBg(client.health)}`}></div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {client.name}
                </h3>
              </div>
              <span className={`text-sm font-medium ${getPulseColor(client.health)}`}>
                {client.health}%
              </span>
            </div>

            {/* Health Indicators */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">Activity</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {client.activityLevel}/10
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">Engagement</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {client.engagement}%
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600 dark:text-gray-400">Last Contact</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {client.daysSinceLastContact}d ago
                </span>
              </div>
            </div>

            {/* Health Wave */}
            <div className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getPulseBg(client.health)} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${client.health}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {/* Open client details */}}
                className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => {/* Start conversation */}}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Contact
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerts Section */}
      {pulseData.alerts.length > 0 && (
        <motion.div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Relationship Alerts
            </h3>
          </div>

          <div className="space-y-3">
            {pulseData.alerts.map((alert, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {alert.clientName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {alert.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {/* Handle alert */}}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  Address
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
```

## Funções Existentes e Novas

### Funções Existentes Integradas
- **NextAuth**: Autenticação para login do manager
- **CRM APIs**: Integração com dados de clientes e conversas
- **Backup APIs**: Para relatórios de performance
- **Client Operations**: Renomear, mover, duplicar clientes (limitado à carteira)

### Novas Funcionalidades Específicas
- **Client Onboarding Wizard**: Criação de clientes com validações de escopo
- **Morning Ritual**: Revisão diária interativa da carteira
- **Customer Journey Timeline**: Visualização animada do progresso do cliente
- **Relationship Pulse Dashboard**: Monitoramento em tempo real da saúde dos relacionamentos

### APIs Necessárias
```javascript
// /api/manager/create-client
POST - Cria cliente apenas para carteira do manager

// /api/manager/morning-ritual
GET - Busca dados para ritual matinal

// /api/manager/client-journey/[clientId]
GET - Busca timeline da jornada do cliente

// /api/manager/relationship-pulse
GET - Busca métricas de saúde dos relacionamentos
```

### Permissões Hierárquicas
```
Manager (criado por Super Admin)
├── Pode criar Clients (login/senha) apenas para sua carteira
├── Acesso limitado a relatórios (sua carteira)
├── Não pode criar outros Managers
├── Não pode acessar funcionalidades globais
└── View As limitado ao seus próprios clientes
```

### Considerações de Segurança
- **Scoped Access**: Todas as queries filtradas por managerId
- **Audit Trail**: Logging de todas as ações do manager
- **Data Isolation**: Clientes de diferentes managers completamente isolados
- **Rate Limiting**: Limites para criação de clientes e ações bulk

Este planejamento cria uma experiência focada no relacionamento, permitindo ao Account Manager gerenciar efetivamente sua carteira enquanto mantém a simplicidade e foco necessários para o sucesso diário.