# Documentação Frontend - Acesso Administrador

## Visão Geral
O administrador possui acesso completo ao sistema, com visão global de todos os gerentes, clientes, pagamentos, métricas e configurações do sistema.

## Estrutura de Navegação

### Menu Lateral Principal
```
🏢 SISTEMA DE GESTÃO WHATSAPP
├── 📊 Dashboard Global
├── 👥 Gerentes
│   ├── Lista de Gerentes
│   ├── Performance por Gerente
│   └── Comissões
├── 🏢 Clientes
│   ├── Todos os Clientes
│   ├── Clientes Ativos
│   ├── Clientes Cancelados
│   └── Criar Novo Cliente
├── 💰 Financeiro
│   ├── Receitas e Projeções
│   ├── Inadimplências
│   └── Pagamentos
├── 📞 Contatos Globais
│   ├── Base Completa
│   ├── Análise Demográfica
│   └── Segmentação Global
├── 📊 Relatórios
│   ├── Relatórios Gerais
│   ├── Análise de Performance
│   └── Exportações
├── ⚙️ Sistema
│   ├── Configurações Gerais
│   ├── Usuários e Permissões
│   └── Logs do Sistema
└── 👤 Meu Perfil
```

## 1. DASHBOARD GLOBAL (Página Inicial)

### Métricas Principais (Cards no Topo)
- **Total de Gerentes:** 150 ativos
- **Receita Total Mensal:** R$ 45.000,00
- **Taxa de Sucesso Geral:** 98%
- **Total de Clientes Ativos:** 1.245
- **Conversas Ativas Hoje:** 12.450
- **Leads Gerados Hoje:** 3.456

### Gráfico de Receita (Linha do Tempo)
- **Tipo:** Gráfico de barras/linha
- **Período:** Últimos 12 meses
- **Métricas:** Receita mensal, projeção vs realizado
- **Interativo:** Hover mostra detalhes mensais

### Status dos Gerentes (Cards Expansíveis)
```
Para cada gerente:
├── Nome do Gerente
├── Quantidade de Clientes
├── Receita Gerada (mês atual)
├── Status (Online/Offline)
├── Clientes Ativos/Cancelados
└── [Botão: Ver Detalhes]
```

### Alertas e Notificações (Sidebar Direita)
- **Pagamentos Atrasados:** 5 clientes (R$ 2.300,00)
- **Pagamentos Vencendo:** 12 clientes (R$ 8.900,00)
- **Clientes Offline:** 3 clientes críticos
- **Novos Leads Prioritários:** 15 leads score > 8.5

### Ações Rápidas (Float Button)
- ➕ Criar Novo Cliente
- 💰 Ver Financeiro
- 📊 Gerar Relatório
- 📞 Ver Contatos

## 2. ABA GERENTES

### Lista de Gerentes (Tabela Principal)
**Colunas:**
- Nome
- Email
- Data de Cadastro
- Status (Ativo/Inativo)
- Quantidade de Clientes
- Receita Total (mês)
- Taxa de Sucesso
- Último Acesso

**Ações por Gerente:**
- 👁️ Ver Detalhes
- ✏️ Editar Informações
- 💰 Ver Comissões
- 📊 Ver Relatórios
- 🚫 Desativar/Ativar

### Modal de Detalhes do Gerente
```
Informações Básicas:
├── Dados Pessoais (Nome, Email, Telefone)
├── Dados Profissionais (Cargo, Data Admissão)
└── Configurações de Acesso

Performance:
├── Clientes Designados: Lista completa
├── Receita Mensal: Gráfico últimos 6 meses
├── Taxa de Conversão: Média dos clientes
└── Satisfação dos Clientes: NPS calculado

Comissões:
├── Comissão Atual: R$ 2.350,00 (15%)
├── Meta Mensal: R$ 3.000,00
├── Progresso: 78% (barra de progresso)
└── Histórico de Pagamentos
```

