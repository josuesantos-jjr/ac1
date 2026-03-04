#!/usr/bin/env node

/**
 * Script simples em JavaScript para criar tabelas SQLite
 * Evita problemas de módulos ES/TypeScript
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Schema das tabelas
const SCHEMA = `
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
  client_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Ativo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cliente TEXT,
  ai_selected TEXT,
  target_chat_id TEXT,
  gemini_key TEXT,
  groq_key TEXT
);

-- Configurações específicas do cliente
CREATE TABLE IF NOT EXISTS clientes_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  config_type TEXT NOT NULL,
  config_key TEXT NOT NULL,
  config_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id),
  UNIQUE(client_id, config_type, config_key)
);

-- Contatos dos clientes
CREATE TABLE IF NOT EXISTS contatos (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  nome TEXT,
  telefone TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- Leads qualificados
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  contato_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  nome TEXT,
  telefone TEXT,
  origem TEXT,
  tags TEXT,
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

-- Dados agregados dos chats
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  name TEXT,
  telefone TEXT,
  tags TEXT,
  lista_nome TEXT,
  lead TEXT,
  interesse TEXT,
  lead_score REAL,
  etapa_funil TEXT,
  is_lead_qualificado BOOLEAN,
  detalhes_agendamento TEXT,
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
  chat_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  message_type TEXT,
  message_content TEXT,
  message_date TEXT,
  message_time TEXT,
  message_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- Buffer de mensagens não respondidas
CREATE TABLE IF NOT EXISTS message_buffer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  messages TEXT,
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
  metric_type TEXT NOT NULL,
  metric_value REAL,
  date_recorded DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- Sistema de backups
CREATE TABLE IF NOT EXISTS backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT,
  backup_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  checksum TEXT,
  status TEXT DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- Logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- Controle de permissões
CREATE TABLE IF NOT EXISTS user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  client_id TEXT,
  permission_level TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  granted_by TEXT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (client_id) REFERENCES clientes(client_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_client_id ON clientes(client_id);
CREATE INDEX IF NOT EXISTS idx_contatos_client_id ON contatos(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_chats_client_id ON chats(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads(client_id, tags);
CREATE INDEX IF NOT EXISTS idx_chats_tags ON chats(client_id, tags);
CREATE INDEX IF NOT EXISTS idx_messages_chat_date ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(client_id, lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(client_id, precisa_atendimento_humano);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_timestamp ON audit_logs(client_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_statistics_client_date ON statistics(client_id, date_recorded);
`;

async function createTables() {
  try {
    console.log('🚀 Criando tabelas SQLite...\n');

    // Criar diretório se não existir
    const dbDir = path.dirname('./database.db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Conectar ao banco
    const db = new Database('./database.db');

    // Configurações de performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000000');
    db.pragma('temp_store = memory');

    // Criar tabelas
    db.exec(SCHEMA);

    // Verificar integridade
    const integrityCheck = db.prepare('PRAGMA integrity_check').all();
    const isOk = integrityCheck.length === 1 && integrityCheck[0].integrity_check === 'ok';

    if (isOk) {
      console.log('✅ Tabelas criadas com sucesso!');
    } else {
      console.log('⚠️  Tabelas criadas, mas há problemas de integridade');
    }

    // Estatísticas
    const stats = {
      pageCount: db.pragma('page_count', { simple: true }),
      pageSize: db.pragma('page_size', { simple: true }),
      freelistCount: db.pragma('freelist_count', { simple: true }),
      tableCount: db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get().count
    };

    console.log('\n📊 Estatísticas do banco:');
    console.log(`   📄 Tabelas: ${stats.tableCount}`);
    console.log(`   💾 Tamanho página: ${stats.pageSize} bytes`);
    console.log(`   📈 Páginas: ${stats.pageCount}`);
    console.log(`   🆓 Páginas livres: ${stats.freelistCount}`);

    // Fechar conexão
    db.close();

    console.log('\n🎉 Banco SQLite configurado com sucesso!');
    console.log('💡 Arquivo criado: ./database.db');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createTables();
}

module.exports = { createTables };