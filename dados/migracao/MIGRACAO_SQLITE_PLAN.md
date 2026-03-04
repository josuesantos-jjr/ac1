# 📊 Plano Detalhado de Migração para SQLite

## 🎯 Objetivo
Migrar todo o sistema de armazenamento baseado em JSON para SQLite, mantendo sincronização bidirecional e compatibilidade com dados existentes.

## 📋 Análise da Estrutura Atual de Dados

### Dados Analisados:
- **infoCliente.json**: Configurações do cliente (API keys, status, prompts, etc.)
- **contatos.json**: Lista de contatos com telefone, nome, clientId
- **leads.json**: Leads qualificados com dados detalhados
- **Dados.json por chat**: Informações agregadas de conversas
- **Histórico de mensagens**: Arrays de mensagens por chatId
- **messageBuffer.json**: Buffer de mensagens não respondidas

### Volume de Dados:
- ±5 contatos por cliente
- ±10 leads por cliente ativo
- ±50+ chats históricos por cliente
- ±1000+ mensagens por chat ativo

## 🏗️ Schema Proposto do SQLite

### 1. **Tabela: system_settings**
Armazenar configurações globais do sistema
```sql
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. **Tabela: clientes**
Dados principais dos clientes
```sql
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT UNIQUE NOT NULL, -- ex: "ativos/CMW"
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Ativo', -- Ativo, Inativo, Cancelado, Modelo
  folder_type TEXT NOT NULL, -- ativos, cancelados, modelos
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Campos do infoCliente.json
  cliente TEXT,
  ai_selected TEXT,
  target_chat_id TEXT,
  gemini_key TEXT,
  groq_key TEXT,
  -- Outros campos do infoCliente...
);
```

### 3. **Tabela: clientes_config**
Configurações específicas do cliente (JSON complexo)
```sql
CREATE TABLE clientes_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  config_type TEXT NOT NULL, -- 'infoCliente', 'prompts', 'settings'
  config_key TEXT NOT NULL,
  config_value TEXT, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id),
  UNIQUE(client_id, config_type, config_key)
);
```

### 4. **Tabela: contatos**
Contatos dos clientes
```sql
CREATE TABLE contatos (
  id TEXT PRIMARY KEY, -- manter ID original
  client_id TEXT NOT NULL,
  nome TEXT,
  telefone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);
```

### 5. **Tabela: leads**
Leads qualificados
```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY, -- manter ID original
  client_id TEXT NOT NULL,
  contato_id TEXT,
  chat_id TEXT NOT NULL,
  nome TEXT,
  telefone TEXT,
  origem TEXT,
  tags TEXT, -- JSON array
  tipo_lead TEXT,
  lead_score INTEGER,
  etapa_funil TEXT,
  resumo_para_atendente TEXT,
  timestamp_identificacao DATETIME,
  data_geracao_lead TEXT,
  data_notificacao_lead DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id),
  FOREIGN KEY (contato_id) REFERENCES contatos(id)
);
```

### 6. **Tabela: chats**
Dados agregados dos chats (Dados.json)
```sql
CREATE TABLE chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT UNIQUE NOT NULL, -- ex: "5519989808901@c.us"
  client_id TEXT NOT NULL,
  name TEXT,
  telefone TEXT,
  tags TEXT, -- JSON array
  lista_nome TEXT,
  lead TEXT,
  interesse TEXT,
  lead_score REAL,
  etapa_funil TEXT,
  is_lead_qualificado BOOLEAN,
  detalhes_agendamento TEXT, -- JSON
  resumo_para_atendente TEXT,
  precisa_atendimento_humano BOOLEAN,
  data_ultima_mensagem_recebida DATETIME,
  data_ultima_mensagem_enviada DATETIME,
  data_ultima_analise DATETIME,
  ultima_notificacao_atendimento_humano DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);
```

### 7. **Tabela: messages**
Histórico de mensagens
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  message_type TEXT, -- 'User' ou 'Bot'
  message_content TEXT,
  message_date TEXT,
  message_time TEXT,
  message_data TEXT, -- JSON completo da mensagem
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);
```

### 8. **Tabela: message_buffer**
Buffer de mensagens não respondidas
```sql
CREATE TABLE message_buffer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  messages TEXT, -- JSON array
  answered BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
  FOREIGN KEY (client_id) REFERENCES clientes(client_id),
  UNIQUE(chat_id, client_id)
);
```

## 🔄 Estratégia de Migração

### Fase 1: Análise e Setup (✅ Completa)
- [x] Analisar estrutura atual de dados JSON
- [x] Projetar schema do banco SQLite
- [x] Criar arquivo de configuração do banco

### Fase 2: Implementação Core
- [ ] Criar módulo database.ts com funções de conexão
- [ ] Implementar funções de CRUD para cada tabela
- [ ] Criar utilitários de migração

### Fase 3: Migração de Dados
- [ ] Criar script de migração inicial
- [ ] Migrar dados dos clientes existentes
- [ ] Migrar dados de contatos, leads, chats
- [ ] Migrar histórico de mensagens

### Fase 4: Sincronização Bidirecional
- [ ] Implementar sync JSON → SQLite
- [ ] Implementar sync SQLite → JSON
- [ ] Criar triggers de atualização automática

### Fase 5: Atualização da API
- [ ] Modificar /api/listClientes para consultar banco
- [ ] Atualizar operações de CRUD dos clientes
- [ ] Manter compatibilidade com JSON legado

### Fase 6: Testes e Validação
- [ ] Testar integridade dos dados
- [ ] Validar performance das consultas
- [ ] Testar operações de CRUD

## 🚀 Benefícios Esperados

1. **Performance**: Consultas muito mais rápidas
2. **Confiabilidade**: ACID compliance, integridade referencial
3. **Escalabilidade**: Suporte a mais dados sem degradação
4. **Manutenção**: SQL padronizado vs manipulação manual de JSON
5. **Backup**: SQLite nativo + possibilidade de replicação
6. **Análises**: Consultas complexas facilitadas

## ⚠️ Riscos e Mitigações

1. **Perda de Dados**: Backup completo antes da migração
2. **Incompatibilidade**: Manter JSON como fallback
3. **Performance**: Otimizar queries e índices
4. **Sincronização**: Implementar transações seguras

## 📊 Métricas de Sucesso

- Tempo de resposta da API < 1s
- Zero perda de dados durante migração
- Compatibilidade 100% com sistema atual
- Performance de consultas 10x melhor

---

*Este plano será executado de forma gradual, mantendo sempre a possibilidade de rollback para o sistema JSON original.*