### Criar Novo Gerente
**Formulário:**
- Dados Pessoais
- Configurações de Acesso
- Percentual de Comissão
- Clientes Iniciais (opcional)

## 3. ABA CLIENTES

### Visão Geral dos Clientes
**Filtros Disponíveis:**
- Status (Ativo/Cancelado/Todos)
- Gerente Responsável
- Data de Cadastro
- Receita Mensal
- Status PM2

**Tabela de Clientes:**
- Nome da Empresa
- Gerente Responsável
- Status (Ativo/Cancelado)
- Status PM2 (Online/Offline/Error)
- Receita Mensal
- Último Pagamento
- Prazo de Pagamento
- Conversas Hoje
- Leads Hoje

### Criar Novo Cliente (Modal Completo)

#### Passo 1: Seleção de Modelo
```
Modelos Disponíveis:
├── Padrão (Modelo básico com funcionalidades essenciais)
├── Avançado (Modelo completo com IA avançada)
├── Personalizado (Modelo customizado por gerente)
└── [Botão: Criar Modelo Personalizado]
```

#### Passo 2: Informações da Empresa
```
Dados da Empresa:
├── Razão Social
├── CNPJ
├── Email Corporativo
├── Telefone
├── Endereço Completo
└── Segmento de Mercado

Configurações WhatsApp:
├── Número do WhatsApp
├── API Key Gemini (opcional)
├── API Key Groq (opcional)
└── Configurações de IA
```

#### Passo 3: Designação e Financeiro
```
Gerente Responsável: [Dropdown com lista de gerentes]

Plano e Pagamento:
├── Plano: Básico/Premium/Enterprise
├── Valor Mensal: R$ 500,00 / R$ 1.200,00 / R$ 2.500,00
├── Dia de Vencimento: [1-31]
├── Desconto Inicial: [0-100%]
└── Data de Início: [Data picker]

Notificações:
└── [ ] Enviar email para gerente sobre novo cliente
```

### Detalhes do Cliente (ao clicar em um cliente)
**Mesma interface que o gerente vê, mas com controles administrativos adicionais:**
- Alterar gerente responsável
- Modificar plano/pagamento
- Suspender/reativar cliente
- Ver logs do sistema
- Acessar configurações técnicas

## 4. ABA FINANCEIRO

### Receitas e Projeções
```
Visão Mensal:
├── Receita Realizada: R$ 45.000,00
├── Receita Projetada: R$ 47.500,00
├── Diferença: +R$ 2.500,00 (+5.6%)
└── Gráfico: Real vs Projetado (últimos 6 meses)

Análise por Gerente:
├── Tabela com receita por gerente
├── % do total da receita
├── Crescimento mensal
└── Ranking de performance
```

### Inadimplências
```
Status de Pagamentos:
├── Em Dia: 133 clientes (R$ 34.000,00)
├── Vencendo Hoje: 8 clientes (R$ 5.200,00)
├── Atrasados 1-7 dias: 4 clientes (R$ 1.800,00)
├── Atrasados 8-30 dias: 3 clientes (R$ 1.200,00)
└── Atrasados >30 dias: 2 clientes (R$ 300,00)

Ações em Massa:
├── [Enviar Lembretes] [Suspender Serviços] [Negociar]
└── [Exportar Lista para Cobrança]
```

### Histórico de Pagamentos
**Tabela com filtros:**
- Cliente
- Gerente
- Período
- Status
- Valor
- Ações (Ver recibo, estornar, etc.)

## 5. ABA CONTATOS GLOBAIS

### Dashboard de Contatos
```
Métricas Gerais:
├── Total de Contatos: 45.230
├── Contatos únicos: 38.450
├── Conversas ativas: 12.450
├── Leads gerados: 12.450 (27.5%)
└── Taxa de conversão: 27.5%

Top Clientes por Contatos:
├── Empresa XYZ: 2.340 contatos
├── Empresa ABC: 1.890 contatos
├── Empresa DEF: 1.567 contatos
└── [Ver ranking completo]
```

