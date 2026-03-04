# Documentação Frontend - Acesso Cliente

## Visão Geral
O cliente possui acesso focado nas suas próprias conversas, leads, relatórios e gestão de campanhas do seu negócio específico.

## Estrutura de Navegação

### Menu Lateral Principal
```
🏢 [NOME DA EMPRESA]
├── 📊 Dashboard
├── 💬 Conversas
│   ├── Conversas Ativas
│   ├── Buscar Conversa
│   ├── Histórico Completo
├── 📞 Contatos & Campanhas
│   ├── Minhas Listas
│   ├── Criar Nova Lista
│   ├── Campanhas Ativas
├── 📊 Relatórios
│   ├── Relatórios Gerais
│   ├── Análise de Conversas
│   ├── Performance de Leads
├── 📅 Agendamentos
│   ├── Calendário Google
│   ├── Reuniões Agendadas
│   ├── Criar Agendamento
└── ⚙️ Configurações
```

## 1. DASHBOARD CLIENTE (Página Inicial)

### Métricas de Hoje (Cards Principais)
```
📈 DESEMPENHO HOJE
├── 💬 Conversas Iniciadas: 23
├── 🎯 Leads Novos: 8
├── 📅 Agendamentos Marcados: 3
├── ⭐ Taxa de Satisfação: 94%
├── ⏱️ Tempo Médio de Resposta: 15 min
└── 💰 Valor Estimado em Leads: R$ 12.500,00
```

### Conversas Ativas (Lista Central)
```
CONVERSAS EM ANDAMENTO
├── 🟢 João Silva - 11:30
│   ├── "Olá, gostaria de saber sobre..."
│   ├── 🏷️ Interessado | Score: 8.5
│   └── [Ver Conversa] [Marcar Atendimento]
│
├── 🟡 Maria Santos - 10:45
│   ├── "Qual o preço do produto X?"
│   ├── 🏷️ Qualificação | Score: 6.2
│   └── [Ver Conversa] [Marcar Atendimento]
│
└── 🟠 Pedro Costa - 09:20
    ├── "Quando posso agendar uma visita?"
    ├── 🏷️ Agendamento | Score: 7.8
    └── [Ver Conversa] [Marcar Atendimento]
```

### Funil de Vendas Atual (Gráfico Lateral)
```
FUNIL DE VENDAS - HOJE
┌─────────────────────────────────────┐
│          📊 GRÁFICO PIZZA           │
│                                     │
│ 🟦 Contato Inicial: 45 (35%)        │
│ 🟨 Interessado: 32 (25%)            │
│ 🟪 Qualificado: 28 (22%)            │
│ 🟩 Fechamento: 23 (18%)             │
│                                     │
│ Total de Contatos: 128              │
│ Conversão Total: 18%               │
└─────────────────────────────────────┘
```

### Próximos Agendamentos (Calendário Mini)
```
📅 PRÓXIMOS COMPROMISSOS
├── Hoje 14:00 - Reunião com João Silva
├── Amanhã 10:30 - Apresentação Empresa X
├── 28/11 15:00 - Follow-up Maria Santos
└── [Ver Calendário Completo]
```

## 2. ABA CONVERSAS

### Buscar Conversa Específica
```
🔍 LOCALIZAR CONVERSA
├── Buscar por Número: [+55 11 99999-9999]
├── Ou buscar por Nome: [João Silva]
└── [Botão Buscar]

Resultado:
├── ✅ Conversa encontrada
└── [Abrir Conversa]
```

