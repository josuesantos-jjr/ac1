# Documentação Frontend - Acesso Gerente

## Visão Geral
O gerente possui acesso intermediário ao sistema, podendo visualizar e gerenciar apenas os clientes designados a ele, além de ter ferramentas para segmentação avançada de contatos e acompanhamento de performance.

## Estrutura de Navegação

### Menu Lateral Principal
```
🏢 SISTEMA DE GESTÃO - GERENTE: [NOME DO GERENTE]
├── 📊 Dashboard
├── 🏢 Meus Clientes
│   ├── Visão Geral
│   ├── Cliente Específico [Dropdown]
│   └── Performance Consolidada
├── 📞 Segmentação de Contatos
│   ├── Base Global de Contatos
│   ├── Criar Listas Segmentadas
│   ├── Listas Criadas
├── 💰 Minhas Comissões
│   ├── Resumo Atual
│   ├── Histórico de Pagamentos
│   └── Metas e Progresso
├── 📊 Relatórios
│   ├── Performance Geral
│   ├── Análise por Cliente
│   └── Relatórios Customizados
├── ⚙️ Configurações
│   ├── Perfil e Dados
│   ├── Preferências
│   └── Segurança
└── 👤 Meu Perfil
```

## 1. DASHBOARD GERENTE (Página Inicial)

### Clientes Designados (Cards Principais)
```
MEUS CLIENTES ATIVOS

Para cada cliente designado:
┌─────────────────────────────────────┐
│ 🟢 Empresa ABC                      │
│ Status PM2: Online                  │
│ Conversas Hoje: 23                  │
│ Leads Hoje: 8                       │
│ Receita: R$ 2.500/mês               │
│ Prazo: 15/12                        │
│ [Ver Detalhes] [Editar] [Relatórios] │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🟡 Empresa XYZ                      │
│ Status PM2: Offline                 │
│ Última Atividade: 2h atrás          │
│ Conversas Hoje: 12                  │
│ Receita: R$ 1.800/mês               │
│ Prazo: 20/12                        │
│ [Ver Detalhes] [Editar] [Relatórios] │
└─────────────────────────────────────┘
```

### Métricas Consolidadas (Topo)
```
📈 PERFORMANCE CONSOLIDADA HOJE
├── 💼 Total de Clientes: 12 (10 Ativos, 2 Cancelados)
├── 💬 Conversas Totais: 95
├── 🎯 Leads Totais: 28
├── 📅 Agendamentos Totais: 15
└── 💰 Receita Total: R$ 22.300/mês
```

### Gráfico de Receita Consolidada
```
RECEITA TOTAL DOS MEUS CLIENTES
┌─────────────────────────────────────┐
│ Gráfico de barras mostrando:        │
│ - Receita mensal por cliente        │
│ - Meta vs Realizado                 │
│ - Projeção para o mês atual         │
└─────────────────────────────────────┘
```

### Alertas e Ações Pendentes
```
🚨 ALERTAS IMPORTANTES
├── Cliente Empresa ABC - Status offline há 2h
├── 3 pagamentos vencendo nos próximos 3 dias
├── 5 clientes com baixa atividade hoje
└── Meta de receita 78% atingida este mês

⏰ AÇÕES PENDENTES
├── Revisar configuração da Empresa DEF
├── Aprovar relatório mensal da Empresa GHI
├── Entrar em contato com cliente cancelado
└── Atualizar lista de contatos segmentada
```

## 2. ABA MEUS CLIENTES

### Visão Geral Consolidada
```
TODOS OS MEUS CLIENTES

[Filtros Rápidos]
├── Ativos | Cancelados | Todos | Com Alertas

[Tabela de Clientes]
├── Empresa
├── Status
├── Status PM2
├── Conversas Hoje
├── Leads Hoje
├── Receita Mensal
├── Prazo Pagamento
├── Última Atividade
└── [Ações: Ver | Editar | Relatórios]
```