### Análise Demográfica
```
Distribuição por Estado:
├── São Paulo: 35% (15.835 contatos)
├── Rio de Janeiro: 18% (8.142 contatos)
├── Minas Gerais: 12% (5.428 contatos)
└── [Gráfico pizza interativo]

Tags Mais Utilizadas:
├── interessado: 8.500 contatos (18.8%)
├── urgente: 6.200 contatos (13.7%)
├── vip: 4.800 contatos (10.6%)
└── [Nuvem de tags interativa]

Classe Social (estimada):
├── Classe A: 15% (6.784 contatos)
├── Classe B: 45% (20.353 contatos)
├── Classe C: 30% (13.569 contatos)
└── Classe D/E: 10% (4.523 contatos)
```

### Segmentação Global
**Ferramenta para criar listas personalizadas:**
```
Filtros Disponíveis:
├── Por Estado/Cidade
├── Por Tags
├── Por Score de Lead
├── Por Cliente de Origem
├── Por Data de Cadastro
├── Por Classe Social
└── Por Etapa do Funil

Resultado:
├── Contatos encontrados: 1.245
├── [Salvar Segmento] [Exportar CSV] [Criar Campanha]
└── [Enviar para Gerentes]
```

## 6. ABA RELATÓRIOS

### Relatórios Rápidos
- **Resumo Executivo:** PDF com principais métricas
- **Relatório Financeiro:** Receitas, inadimplências, projeções
- **Performance por Gerente:** Detalhamento individual
- **Análise de Clientes:** Ativos, cancelados, conversão

### Relatórios Customizados
**Construtor de Relatórios:**
```
Selecionar Dados:
├── Métricas Financeiras
├── Performance de Clientes
├── Análise de Conversas
├── Leads e Conversões
└── Dados Demográficos

Filtros Temporais:
├── Hoje
├── Última Semana
├── Último Mês
├── Último Trimestre
├── Personalizado (datas)

Formato de Saída:
├── PDF (relatório formatado)
├── Excel (dados brutos)
├── CSV (para análise externa)
└── Gráficos (imagens)
```

## 7. ABA SISTEMA

### Configurações Gerais
```
Sistema:
├── Nome da Empresa
├── Logo e Branding
├── Moeda Padrão
├── Fuso Horário
└── Idioma

Integrações:
├── Google Sheets: Conectado/Desconectado
├── Google Calendar: Conectado/Desconectado
├── APIs de IA: Status das chaves
└── Webhooks Externos

Limites e Cotas:
├── Máximo de Gerentes: 200
├── Máximo de Clientes por Gerente: 50
├── Rate Limit APIs: 1000 req/min
└── Armazenamento: 100GB total
```

### Usuários e Permissões
```
Gestão de Usuários:
├── Lista de todos os usuários (ADM + Gerentes)
├── Níveis de acesso
├── Logs de acesso
├── Reset de senhas
└── Desativação de contas

Permissões Granulares:
├── Acesso a módulos específicos
├── Limitação por cliente
├── Restrições de exportação
└── Aprovações obrigatórias
```

### Logs do Sistema
```
Tipos de Log:
├── Acessos ao sistema
├── Modificações em clientes
├── Erros e alertas
├── Backups realizados
└── Ações administrativas

Filtros:
├── Por usuário
├── Por data/hora
├── Por tipo de ação
├── Por cliente afetado
└── Pesquisa por termo
```

## Funcionalidades Transversais

### Notificações em Tempo Real
- Novos clientes criados
- Pagamentos atrasados
- Clientes offline
- Leads prioritários
- Backup concluído

### Busca Global (Ctrl+K)
- Buscar clientes
- Buscar gerentes
- Buscar contatos
- Buscar configurações

### Tema e Personalização
- Modo escuro/claro
- Cores da empresa
- Logo personalizado
- Layout responsivo

### Segurança
- Logout automático por inatividade
- Logs detalhados de ações
- Backup automático diário
- Recuperação de senha segura