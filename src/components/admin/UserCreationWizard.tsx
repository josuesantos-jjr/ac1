'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, User, Mail, Key } from 'lucide-react';
import axios from 'axios';

interface UserCreationWizardProps {
  onComplete?: () => void;
  onClose?: () => void;
}

const UserCreationWizard: React.FC<UserCreationWizardProps> = ({ onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    role: 'manager', // manager or client
    permissions: [] as string[],
    assignedManager: '' // for clients
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { title: 'Informações Básicas', fields: ['email', 'password'] },
    { title: 'Definição de Role', fields: ['role'] },
    { title: 'Permissões Específicas', fields: ['permissions'] },
    { title: 'Atribuições', fields: ['assignedManager'] }
  ];

  const validateStep = (stepNumber: number) => {
    const newErrors: Record<string, string> = {};
    const currentFields = steps[stepNumber - 1].fields;

    currentFields.forEach(field => {
      if (!userData[field as keyof typeof userData] || userData[field as keyof typeof userData] === '') {
        newErrors[field] = 'Este campo é obrigatório';
      }
    });

    // Email validation
    if (currentFields.includes('email') && userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
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
      // API call to create user
      const response = await axios.post('/api/auth/create-user', {
        ...userData,
        createdBy: 'super_admin'
      });

      onComplete?.();
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ submit: 'Erro ao criar usuário. Tente novamente.' });
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
        className="bg-black/80 backdrop-blur-xl rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-green-500/30"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-green-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
              <User className="w-6 h-6" />
              Create New User
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex items-center gap-2">
            {steps.map((s, index) => (
              <div key={index} className="flex items-center flex-1">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                    index < step
                      ? 'border-green-400 bg-green-400/20 text-green-400'
                      : index === step
                      ? 'border-blue-400 bg-blue-400/20 text-blue-400'
                      : 'border-gray-600 text-gray-600'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {index < step ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${
                    index < step - 1 ? 'bg-green-400' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 text-center">
            <span className="text-sm text-gray-400">
              Step {step} of {steps.length}: {steps[step - 1].title}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {step === 1 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-xl text-white mb-6">Basic Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                    className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="user@company.com"
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    value={userData.password}
                    onChange={(e) => setUserData({...userData, password: e.target.value})}
                    className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Temporary password"
                  />
                  {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-xl text-white mb-6">User Role</h3>
              <div className="space-y-4">
                {[
                  {
                    id: 'manager',
                    title: 'Account Manager',
                    description: 'Can create and manage client accounts within their portfolio',
                    color: 'border-blue-500 bg-blue-500/10'
                  },
                  {
                    id: 'client',
                    title: 'Client',
                    description: 'Access to operational dashboard and AI conversations',
                    color: 'border-green-500 bg-green-500/10'
                  }
                ].map((role) => (
                  <label key={role.id} className="block">
                    <input
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={userData.role === role.id}
                      onChange={(e) => setUserData({...userData, role: e.target.value})}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userData.role === role.id
                        ? `${role.color} border-opacity-100`
                        : 'border-gray-600 hover:border-gray-500'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          userData.role === role.id
                            ? 'border-current bg-current'
                            : 'border-gray-400'
                        }`} />
                        <div>
                          <h4 className="text-white font-medium">{role.title}</h4>
                          <p className="text-gray-400 text-sm">{role.description}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-xl text-white mb-6">Specific Permissions</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  'create_clients', 'view_reports', 'manage_backups',
                  'system_monitoring', 'user_management', 'global_settings'
                ].map((perm) => (
                  <label key={perm} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                    <input
                      type="checkbox"
                      checked={userData.permissions.includes(perm)}
                      onChange={(e) => {
                        const newPerms = userData.permissions.includes(perm)
                          ? userData.permissions.filter(p => p !== perm)
                          : [...userData.permissions, perm];
                        setUserData({...userData, permissions: newPerms});
                      }}
                      className="text-green-400 focus:ring-green-500"
                    />
                    <span className="text-white capitalize text-sm">
                      {perm.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3 className="text-xl text-white mb-6">Assignments</h3>
              {userData.role === 'client' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assign to Manager
                  </label>
                  <select
                    value={userData.assignedManager}
                    onChange={(e) => setUserData({...userData, assignedManager: e.target.value})}
                    className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Manager</option>
                    {/* Options populated from API */}
                    <option value="manager1">John Doe (Portfolio A)</option>
                    <option value="manager2">Jane Smith (Portfolio B)</option>
                  </select>
                  {errors.assignedManager && <p className="text-red-400 text-sm mt-1">{errors.assignedManager}</p>}
                </div>
              )}

              {userData.role === 'manager' && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    Account Managers have full access to their assigned portfolio and can create client accounts.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {errors.submit && (
            <motion.div
              className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-green-500/30 bg-gray-900/50">
          <div className="flex justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Create User
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

export default UserCreationWizard;