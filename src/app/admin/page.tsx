'use client';

import React from 'react';
import AdminLayoutShell from '../../components/admin/AdminLayoutShell';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface CustomUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}
import RoleBasedRouter from '../../components/RoleBasedRouter';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if ((session.user as CustomUser)?.role !== 'super_admin') {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || (session.user as CustomUser)?.role !== 'super_admin') {
    return null; // RoleBasedRouter will handle this
  }

  return (
    <>
      <RoleBasedRouter />
      <AdminLayoutShell>
        <div className="space-y-8">
          {/* Admin Dashboard Content */}
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-400 text-lg">
              Controle total do sistema - Gerencie usuários, monitore performance e configure permissões globais
            </p>
          </div>

          {/* Placeholder for admin components */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-2">Sistema Neural</h3>
              <p className="text-gray-400">Monitor global de IA</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-2">Gestão de Usuários</h3>
              <p className="text-gray-400">Criar e gerenciar contas</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-2">Controles Globais</h3>
              <p className="text-gray-400">Configurações do sistema</p>
            </div>
          </div>
        </div>
      </AdminLayoutShell>
    </>
  );
}