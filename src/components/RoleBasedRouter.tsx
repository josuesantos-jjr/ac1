'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Users, Building, Loader2, AlertCircle } from 'lucide-react';
import GlassCard from './GlassCard';

type UserRole = 'super_admin' | 'manager' | 'client';

interface CustomUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

interface RoleConfig {
  role: UserRole;
  defaultRoute: string;
  allowedRoutes: string[];
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  description: string;
}

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  super_admin: {
    role: 'super_admin',
    defaultRoute: '/admin',
    allowedRoutes: ['/admin', '/manager', '/client'],
    icon: Shield,
    label: 'Super Admin',
    color: 'text-red-400',
    description: 'Acesso total ao sistema'
  },
  manager: {
    role: 'manager',
    defaultRoute: '/manager',
    allowedRoutes: ['/manager', '/client'],
    icon: Users,
    label: 'Account Manager',
    color: 'text-blue-400',
    description: 'Gerenciamento de clientes'
  },
  client: {
    role: 'client',
    defaultRoute: '/client',
    allowedRoutes: ['/client'],
    icon: Building,
    label: 'Empresa Cliente',
    color: 'text-green-400',
    description: 'Acesso operacional'
  }
};

export default function RoleBasedRouter() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectDelay, setRedirectDelay] = useState(3);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      // Usuário não autenticado - redirecionar para login
      if (pathname !== '/auth/signin') {
        router.push('/auth/signin');
      }
      return;
    }

    const userRole = (session.user as CustomUser)?.role;
    if (!userRole || !ROLE_CONFIGS[userRole]) {
      // Role inválida
      router.push('/unauthorized');
      return;
    }

    const roleConfig = ROLE_CONFIGS[userRole];
    const isOnAllowedRoute = roleConfig.allowedRoutes.some(route =>
      pathname.startsWith(route)
    );

    if (!isOnAllowedRoute) {
      // Usuário está em uma rota não permitida para seu role
      setIsRedirecting(true);

      // Countdown para redirecionamento
      const countdown = setInterval(() => {
        setRedirectDelay(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            router.push(roleConfig.defaultRoute);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [session, status, pathname, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-white mb-2">
            Verificando permissões...
          </h2>
          <p className="text-gray-400">
            Aguarde enquanto configuramos seu acesso
          </p>
        </motion.div>
      </div>
    );
  }

  // Unauthorized access
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-orange-900">
        <GlassCard className="max-w-md">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-300 mb-4">
              Você precisa estar autenticado para acessar esta página.
            </p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Fazer Login
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const userRole = (session.user as CustomUser)?.role;
  const roleConfig = userRole ? ROLE_CONFIGS[userRole] : undefined;

  // Invalid role
  if (!userRole || !roleConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-orange-900">
        <GlassCard className="max-w-md">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Role Inválida
            </h2>
            <p className="text-gray-300 mb-4">
              Sua conta possui uma configuração de permissões inválida.
            </p>
            <button
              onClick={() => router.push('/unauthorized')}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Reportar Problema
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Access denied - wrong route for role
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-900 to-orange-900">
        <GlassCard className="max-w-lg">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <roleConfig.icon className={`w-16 h-16 mx-auto mb-4 ${roleConfig.color}`} />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold text-white mb-2"
            >
              Acesso Restrito
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-300 mb-6"
            >
              Como <span className={`font-semibold ${roleConfig.color}`}>{roleConfig.label}</span>,
              você não tem permissão para acessar esta página.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 rounded-lg p-4 mb-6"
            >
              <p className="text-sm text-gray-400 mb-2">Redirecionando em:</p>
              <div className="flex items-center justify-center">
                <motion.div
                  key={redirectDelay}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold text-white"
                >
                  {redirectDelay}
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <p className="text-sm text-gray-400">
                Você será redirecionado para:
              </p>
              <p className={`text-lg font-semibold ${roleConfig.color}`}>
                {roleConfig.description}
              </p>
            </motion.div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Allow access - render children
  return null; // This component only handles routing, doesn't render content
}

export { ROLE_CONFIGS };
export type { UserRole, RoleConfig };