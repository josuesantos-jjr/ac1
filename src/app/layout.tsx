import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
// import { getServerSession } from 'next-auth';
// import SessionProvider from './components/SessionProvider';
import ThemeProviderWrapper from './components/ThemeProviderWrapper';
import ThemeToggleClient from './components/ThemeToggleClient';

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({ children }: {
  children: React.ReactNode;
}) {
  // Temporariamente comentado para evitar erros 404 durante desenvolvimento
  // const session = await getServerSession();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProviderWrapper>
          {/* Temporariamente comentado para evitar erros 404 durante desenvolvimento */}
          {/* <SessionProvider session={session}> */}
            <div className="relative">
              <div className="fixed top-4 right-4 z-50">
                <ThemeToggleClient />
              </div>
              {children}
            </div>
          {/* </SessionProvider> */}
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
