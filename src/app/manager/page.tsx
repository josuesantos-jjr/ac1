'use client';

import React from 'react';
import ManagerLayoutShell from '../../components/manager/ManagerLayoutShell';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface CustomUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function ManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!['super_admin', 'manager'].includes((session.user as CustomUser)?.role as string)) {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || !['super_admin', 'manager'].includes((session.user as CustomUser)?.role as string)) {
    return null; // RoleBasedRouter will handle this
  }

  return (
    <ManagerLayoutShell>
      <div className="space-y-8">
        {/* Manager Dashboard Content */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Account Manager Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Gerencie seus clientes - Monitore performance, crie novos projetos e otimize resultados
          </p>
        </div>

        {/* Placeholder for manager components */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-2">Pulse de Relacionamento</h3>
            <p className="text-gray-400">Monitor de satisfação dos clientes</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-2">Onboarding Wizard</h3>
            <p className="text-gray-400">Criar novos clientes</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-2">Jornada do Cliente</h3>
            <p className="text-gray-400">Timeline de projetos</p>
          </div>
        </div>
      </div>
    </ManagerLayoutShell>
  );
}