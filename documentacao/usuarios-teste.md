# 👥 Usuários de Teste - CRM SaaS

## 📋 **Visão Geral**

Este documento contém os usuários de teste criados para desenvolvimento e testes do sistema CRM SaaS. Estes usuários permitem testar todas as funcionalidades do sistema sem interferir nos dados reais.

## 🔐 **Credenciais Padrão**

- **Senha:** `teste123`
- **Nota:** Em produção, implemente autenticação real com senhas seguras

---

## 👨‍💼 **Usuários Manager (Account Manager)**

### 1. João Silva Manager
- **Email:** `joao.manager@teste.com`
- **Role:** `manager`
- **ID:** `manager-001`
- **URL de Acesso:** `/manager`
- **Descrição:** Manager sênior com carteira completa de clientes

### 2. Carlos Oliveira Manager
- **Email:** `carlos.manager@teste.com`
- **Role:** `manager`
- **ID:** `manager-002`
- **URL de Acesso:** `/manager`
- **Descrição:** Manager focado em vendas B2B

### 3. Ana Santos Manager
- **Email:** `ana.manager@teste.com`
- **Role:** `manager`
- **ID:** `manager-003`
- **URL de Acesso:** `/manager`
- **Descrição:** Manager especializada em onboarding

---

## 🏢 **Usuários Cliente (Empresa Cliente)**

### 1. Maria Santos Cliente
- **Email:** `maria.cliente@teste.com`
- **Role:** `client`
- **Client ID:** `client-maria-001`
- **URL de Acesso:** `/client`
- **Descrição:** Cliente corporativo com pipeline ativo

### 2. Pedro Costa Cliente
- **Email:** `pedro.cliente@teste.com`
- **Role:** `client`
- **Client ID:** `client-pedro-001`
- **URL de Acesso:** `/client`
- **Descrição:** Cliente PME com foco em marketing

### 3. Lucas Ferreira Cliente
- **Email:** `lucas.cliente@teste.com`
- **Role:** `client`
- **Client ID:** `client-lucas-001`
- **URL de Acesso:** `/client`
- **Descrição:** Cliente startup em crescimento

---

## 🔧 **Como Usar os Usuários de Teste**

### 1. **Acesso Direto via URL**
```
Para testar um manager:
http://localhost:3000/manager

Para testar um cliente:
http://localhost:3000/client
```

### 2. **API para Gerenciar Usuários**
```bash
# Listar todos os usuários
GET /api/create-test-users

# Listar apenas managers
GET /api/create-test-users?role=manager

# Listar apenas clientes
GET /api/create-test-users?role=client

# Criar novo usuário
POST /api/create-test-users
{
  "role": "manager",
  "name": "Novo Manager",
  "email": "novo.manager@teste.com"
}

# Criar múltiplos usuários
PUT /api/create-test-users
{
  "users": [
    {
      "role": "client",
      "name": "Novo Cliente",
      "email": "novo.cliente@teste.com",
      "clientId": "client-novo-001"
    }
  ]
}
```

### 3. **Script de Criação**
```bash
# Executar script de criação (desenvolvimento)
node scripts/create-test-users.js
```

---

## 🎯 **Funcionalidades por Role**

### **Super Admin** (Não incluído nos testes)
- ✅ Controle total do sistema
- ✅ Gerenciamento de usuários
- ✅ Configurações globais
- ✅ Monitoramento do sistema

### **Account Manager**
- ✅ Dashboard personalizado
- ✅ Gestão de clientes
- ✅ Onboarding de novos clientes
- ✅ Monitoramento de performance
- ✅ Relatórios por carteira

### **Empresa Cliente**
- ✅ Dashboard operacional
- ✅ Pipeline de vendas
- ✅ Biblioteca de assets
- ✅ Previsões e analytics
- ✅ Monitor de conversas IA

---

## 🔒 **Segurança nos Testes**

### **Middleware de Proteção**
- ✅ Rotas protegidas por role (`/admin/*`, `/manager/*`, `/client/*`)
- ✅ Redirecionamentos automáticos para roles incorretos
- ✅ Validações de acesso por cliente ID

### **Simulação de Autenticação**
```typescript
// Mock session para desenvolvimento
const mockSession = {
  user: {
    id: 'manager-001',
    name: 'João Silva Manager',
    email: 'joao.manager@teste.com',
    role: 'manager'
  }
}
```

---

## 📱 **Cenários de Teste Recomendados**

### **Para Managers:**
1. **Login e Dashboard** - Ver métricas gerais
2. **Onboarding** - Criar novo cliente
3. **Customer Journey** - Acompanhar progresso
4. **Pulse Dashboard** - Monitor satisfação

### **Para Clientes:**
1. **Dashboard Pulse** - Ver métricas em tempo real
2. **Sales Pipeline** - Gerenciar deals
3. **Assets Vault** - Download de materiais
4. **Forecast** - Análise de previsões
5. **AI Conversations** - Monitor de interações

---

## 🚀 **Próximos Passos**

### **Em Desenvolvimento:**
1. **Autenticação Real** - Implementar NextAuth.js completo
2. **Banco de Dados** - Conectar com PostgreSQL/MongoDB
3. **APIs Reais** - Substituir mocks por dados reais

### **Em Produção:**
1. **Deploy** - Configurar Vercel/Netlify
2. **Monitoring** - Adicionar analytics e error tracking
3. **Performance** - Otimizar carregamento e caching

---

## 📞 **Suporte**

Para dúvidas sobre usuários de teste:
- 📧 **Email:** suporte@teste.com
- 📱 **Docs:** `/documentacao/usuarios-teste.md`
- 🔧 **API:** `/api/create-test-users`

---

**🎉 Usuários prontos para desenvolvimento e testes!**