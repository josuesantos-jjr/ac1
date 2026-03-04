import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: null,
      status: 'unauthenticated',
    }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Sun: () => 'Sun',
  Moon: () => 'Moon',
  X: () => 'X',
  User: () => 'User',
  Phone: () => 'Phone',
  Mail: () => 'Mail',
  Star: () => 'Star',
  Target: () => 'Target',
  Clock: () => 'Clock',
  CheckCircle: () => 'CheckCircle',
  XCircle: () => 'XCircle',
  AlertTriangle: () => 'AlertTriangle',
  MessageSquare: () => 'MessageSquare',
  DollarSign: () => 'DollarSign',
  Calendar: () => 'Calendar',
}))

// Global test utilities
global.fetch = jest.fn()

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}