### Conversa Detalhada (Interface de Chat)
```
CONVERSA ATIVA - João Silva (+55 11 99999-9999)

[Cabeçalho da Conversa]
├── 🧑 João Silva
├── 🏷️ Tags: interessado, produto_x
├── 📊 Score: 8.5 | Etapa: Interessado
├── 🕒 Última mensagem: 5 min atrás
└── 📍 Status: Aguardando resposta

[Histórico de Mensagens - Scroll Reversa]
├── 🤖 Sistema: "Olá João, obrigado pelo contato..."
├── 🧑 João: "Oi, quero saber sobre o produto X"
├── 🤖 Sistema: "Claro! O produto X tem essas caracter..."
├── 🧑 João: "Qual o preço?"
└── [Campo para enviar mensagem manual]

[Ações Disponíveis]
├── 💬 Enviar Mensagem Manual
├── 👤 Marcar Atendimento Humano
├── 📅 Agendar Reunião
├── ✅ Fechar Negócio
└── 🚫 Encerrar Conversa
```

### Histórico Completo de Conversas
**Tabela com filtros:**
- Período (hoje, semana, mês)
- Status (ativas, finalizadas, atendimento humano)
- Etapa do funil
- Tags
- Score mínimo

**Colunas da Tabela:**
- Contato
- Data/Hora Início
- Status
- Etapa Atual
- Score
- Última Atividade
- Ações

## 3. ABA CONTATOS & CAMPANHAS

### Minhas Listas de Contatos
```
LISTAS ATIVAS
├── 📋 Lista: "Prospects SP"
│   ├── 📞 Contatos: 1.245
│   ├── 📤 Enviada: 3x
│   ├── 📈 Taxa Abertura: 68%
│   ├── 📉 Respostas: 12%
│   └── [Ver Detalhes] [Editar] [Disparar Novamente]
│
├── 📋 Lista: "Clientes VIP"
│   ├── 📞 Contatos: 234
│   ├── 📤 Última: 15/11
│   ├── 📈 Engajamento: 85%
│   └── [Ver Detalhes] [Duplicar]
│
└── ➕ [Criar Nova Lista]
```

### Criar Nova Lista
```
CRIAR LISTA DE CONTATOS

[Passo 1: Informações Básicas]
├── Nome da Lista: [Campo obrigatório]
├── Descrição: [Campo opcional]
└── [Próximo]

[Passo 2: Adicionar Contatos]
├── 📤 Importar CSV/Excel
├── ➕ Adicionar Manualmente
├── 📞 Importar do WhatsApp
└── [Voltar] [Próximo]

[Passo 3: Configurar Campanha]
├── 📝 Mensagem Inicial
├── 🖼️ Anexar Mídia (opcional)
├── ⏰ Agendamento (imediato ou agendado)
└── [Voltar] [Criar Campanha]
```

### Detalhes da Lista
```
LISTA: "Prospects SP" (1.245 contatos)

📊 ESTATÍSTICAS GERAIS
├── Criada em: 10/11/2024
├── Última atualização: 20/11/2024
├── Status: Ativa
└── Campanhas realizadas: 3

📈 PERFORMANCE
├── Taxa de abertura: 68%
├── Taxa de resposta: 12%
├── Conversões para lead: 8%
└── Valor estimado: R$ 45.000,00

👥 CONTATOS DA LISTA (amostra)
├── João Silva - +55 11 99999-9999
├── Maria Santos - +55 11 88888-8888
├── Pedro Costa - +55 11 77777-7777
└── [Ver Todos os Contatos] [Exportar Lista]
```

### Campanhas Ativas
```
CAMPANHAS EM ANDAMENTO

🟢 Campanha: "Promoção Black Friday" (Ativa)
├── 📋 Lista: "Clientes Cadastrados"
├── 📅 Iniciada: 20/11/2024
├── 📊 Status: 45% concluída
├── 💬 Mensagens enviadas: 560/1.245
├── 📈 Respostas: 68
└── [Pausar] [Ver Relatório] [Editar]

🟡 Campanha: "Follow-up Interessados" (Agendada)
├── 📋 Lista: "Leads Quentes"
├── ⏰ Início: 25/11/2024 09:00
├── 📝 Status: Aguardando
└── [Editar Agendamento] [Cancelar]
```

