# Arquitetura Geral do Frontend

## Visão Geral da Arquitetura

O frontend será desenvolvido em **Next.js 14** com **TypeScript**, seguindo uma arquitetura modular e escalável que suporta os três níveis de acesso (Administrador, Gerente, Cliente) com controle granular de permissões.

## Estrutura de Diretórios

```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Rotas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Rotas protegidas por nível
│   │   ├── admin/                # Dashboard Administrador
│   │   ├── gerente/              # Dashboard Gerente
│   │   └── cliente/              # Dashboard Cliente
│   ├── api/                      # API Routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Componentes compartilhados
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── layout/                   # Layout components
│   ├── charts/                   # Gráficos e visualizações
│   ├── forms/                    # Formulários
│   └── modals/                   # Modais
├── hooks/                        # Custom hooks
├── lib/                          # Utilitários
│   ├── auth.ts                   # Controle de autenticação
│   ├── permissions.ts            # Sistema de permissões
│   ├── api.ts                    # Cliente API
│   └── validations.ts            # Validações
├── stores/                       # State management (Zustand)
├── types/                        # TypeScript types
└── utils/                        # Funções utilitárias
```

## Sistema de Autenticação e Autorização

### Níveis de Acesso
```typescript
enum UserRole {
  ADMIN = 'admin',
  GERENTE = 'gerente',
  CLIENTE = 'cliente'
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  clientId?: string;        // Para clientes
  managerId?: string;       // Para gerentes
}
```

### Controle de Rotas
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token');

  // Rotas públicas
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Verificar autenticação
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar permissões por rota
  const userRole = getUserRoleFromToken(token);

  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/gerente') && !['admin', 'gerente'].includes(userRole)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}
```

## Componentes Base (shadcn/ui)

### Paleta de Cores
```typescript
// Definir cores por nível
const colorSchemes = {
  admin: {
    primary: '#1a365d',      // Azul escuro
    secondary: '#2b6cb0',    // Azul médio
    accent: '#3182ce'        // Azul claro
  },
  gerente: {
    primary: '#2f855a',      // Verde escuro
    secondary: '#38a169',    // Verde médio
    accent: '#48bb78'        // Verde claro
  },
  cliente: {
    primary: '#7c3aed',      // Roxo escuro
    secondary: '#8b5cf6',    // Roxo médio
    accent: '#a78bfa'        // Roxo claro
  }
};
```

### Layout Responsivo
```typescript
// Layout principal com sidebar adaptável
function MainLayout({ children, userRole }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        role={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## State Management (Zustand)

### Stores por Domínio
```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

// dashboardStore.ts
interface DashboardState {
  metrics: DashboardMetrics;
  clients: Client[];
  isLoading: boolean;
  fetchDashboard: () => Promise<void>;
  updateMetrics: (metrics: Partial<DashboardMetrics>) => void;
}

// crmStore.ts
interface CRMState {
  contacts: CRMContact[];
  conversations: Conversation[];
  filters: ContactFilters;
  fetchContacts: (filters: ContactFilters) => Promise<void>;
  updateContact: (id: string, updates: Partial<CRMContact>) => Promise<void>;
}
```

## API Integration

### Cliente HTTP Centralizado
```typescript
// lib/api.ts
class APIClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL;

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}${this.buildQuery(params)}`, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return this.handleResponse<T>(response);
  }

  private getHeaders() {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API Error');
    }
    return response.json();
  }
}

export const api = new APIClient();
```

### React Query para Cache
```typescript
// hooks/useContacts.ts
export function useContacts(filters: ContactFilters) {
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => api.get<CRMContact[]>('/api/contacts', filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}

// hooks/useConversations.ts
export function useConversations(clientId?: string) {
  return useQuery({
    queryKey: ['conversations', clientId],
    queryFn: () => api.get<Conversation[]>(`/api/conversations/${clientId}`),
    enabled: !!clientId,
    refetchInterval: 30000, // Atualiza a cada 30s
  });
}
```

## Componentes de Gráficos

### Biblioteca Principal: Recharts
```typescript
// components/charts/MetricChart.tsx
interface MetricChartProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
}

