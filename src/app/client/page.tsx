'use client';

import React from 'react';
import ClientDashboard from '../../components/client/ClientDashboard';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface CustomUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function ClientPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if ((session.user as CustomUser)?.role !== 'client') {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || (session.user as CustomUser)?.role !== 'client') {
    return null; // RoleBasedRouter will handle this
  }

  return <ClientDashboard />;
}