### Detalhes de Cliente Específico
```
CLIENTE SELECIONADO: Empresa ABC

[Mesma interface que o cliente vê + controles gerenciais]

INFORMAÇÕES GERAIS
├── Razão Social: Empresa ABC Ltda
├── Segmento: Tecnologia
├── Data de Cadastro: 15/06/2024
├── Plano: Premium (R$ 2.500/mês)
├── Status: Ativo
└── Status PM2: Online

DESEMPENHO HOJE
├── Conversas: 23
├── Leads: 8
├── Agendamentos: 3
├── Tempo Médio Resposta: 15 min
└── Taxa Satisfação: 94%

CONFIGURAÇÕES WHATSAPP
├── Número: +55 11 99999-9999
├── IA Ativa: Gemini 1.5 Pro
├── Horário Funcionamento: 08h-18h
└── [Editar Configurações]

FINANCEIRO
├── Valor Mensal: R$ 2.500,00
├── Último Pagamento: 15/11/2024
├── Próximo Vencimento: 15/12/2024
├── Status Pagamento: Em dia
└── [Ver Histórico] [Editar Plano]
```

### Acesso Cliente (Funcionalidade Especial)
```
ENTRAR COMO CLIENTE

[Botão: "Acessar Dashboard do Cliente"]

└── Permite ao gerente visualizar exatamente
    a mesma interface que o cliente vê,
    mas sem poder fazer alterações.
    Útil para treinamentos e suporte.
```

## 3. ABA SEGMENTAÇÃO DE CONTATOS

### Base Global de Contatos
```
BASE COMPLETA DE CONTATOS (Todos os Clientes)

MÉTRICAS GERAIS
├── Total de Contatos: 45.230
├── Contatos únicos: 38.450
├── Conversas ativas: 12.450
├── Leads gerados: 12.450 (27.5%)
└── Taxa de conversão global: 27.5%

ANÁLISE DEMOGRÁFICA
├── Distribuição por Estado (Mapa)
├── Tags mais utilizadas (Nuvem)
├── Classes sociais (Gráfico pizza)
├── Padrões de comportamento
└── Horários de maior atividade
```

### Criar Lista Segmentada
```
CRIAR NOVA LISTA SEGMENTADA

[Passo 1: Informações Básicas]
├── Nome da Lista: [Campo obrigatório]
├── Descrição: [Campo opcional]
├── Cliente Destino: [Dropdown - Meus clientes]
└── [Próximo]

[Passo 2: Critérios de Segmentação]

FILTROS DISPONÍVEIS:
├── Localização: [Estado/Cidade]
├── Tags: [Multiselect - interessado, urgente, vip]
├── Score do Lead: [Slider 0-10]
├── Etapa do Funil: [Select]
├── Classe Social: [Estimada pelo sistema]
├── Valor Estimado: [Range monetário]
├── Data do Último Contato: [Date range]
├── Frequência de Contato: [Alta/Média/Baixa]
└── Interesses Específicos: [Campo texto]

[Resultado em Tempo Real]
├── Contatos encontrados: 1.245
├── Score médio: 7.8
├── Valor estimado total: R$ 245.000,00
├── Distribuição por estado: SP (45%), RJ (20%)
└── [Salvar Lista] [Exportar] [Testar Campanha]
```

### Gerenciar Listas Criadas
```
MINHAS LISTAS SEGMENTADAS

LISTAS ATIVAS
├── 📋 Lista: "VIPs São Paulo"
│   ├── 📞 Contatos: 890
│   ├── 🎯 Score médio: 8.5
│   ├── 💰 Valor estimado: R$ 180.000,00
│   ├── 📤 Última utilização: 15/11
│   └── [Editar] [Duplicar] [Excluir] [Usar Agora]

├── 📋 Lista: "Interessados Tech RJ"
│   ├── 📞 Contatos: 1.245
│   ├── 🎯 Score médio: 7.2
│   ├── 💰 Valor estimado: R$ 95.000,00
│   ├── 📤 Criada hoje
│   └── [Editar] [Duplicar] [Excluir] [Usar Agora]

LISTAS INATIVAS (Arquivadas)
└── Listas antigas mantidas para referência
```

## 4. ABA MINHAS COMISSÕES

