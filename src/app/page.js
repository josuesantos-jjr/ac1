'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona automaticamente para o dashboard ao carregar a página
    router.push('/dashboard');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f6fa'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '20px'
      }}>
        <h2>Redirecionando para o Dashboard...</h2>
        <div style={{
          border: '4px solid #f3f3f3',
          borderRadius: '50%',
          borderTop: '4px solid #00b894',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