## 4. ABA RELATÓRIOS

### Relatórios Inteligentes
```
RELATÓRIOS DE PERFORMANCE

📅 PERÍODO: [ ▼ Última Semana ] [ ▼ Hoje ]

📊 MÉTRICAS PRINCIPAIS
├── Conversas Iniciadas: 1.245
├── Leads Gerados: 234
├── Agendamentos Marcados: 45
└── Taxa de Conversão: 18.8%
```

### Gráficos Interativos
```
📈 CONVERSAS POR DIA (Gráfico de Linha)
├── Mostra evolução diária das conversas
└── Hover mostra detalhes do dia

🥧 DISTRIBUIÇÃO POR ETAPA (Gráfico Pizza)
├── Contato Inicial: 35%
├── Interessado: 25%
├── Qualificado: 22%
├── Negociação: 15%
└── Fechamento: 18%

📊 PERFORMANCE POR HORA (Gráfico Barras)
├── Mostra quando os contatos são mais ativos
└── Ajuda a otimizar horários de resposta
```

### Relatórios Detalhados
```
📄 RELATÓRIOS DISPONÍVEIS

📋 Conversas Detalhadas
├── Lista completa de todas as conversas
├── Com filtros por período, status, tags
└── Exportável em Excel/CSV

🏷️ Análise por Tags
├── Quais tags são mais utilizadas
├── Performance por tag
├── Tendências de tags ao longo do tempo

🤖 Performance da IA
├── Taxa de resposta automática
├── Qualidade das respostas
├── Quando intervenção humana foi necessária

🎯 Leads Qualificados
├── Lista de leads com score > 7
├── Detalhes de cada lead
├── Histórico de evolução

📅 Agendamentos
├── Reuniões marcadas no período
├── Taxa de comparecimento
├── Valor estimado dos agendamentos
```

### Filtros Avançados
```
🔍 FILTROS PERSONALIZADOS
├── Data Inicial: [Calendário]
├── Data Final: [Calendário]
├── Tags: [Multiselect]
├── Score Mínimo: [Slider 0-10]
├── Etapa do Funil: [Select]
├── Status da Conversa: [Select]
└── [Aplicar Filtros] [Limpar] [Salvar Filtro]
```

## 5. ABA AGENDAMENTOS

### Calendário Integrado Google
```
📅 CALENDÁRIO DE AGENDAMENTOS

[Visualização Mensal/Semanal/Diária]
├── Eventos marcados aparecem no calendário
├── Cores por tipo de reunião
├── Status: Confirmado/Pendente/Cancelado

[Lista de Eventos Próximos]
├── Hoje:
│   ├── 14:00 - Reunião com João Silva
│   └── 16:30 - Apresentação Produto X
├── Amanhã:
│   └── 10:30 - Follow-up Maria Santos
```

### Criar Novo Agendamento
```
NOVO AGENDAMENTO

[Dados do Contato]
├── Nome: [Selecionar da lista ou digitar]
├── Telefone: [Autocompletar]
└── Email: [Opcional]

[Detalhes da Reunião]
├── Título: [Campo obrigatório]
├── Data: [Date picker]
├── Hora: [Time picker]
├── Duração: [Select 15/30/60 min]
└── Local: [Presencial/Virtual]

[Descrição e Notas]
├── Descrição: [Textarea]
├── Valor Estimado: [Campo monetário]
├── Tags: [Multiselect]
└── Lembrete: [Checkbox - enviar lembrete]

[Integração Google Calendar]
└── [ ] Sincronizar com Google Calendar
```

### Gerenciar Agendamentos
```
MEUS AGENDAMENTOS

[Filtros Rápidos]
├── Hoje | Amanhã | Esta Semana | Este Mês

[Tabela de Agendamentos]
├── Data/Hora
├── Contato
├── Tipo
├── Status
├── Valor Estimado
├── [Editar] [Cancelar] [Confirmar]

[Estatísticas]
├── Total de agendamentos: 45
├── Taxa de comparecimento: 78%
├── Receita estimada: R$ 125.000,00
└── Próxima reunião: Hoje 14:00
```