### Resumo Atual do Mês
```
COMISSÕES - NOVEMBRO 2024

RESUMO GERAL
├── Comissão Atual: R$ 2.350,00
├── Percentual: 15% sobre receita dos clientes
├── Meta Mensal: R$ 3.000,00
├── Progresso: 78% (barra de progresso colorida)
└── Previsão Final: R$ 2.850,00 (95% da meta)

DETALHAMENTO POR CLIENTE
├── Empresa ABC: R$ 375,00 (15% de R$ 2.500)
├── Empresa XYZ: R$ 270,00 (15% de R$ 1.800)
├── Empresa DEF: R$ 225,00 (15% de R$ 1.500)
└── [Ver detalhamento completo]
```

### Histórico de Pagamentos
```
HISTÓRICO DE COMISSÕES

[Filtros]
├── Mês/Ano: [Dropdown]
├── Status: Pago | Pendente | Todos

TABELA DE PAGAMENTOS
├── Período
├── Valor Calculado
├── Status
├── Data Pagamento
├── Método
└── [Ver Recibo] [Baixar Comprovante]

GRÁFICO EVOLUTIVO
└── Linha mostrando crescimento mensal das comissões
```

### Metas e Progresso
```
METAS DE PERFORMANCE

META ATUAL: R$ 3.000,00/mês

COMPOSIÇÃO DA META:
├── Meta por Receita: R$ 20.000,00/mês dos clientes
├── Taxa de Comissão: 15%
├── Meta Calculada: R$ 3.000,00
└── Progresso Atual: 78%

DESAFIOS PARA ATINGIR META:
├── Empresa GHI: Precisa crescer R$ 300,00
├── Novo cliente: Meta de R$ 500,00
└── Otimização de conversão: +5%
```

## 5. ABA RELATÓRIOS

### Performance Geral
```
RELATÓRIOS DE PERFORMANCE

PERÍODO: [ ▼ Última Semana ] [ ▼ Hoje ]

MÉTRICAS CONSOLIDADAS
├── Receita Total: R$ 22.300,00
├── Número de Conversas: 1.234
├── Leads Gerados: 345
├── Agendamentos: 89
└── Taxa Conversão: 28%

GRÁFICO RECEITA (Linha)
├── Evolução diária da receita
├── Comparativo com mês anterior
└── Projeção para fim do mês

ANÁLISE POR CLIENTE
├── Tabela ranking de performance
├── Conversas por cliente
├── Leads por cliente
└── Receita por cliente
```

### Relatórios por Cliente
```
ANÁLISE DETALHADA POR CLIENTE

[Selecionar Cliente: Dropdown]

Para cliente selecionado:
├── Conversas por dia (última semana)
├── Funil de vendas atual
├── Performance da IA
├── Tags mais utilizadas
└── Horários de pico

COMPARATIVO
├── Vs média do gerente
├── Vs melhor cliente
├── Vs pior cliente
└── Tendências de crescimento
```

### Relatórios Customizados
```
CONSTRUTOR DE RELATÓRIOS

[Selecionar Dados]
├── 📊 Financeiros (receita, comissões)
├── 💬 Conversas (volume, qualidade)
├── 🎯 Leads (quantidade, qualificação)
├── 👥 Contatos (segmentação, demographics)
└── 🤖 IA (performance, treinamento)

[Filtros Temporais]
├── Hoje | Ontem | Última Semana
├── Último Mês | Últimos 3 Meses
├── Este Ano | Ano Passado
└── Personalizado (datas)

[Formato de Saída]
├── 📄 PDF (relatório formatado)
├── 📊 Excel (dados brutos)
├── 📈 Gráficos (PNG)
└── 📧 Email (envio automático)
```

## 6. ABA CONFIGURAÇÕES

### Perfil e Dados Pessoais
```
INFORMAÇÕES PESSOAIS

[Dados Básicos]
├── Nome Completo: [Editável]
├── Email: [Editável]
├── Telefone: [Editável]
├── Data Nascimento: [Editável]
└── CPF: [Editável]

[Informações Profissionais]
├── Cargo: Gerente de Contas
├── Data Admissão: [Não editável - mostra quando foi contratado]
├── Percentual Comissão: 15%
├── Meta Mensal: R$ 3.000,00
└── Status: Ativo

[Foto do Perfil]
└── [Upload/Update foto]
```

