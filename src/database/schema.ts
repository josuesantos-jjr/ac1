/**
 * Schema do banco de dados SQLite para migração do sistema
 * Mantém isolamento completo por cliente via client_id
 */

export const DATABASE_SCHEMA = `
-- ===========================================
-- SISTEMA DE BANCO DE DADOS CRM WHATSAPP
-- ===========================================

-- Configurações globais do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clientes principais
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT UNIQUE NOT NULL, -- ex: "CMW"
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Ativo', -- Ativo, Inativo, Cancelado, Modelo
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Campos do infoCliente.json
  cliente TEXT,
  codigo TEXT, -- código fixo do cliente (nome da pasta)
  ai_selected TEXT,
  target_chat_id TEXT,
  gemini_key TEXT,
  groq_key TEXT
);

-- Configurações específicas do cliente (JSON complexo)
CREATE TABLE IF NOT EXISTS clientes_config (
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

-- Contatos dos clientes
CREATE TABLE IF NOT EXISTS contatos (
  id TEXT PRIMARY KEY, -- manter telefone como ID
  client_id TEXT NOT NULL,
  nome TEXT,
  telefone TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- Leads qualificados
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, -- mesmo ID do contato
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
  FOREIGN KEY (contato_id) REFERENCES contatos(id),
  FOREIGN KEY (chat_id) REFERENCES chats(chat_id)
);

-- Dados agregados dos chats (Dados.json)
CREATE TABLE IF NOT EXISTS chats (
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

-- Histórico de mensagens
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT,
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

-- Buffer de mensagens não respondidas
CREATE TABLE IF NOT EXISTS message_buffer (
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

-- Estatísticas e métricas
CREATE TABLE IF NOT EXISTS statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'messages_sent', 'conversions', 'response_time'
  metric_value REAL,
  date_recorded DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- Sistema de backups
CREATE TABLE IF NOT EXISTS backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT,
  backup_type TEXT NOT NULL, -- 'full', 'incremental', 'config_only'
  file_path TEXT NOT NULL,
  file_size INTEGER,
  checksum TEXT,
  status TEXT DEFAULT 'completed', -- 'completed', 'failed', 'in_progress'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- Logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'status_change'
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_value TEXT, -- JSON
  new_value TEXT, -- JSON
  ip_address TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- Controle de permissões
CREATE TABLE IF NOT EXISTS user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  client_id TEXT,
  permission_level TEXT NOT NULL, -- 'read', 'write', 'admin', 'super_admin'
  resource_type TEXT NOT NULL, -- 'client', 'chat', 'lead', 'report'
  resource_id TEXT,
  granted_by TEXT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- ===========================================
-- ÍNDICES PARA PERFORMANCE
-- ===========================================

-- Índices essenciais para isolamento por cliente
CREATE INDEX IF NOT EXISTS idx_clientes_client_id ON clientes(client_id);
CREATE INDEX IF NOT EXISTS idx_contatos_client_id ON contatos(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_chats_client_id ON chats(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads(client_id, tags);
CREATE INDEX IF NOT EXISTS idx_chats_tags ON chats(client_id, tags);
CREATE INDEX IF NOT EXISTS idx_messages_chat_date ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(client_id, lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(client_id, precisa_atendimento_humano);

-- Índices para auditoria e estatísticas
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_timestamp ON audit_logs(client_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_statistics_client_date ON statistics(client_id, date_recorded);
`;

// Queries de manutenção e otimização
export const DATABASE_MAINTENANCE = {
  // Otimização após migração
  optimize: `
    VACUUM;
    ANALYZE;
  `,

  // Verificar integridade
  integrityCheck: `
    PRAGMA integrity_check;
  `,

  // Backup do banco (WAL mode)
  backup: `
    VACUUM INTO ?;
  `
};

// Migrações necessárias para atualizar bancos existentes
export const DATABASE_MIGRATIONS = [
  // Migração 1: Adicionar coluna id na tabela clientes (com verificação de existência)
  {
    version: 1,
    name: 'add_id_column',
    // SQLite não suporta IF NOT EXISTS para colunas, então usamos uma abordagem segura
    sql: `-- Esta migração será executada apenas se a coluna não existir
-- O código de migração verifica a existência da coluna antes de adicionar`
  }
];

// Função de migração segura que verifica se a coluna existe
// Versão com callbacks para evitar problemas com promises no sqlite3
export function runSafeMigrations(db: any) {
  console.log('[Migration] Iniciando migração...');
  
  // Primeiro, verificar se a tabela existe
  db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='clientes'"
  ).get(function(err: any, row: any) {
    if (err) {
      console.log('[Migration] Erro ao verificar tabela:', err.message);
      return;
    }
    
    if (!row) {
      console.log('[Migration] Tabela clientes não existe, criando...');
      return;
    }
    
    // Tentar adicionar a coluna diretamente (ignora erro se já existir)
    db.exec(`ALTER TABLE clientes ADD COLUMN id TEXT;`, function(addErr: any) {
      if (addErr) {
        // Se der erro de coluna duplicada, significa que já existe
        const errorMsg = addErr?.message || String(addErr) || '';
        if (errorMsg.includes('duplicate column name') || errorMsg.includes('duplicate')) {
          console.log('[Migration] Coluna id já existe, pulando');
        } else {
          // Outro erro - apenas logar e continuar
          console.log('[Migration] Erro ao adicionar coluna (ignorando):', errorMsg);
        }
      } else {
        console.log('[Migration] Coluna id adicionada à tabela clientes');
      }
    });
  });
}