## 6. ABA CONFIGURAÇÕES

### Configurações da Empresa
```
INFORMAÇÕES DA EMPRESA

[Dados Básicos]
├── Razão Social: [Editável]
├── CNPJ: [Editável]
├── Email Corporativo: [Editável]
├── Telefone: [Editável]
└── Endereço: [Editável]

[Branding]
├── Logo da Empresa: [Upload imagem]
├── Cor Primária: [Color picker]
├── Cor Secundária: [Color picker]
└── [Salvar Alterações]
```

### Configurações de WhatsApp
```
CONFIGURAÇÃO WHATSAPP

[Status da Conexão]
├── Status: 🟢 Conectado
├── Número: +55 11 99999-9999
├── Última atividade: 5 min atrás
└── [Testar Conexão]

[Preferências de Resposta]
├── Tempo máximo resposta: 30 min
├── Dias de funcionamento: Seg-Sex
├── Horário: 08:00 - 18:00
└── Mensagem fora expediente: [Textarea]
```

### Configurações de IA
```
PERSONALIZAÇÃO DA IA

[Treinamento da IA]
├── Prompt personalizado: [Textarea grande]
├── Exemplos de conversas: [Upload arquivos]
├── Palavras-chave do negócio: [Lista editável]
└── [Salvar Treinamento]

[Qualidade de Respostas]
├── Nível de criatividade: [Slider 1-10]
├── Comprimento máximo: [Select]
├── Linguagem formal: [Checkbox]
└── Evitar termos técnicos: [Checkbox]
```

### Notificações
```
PREFERÊNCIAS DE NOTIFICAÇÃO

[Tipos de Notificação]
├── 🔔 Novos leads: [Email + Push]
├── 💬 Conversas ativas: [Push only]
├── 📅 Agendamentos: [Email + Push]
├── 📊 Relatórios semanais: [Email]
└── 🚨 Alertas sistema: [Push + Email]

[Canais de Notificação]
├── Email: [Editar endereço]
├── WhatsApp: [Número para notificações]
├── Push Browser: [Ativado/Desativado]
└── SMS: [Premium - desativado]
```

## Funcionalidades Transversais

### Busca Global (Ctrl+K)
- Buscar conversas por nome/número
- Buscar contatos por tag
- Buscar agendamentos por data
- Buscar listas por nome

### Notificações em Tempo Real
- Novos leads qualificados
- Conversas aguardando resposta
- Agendamentos próximos
- Campanhas concluídas

### Tema e Personalização
- Modo escuro/claro
- Cores da empresa aplicadas
- Logo no cabeçalho
- Layout responsivo

### Segurança e Privacidade
- Logout automático
- Dados criptografados
- Backup automático
- Histórico de acessos

## Limitações do Acesso Cliente

### O que o Cliente NÃO vê:
- ❌ Outros clientes do gerente
- ❌ Listas segmentadas criadas pelo gerente
- ❌ Base global de contatos
- ❌ Receitas e comissões do gerente
- ❌ Configurações administrativas

### O que o Cliente TEM:
- ✅ Acesso completo às suas conversas
- ✅ Gestão de suas próprias listas
- ✅ Relatórios personalizados
- ✅ Integração Google Calendar
- ✅ Configurações da sua empresa
- ✅ Personalização da IA para seu negócio

## Mobile App Features

### Otimizações para Mobile
- Interface touch-friendly
- Gráficos responsivos
- Busca por voz
- Notificações push
- Acesso offline básico

### PWA (Progressive Web App)
- Instalável na home screen
- Funciona offline
- Notificações push
- Ícone personalizado
- Loading rápido