### Preferências do Sistema
```
CONFIGURAÇÕES DE PREFERÊNCIA

[Interface]
├── Tema: Claro | Escuro | Automático
├── Idioma: Português (Brasil)
├── Formato Data: DD/MM/YYYY
└── Fuso Horário: America/Sao_Paulo

[Notificações]
├── Email: [ ] Novos clientes | [ ] Relatórios | [ ] Alertas
├── Push: [ ] Conversas ativas | [ ] Pagamentos | [ ] Sistema
├── WhatsApp: [ ] Número para notificações
└── Som: [ ] Ativar sons de notificação

[Dashboard]
├── Cards em destaque: Receita | Clientes | Conversas
├── Gráficos padrão: Barras | Linha | Pizza
├── Atualização automática: [ ] 30s | [ ] 1min | [ ] 5min
└── Ordem dos clientes: Receita | Nome | Status
```

### Segurança e Acesso
```
SEGURANÇA DA CONTA

[Alterar Senha]
├── Senha Atual: [Campo password]
├── Nova Senha: [Campo password]
├── Confirmar Nova Senha: [Campo password]
└── [Alterar Senha]

[Autenticação de Dois Fatores]
├── Status: Desativado
├── [Ativar 2FA]
└── Apps suportados: Google Authenticator, Authy

[Sessões Ativas]
├── Dispositivo Atual: Chrome - Windows
├── Último Acesso: 27/11/2024 14:30
└── [Encerrar Todas as Sessões]

[Histórico de Acesso]
├── Lista dos últimos 10 acessos
├── Data, hora, dispositivo, localização
└── [Download Histórico Completo]
```

## Funcionalidades Transversais

### Busca Global (Ctrl+K)
- Buscar clientes específicos
- Buscar contatos por nome/telefone
- Buscar listas segmentadas
- Buscar relatórios por período

### Notificações em Tempo Real
- Novos leads nos clientes
- Clientes offline
- Pagamentos próximos do vencimento
- Metas de comissão atingidas
- Campanhas concluídas

### Modo "Entrar como Cliente"
- Acesso temporário ao dashboard do cliente
- Modo somente leitura
- Rastreamento de ações realizadas
- Fácil retorno ao modo gerente

### Exportação e Compartilhamento
- Exportar relatórios em PDF
- Compartilhar dashboards com clientes
- Download de dados em Excel
- API para integrações externas

## Limitações do Acesso Gerente

### O que o Gerente VÊ:
- ✅ Todos os clientes designados a ele
- ✅ Base global de contatos (para segmentação)
- ✅ Relatórios consolidados dos seus clientes
- ✅ Comissões e performance pessoal
- ✅ Configurações dos clientes (com permissões)

### O que o Gerente NÃO vê:
- ❌ Outros gerentes e suas informações
- ❌ Receitas e configurações administrativas
- ❌ Usuários e permissões do sistema
- ❌ Logs administrativos
- ❌ Criação de novos clientes (só ADM)

### O que o Gerente PODE fazer:
- ✅ Editar configurações dos seus clientes
- ✅ Criar listas segmentadas para seus clientes
- ✅ Acessar dashboards dos clientes (modo leitura)
- ✅ Gerar relatórios personalizados
- ✅ Visualizar comissões e metas

## Mobile Responsiveness

### Otimizações Mobile
- Dashboard simplificado para telas pequenas
- Cards expansíveis com informações resumidas
- Navegação por gestos (swipe)
- Botões de ação flutuantes
- Gráficos touch-friendly

### PWA Features
- Instalação como app nativo
- Notificações push
- Funcionamento offline básico
- Sincronização automática
- Ícones adaptados por plataforma

## Métricas de Performance

### KPIs Principais do Gerente
- Receita total dos clientes
- Satisfação dos clientes
- Taxa de conversão média
- Tempo de resposta médio
- Percentual de metas atingidas

### Relatórios Automáticos
- Relatório semanal de performance
- Ranking mensal entre gerentes
- Análise de tendências trimestrais
- Comparativo anual de crescimento