export function MetricChart({
  data,
  type,
  title,
  height = 300,
  showLegend = true,
  showTooltip = true
}: MetricChartProps) {
  const ChartComponent = getChartComponent(type);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          {/* Configurações específicas por tipo */}
          {renderChartElements(type)}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
```

## Sistema de Permissões

### Definir Permissões Granulares
```typescript
// lib/permissions.ts
export enum Permission {
  // Admin
  VIEW_ALL_CLIENTS = 'view_all_clients',
  MANAGE_USERS = 'manage_users',
  CREATE_CLIENTS = 'create_clients',
  VIEW_FINANCIALS = 'view_financials',

  // Gerente
  VIEW_ASSIGNED_CLIENTS = 'view_assigned_clients',
  EDIT_CLIENT_CONFIG = 'edit_client_config',
  CREATE_SEGMENTED_LISTS = 'create_segmented_lists',
  VIEW_COMMISSIONS = 'view_commissions',

  // Cliente
  VIEW_OWN_CONVERSATIONS = 'view_own_conversations',
  VIEW_OWN_REPORTS = 'view_own_reports',
  MANAGE_OWN_LISTS = 'manage_own_lists',
  VIEW_OWN_CALENDAR = 'view_own_calendar'
}

export function hasPermission(user: User, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

export function requirePermission(permission: Permission) {
  return function(Component: React.ComponentType<any>) {
    return function WrappedComponent(props: any) {
      const { user } = useAuth();

      if (!hasPermission(user, permission)) {
        return <UnauthorizedAccess />;
      }

      return <Component {...props} />;
    };
  };
}
```

## PWA e Mobile Optimization

### Service Worker
```typescript
// public/sw.js
const CACHE_NAME = 'crm-app-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
```

### Manifest.json
```json
{
  "name": "CRM WhatsApp Pro",
  "short_name": "CRM Pro",
  "description": "Sistema completo de gestão WhatsApp",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a365d",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Testes e Qualidade

### Estratégia de Testes
```typescript
// Testes unitários com Jest + React Testing Library
// Componentes: mínimo 80% coverage
// Hooks: todos os hooks testados
// Utilitários: funções puras testadas

// Testes de integração
// API calls mockadas
// Fluxos completos de usuário
// Autorização e permissões

// Testes E2E com Playwright
// Login e navegação
// CRUD operations
// Workflows completos
```

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - run: npm run type-check

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: npm run deploy
```

## Performance e Otimização

### Code Splitting
```typescript
// app/(dashboard)/cliente/page.tsx
import dynamic from 'next/dynamic';

const DashboardCliente = dynamic(() => import('@/components/DashboardCliente'), {
  loading: () => <DashboardSkeleton />
});

const RelatoriosCliente = dynamic(() => import('@/components/RelatoriosCliente'), {
  loading: () => <RelatoriosSkeleton />
});
```

### Image Optimization
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      {...props}
    />
  );
}
```

### Bundle Analysis
```typescript
// scripts/analyze-bundle.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }
    return config;
  },
};
```

## Monitoramento e Analytics

### Error Boundaries
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // Log para serviço de monitoramento
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Analytics Integration
```typescript
// lib/analytics.ts
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, properties);
  }
}

// Uso nos componentes
useEffect(() => {
  trackEvent('dashboard_view', { role: user.role });
}, []);
```

## Segurança

### Proteções Implementadas
- **CSP (Content Security Policy)**
- **Helmet.js** para headers de segurança
- **Rate limiting** nas API routes
- **Input sanitization** em todos os forms
- **JWT tokens** com expiração curta
- **CSRF protection**
- **XSS prevention**

### Configuração de Segurança
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
};
```

Esta arquitetura fornece uma base sólida, escalável e segura para o desenvolvimento do frontend, garantindo manutenibilidade, performance e experiência do usuário excepcional em todos os níveis de acesso.