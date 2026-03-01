'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, User, Mail, Phone, Building, Target, Brain } from 'lucide-react';
import axios from 'axios';

interface ClientOnboardingWizardProps {
  onComplete?: (clientData: any) => void;
  onClose?: () => void;
}

const ClientOnboardingWizard: React.FC<ClientOnboardingWizardProps> = ({ onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    timeline: '',
    aiPersonality: 'consultant'
  });

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
      color: 'bg-blue-500',
      traits: ['Empático', 'Questionador', 'Orientado a soluções']
    },
    {
      id: 'hunter',
      name: 'Caçador',
      description: 'Direto ao ponto, foco em fechamento rápido',
      icon: '🎯',
      color: 'bg-red-500',
      traits: ['Direto', 'Orientado a resultados', 'Persistente']
    },
    {
      id: 'nurturer',
      name: 'Nutridor',
      description: 'Construir relacionamento longo prazo',
      icon: '🌱',
      color: 'bg-green-500',
      traits: ['Paciente', 'Relacionamento', 'Valor de longo prazo']
    }
  ];

  const validateStep = (stepNumber: number) => {
    const newErrors: Record<string, string> = {};
    const currentFields = steps[stepNumber - 1].fields;

    currentFields.forEach(field => {
      if (!clientData[field as keyof typeof clientData] || clientData[field as keyof typeof clientData] === '') {
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

      onComplete?.(response.data);
    } catch (error) {
      console.error('Error creating client:', error);
      setErrors({ submit: 'Erro ao criar cliente. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentManagerId = () => {
    // Mock - replace with actual auth context
    return 'manager-123';
  };

  const generateTempPassword = () => {
    // Generate secure temporary password
    return 'TempPass' + Math.random().toString(36).substring(2, 8);
  };

  const updateClientData = (field: string, value: string) => {
    setClientData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-blue-200/50 dark:border-blue-800/50"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6" />
              Onboard New Client
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex items-center gap-2">
            {steps.map((s, index) => (
              <div key={index} className="flex items-center flex-1">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                    index < step
                      ? 'border-green-400 bg-green-400 text-black'
                      : index === step
                      ? 'border-white bg-white text-blue-600'
                      : 'border-white/50 text-white/50'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {index < step ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${
                    index < step - 1 ? 'bg-green-400' : 'bg-white/30'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 text-center">
            <span className="text-sm opacity-90">
              Step {step} of {steps.length}: {steps[step - 1].title}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {step === 1 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Company Information
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={clientData.companyName}
                    onChange={(e) => updateClientData('companyName', e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400"
                    placeholder="Enter company name"
                  />
                  {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Industry
                  </label>
                  <select
                    value={clientData.industry}
                    onChange={(e) => updateClientData('industry', e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Size
                  </label>
                  <select
                    value={clientData.companySize}
                    onChange={(e) => updateClientData('companySize', e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
              <h3 className="text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Details
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={clientData.contactName}
                    onChange={(e) => updateClientData('contactName', e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400"
                    placeholder="Full name"
                  />
                  {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => updateClientData('email', e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400"
                    placeholder="contact@company.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => updateClientData('phone', e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400"
                    placeholder="+55 (11) 99999-9999"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Business Needs
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pain Points
                  </label>
                  <textarea
                    value={clientData.painPoints}
                    onChange={(e) => updateClientData('painPoints', e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 h-24 resize-none"
                    placeholder="What challenges is the company facing?"
                  />
                  {errors.painPoints && <p className="text-red-500 text-sm mt-1">{errors.painPoints}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Goals
                  </label>
                  <textarea
                    value={clientData.goals}
                    onChange={(e) => updateClientData('goals', e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 h-24 resize-none"
                    placeholder="What does the company want to achieve?"
                  />
                  {errors.goals && <p className="text-red-500 text-sm mt-1">{errors.goals}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Deal Parameters
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Budget Range
                  </label>
                  <select
                    value={clientData.budget}
                    onChange={(e) => updateClientData('budget', e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timeline
                  </label>
                  <select
                    value={clientData.timeline}
                    onChange={(e) => updateClientData('timeline', e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
              <h3 className="text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Brain className="w-5 h-5" />
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
                      onChange={(e) => updateClientData('aiPersonality', e.target.value)}
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {personality.description}
                        </p>
                        <div className="flex gap-2">
                          {personality.traits.map((trait) => (
                            <span
                              key={trait}
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                      {clientData.aiPersonality === personality.id && (
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                  </motion.label>
                ))}
              </div>
            </motion.div>
          )}

          {errors.submit && (
            <motion.div
              className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
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
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClientOnboardingWizard;