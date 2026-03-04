'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import ThemeProviderWrapper from './components/ThemeProviderWrapper';
import ThemeToggle from './components/ThemeToggle';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-theme="light">
      <body className={`${inter.className} theme-root`}>
        <ThemeProviderWrapper>
          <ThemeToggle />
          {children}
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
