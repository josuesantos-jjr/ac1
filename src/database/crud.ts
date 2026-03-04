// @ts-nocheck - Desativando verificações de tipo para contornar problemas com bun:sqlite
import { getDatabase } from './database.ts';

/**
 * Interfaces para tipagem dos dados
 */
export interface Cliente {
  id?: number;
  client_id: string;
  name: string;
  status: string;
  folder_type?: string | null; // Agora opcional - não usamos mais subpastas
  cliente?: string;
  codigo?: string; // código fixo do cliente
  ai_selected?: string;
  target_chat_id?: string;
  gemini_key?: string;
  groq_key?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contato {
  id: string;
  client_id: string;
  nome?: string;
  telefone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Chat {
  id?: number;
  chat_id: string;
  client_id: string;
  name?: string;
  telefone?: string;
  tags?: string;
  lista_nome?: string;
  lead?: string;
  interesse?: string;
  lead_score?: number;
  etapa_funil?: string;
  is_lead_qualificado?: boolean;
  detalhes_agendamento?: string;
  resumo_para_atendente?: string;
  precisa_atendimento_humano?: boolean;
  data_ultima_mensagem_recebida?: string;
  data_ultima_mensagem_enviada?: string;
  data_ultima_analise?: string;
  ultima_notificacao_atendimento_humano?: string;
  created_at?: string;
  updated_at?: string;
}

// Export alias para compatibilidade
export type { Chat as ChatInterface };

export interface Lead {
  id: string;
  client_id: string;
  contato_id: string;
  chat_id: string;
  nome?: string;
  telefone?: string;
  origem?: string;
  tags?: string;
  tipo_lead?: string;
  lead_score?: number;
  etapa_funil?: string;
  resumo_para_atendente?: string;
  timestamp_identificacao?: string;
  data_geracao_lead?: string;
  data_notificacao_lead?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id?: number;
  chat_id: string;
  client_id: string;
  message_type: string;
  message_content?: string;
  message_date?: string;
  message_time?: string;
  message_data?: string;
  created_at?: string;
}

/**
 * Classe de operações CRUD para Clientes
 */
export class ClienteCRUD {
  private db = getDatabase();

  /**
   * Busca cliente por client_id
   */
  getByClientId(clientId: string): Cliente | null {
    const stmt = this.db.prepare('SELECT * FROM clientes WHERE client_id = ?');
    return stmt.get(clientId) as Cliente | null;
  }

  /**
   * Busca todos os clientes ativos
   */
  getActiveClients(): Cliente[] {
    const stmt = this.db.prepare('SELECT * FROM clientes WHERE status = ? ORDER BY created_at DESC');
    return stmt.all('Ativo') as Cliente[];
  }

  /**
   * Cria ou atualiza cliente
   */
  upsert(cliente: Cliente): Cliente {
    const existing = this.getByClientId(cliente.client_id);

    if (existing) {
      // Update
      const stmt = this.db.prepare(`
        UPDATE clientes SET
          name = ?, status = ?, folder_type = ?, cliente = ?, codigo = ?, ai_selected = ?,
          target_chat_id = ?, gemini_key = ?, groq_key = ?, updated_at = CURRENT_TIMESTAMP
        WHERE client_id = ?
      `);
      stmt.run(
        cliente.name,
        cliente.status,
        cliente.folder_type,
        cliente.cliente,
        cliente.codigo,
        cliente.ai_selected,
        cliente.target_chat_id,
        cliente.gemini_key,
        cliente.groq_key,
        cliente.client_id
      );
      return { ...existing, ...cliente };
    } else {
      // Insert
      const stmt = this.db.prepare(`
        INSERT INTO clientes (client_id, name, status, folder_type, cliente, codigo, ai_selected, target_chat_id, gemini_key, groq_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        cliente.client_id,
        cliente.name,
        cliente.status,
        cliente.folder_type,
        cliente.cliente,
        cliente.codigo,
        cliente.ai_selected,
        cliente.target_chat_id,
        cliente.gemini_key,
        cliente.groq_key
      );
      return { ...cliente, id: result.lastInsertRowId as number };
    }
  }

  /**
   * Busca todos os clientes
   */
  getAllClientes(): Cliente[] {
    const stmt = this.db.prepare('SELECT * FROM clientes ORDER BY created_at DESC');
    return stmt.all() as Cliente[];
  }

  /**
   * Atualiza status do cliente
   */
  updateStatus(clientId: string, status: string): boolean {
    const stmt = this.db.prepare('UPDATE clientes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?');
    const result = stmt.run(status, clientId);
    return result.changes > 0;
  }
}

/**
 * Classe de operações CRUD para Contatos
 */
export class ContatoCRUD {
  private db = getDatabase();

  /**
   * Busca contatos por cliente
   */
  getByClientId(clientId: string): Contato[] {
    const stmt = this.db.prepare('SELECT * FROM contatos WHERE client_id = ?');
    return stmt.all(clientId) as Contato[];
  }

  /**
   * Busca contato por telefone
   */
  getByTelefone(telefone: string): Contato | null {
    const stmt = this.db.prepare('SELECT * FROM contatos WHERE telefone = ?');
    return stmt.get(telefone) as Contato | null;
  }

  /**
   * Cria ou atualiza contato
   */
  upsert(contato: Contato): Contato {
    const existing = this.getByTelefone(contato.telefone!);

    if (existing) {
      // Update
      const stmt = this.db.prepare(`
        UPDATE contatos SET nome = ?, updated_at = CURRENT_TIMESTAMP
        WHERE telefone = ?
      `);
      stmt.run(contato.nome, contato.telefone);
      return { ...existing, ...contato };
    } else {
      // Insert
      const stmt = this.db.prepare(`
        INSERT INTO contatos (id, client_id, nome, telefone)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(contato.id, contato.client_id, contato.nome, contato.telefone);
      return contato;
    }
  }

  /**
   * Remove contato
   */
  delete(telefone: string): boolean {
    const stmt = this.db.prepare('DELETE FROM contatos WHERE telefone = ?');
    const result = stmt.run(telefone);
    return result.changes > 0;
  }
}

/**
 * Classe de operações CRUD para Chats
 */
export class ChatCRUD {
  private db = getDatabase();

  /**
   * Busca chat por chat_id
   */
  getByChatId(chatId: string): Chat | null {
    const stmt = this.db.prepare('SELECT * FROM chats WHERE chat_id = ?');
    return stmt.get(chatId) as Chat | null;
  }

  /**
   * Busca chats por cliente
   */
  getByClientId(clientId: string): Chat[] {
    const stmt = this.db.prepare('SELECT * FROM chats WHERE client_id = ? ORDER BY data_ultima_mensagem_recebida DESC');
    return stmt.all(clientId) as Chat[];
  }

  /**
   * Busca chats que precisam atendimento humano
   */
  getChatsNeedingAttention(clientId: string): Chat[] {
    const stmt = this.db.prepare('SELECT * FROM chats WHERE client_id = ? AND precisa_atendimento_humano = 1');
    return stmt.all(clientId) as Chat[];
  }

  /**
   * Cria ou atualiza chat
   */
  upsert(chat: Chat): Chat {
    const existing = this.getByChatId(chat.chat_id);

    if (existing) {
      // Update
      const stmt = this.db.prepare(`
        UPDATE chats SET
          name = ?, telefone = ?, tags = ?, lista_nome = ?, lead = ?, interesse = ?,
          lead_score = ?, etapa_funil = ?, is_lead_qualificado = ?, detalhes_agendamento = ?,
          resumo_para_atendente = ?, precisa_atendimento_humano = ?,
          data_ultima_mensagem_recebida = ?, data_ultima_mensagem_enviada = ?,
          data_ultima_analise = ?, ultima_notificacao_atendimento_humano = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE chat_id = ?
      `);
      stmt.run(
        chat.name,
        chat.telefone,
        chat.tags,
        chat.lista_nome,
        chat.lead,
        chat.interesse,
        chat.lead_score,
        chat.etapa_funil,
        chat.is_lead_qualificado,
        chat.detalhes_agendamento,
        chat.resumo_para_atendente,
        chat.precisa_atendimento_humano,
        chat.data_ultima_mensagem_recebida,
        chat.data_ultima_mensagem_enviada,
        chat.data_ultima_analise,
        chat.ultima_notificacao_atendimento_humano,
        chat.chat_id
      );
      return { ...existing, ...chat };
    } else {
      // Insert
      const stmt = this.db.prepare(`
        INSERT INTO chats (chat_id, client_id, name, telefone, tags, lista_nome, lead, interesse,
                          lead_score, etapa_funil, is_lead_qualificado, detalhes_agendamento,
                          resumo_para_atendente, precisa_atendimento_humano,
                          data_ultima_mensagem_recebida, data_ultima_mensagem_enviada,
                          data_ultima_analise, ultima_notificacao_atendimento_humano)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        chat.chat_id,
        chat.client_id,
        chat.name,
        chat.telefone,
        chat.tags,
        chat.lista_nome,
        chat.lead,
        chat.interesse,
        chat.lead_score,
        chat.etapa_funil,
        chat.is_lead_qualificado,
        chat.detalhes_agendamento,
        chat.resumo_para_atendente,
        chat.precisa_atendimento_humano,
        chat.data_ultima_mensagem_recebida,
        chat.data_ultima_mensagem_enviada,
        chat.data_ultima_analise,
        chat.ultima_notificacao_atendimento_humano
      );
      return { ...chat, id: result.lastInsertRowId as number };
    }
  }
}

/**
 * Classe de operações CRUD para Leads
 */
export class LeadCRUD {
  private db = getDatabase();

  /**
   * Busca leads por cliente
   */
  getByClientId(clientId: string): Lead[] {
    const stmt = this.db.prepare('SELECT * FROM leads WHERE client_id = ? ORDER BY lead_score DESC, created_at DESC');
    return stmt.all(clientId) as Lead[];
  }

  /**
   * Busca leads qualificados
   */
  getQualifiedLeads(clientId: string): Lead[] {
    const stmt = this.db.prepare('SELECT * FROM leads WHERE client_id = ? AND is_lead_qualificado = 1 ORDER BY lead_score DESC');
    return stmt.all(clientId) as Lead[];
  }

  /**
   * Busca leads por tag
   */
  getLeadsByTag(clientId: string, tag: string): Lead[] {
    const stmt = this.db.prepare('SELECT * FROM leads WHERE client_id = ? AND tags LIKE ?');
    return stmt.all(clientId, `%${tag}%`) as Lead[];
  }

  /**
   * Cria ou atualiza lead
   */
  upsert(lead: Lead): Lead {
    const existing = this.getById(lead.id);

    if (existing) {
      // Update
      const stmt = this.db.prepare(`
        UPDATE leads SET
          nome = ?, telefone = ?, origem = ?, tags = ?, tipo_lead = ?, lead_score = ?,
          etapa_funil = ?, resumo_para_atendente = ?, timestamp_identificacao = ?,
          data_geracao_lead = ?, data_notificacao_lead = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(
        lead.nome,
        lead.telefone,
        lead.origem,
        lead.tags,
        lead.tipo_lead,
        lead.lead_score,
        lead.etapa_funil,
        lead.resumo_para_atendente,
        lead.timestamp_identificacao,
        lead.data_geracao_lead,
        lead.data_notificacao_lead,
        lead.id
      );
      return { ...existing, ...lead };
    } else {
      // Insert
      const stmt = this.db.prepare(`
        INSERT INTO leads (id, client_id, contato_id, chat_id, nome, telefone, origem, tags,
                          tipo_lead, lead_score, etapa_funil, resumo_para_atendente,
                          timestamp_identificacao, data_geracao_lead, data_notificacao_lead)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        lead.id,
        lead.client_id,
        lead.contato_id,
        lead.chat_id,
        lead.nome,
        lead.telefone,
        lead.origem,
        lead.tags,
        lead.tipo_lead,
        lead.lead_score,
        lead.etapa_funil,
        lead.resumo_para_atendente,
        lead.timestamp_identificacao,
        lead.data_geracao_lead,
        lead.data_notificacao_lead
      );
      return lead;
    }
  }

  /**
   * Busca lead por ID
   */
  private getById(id: string): Lead | null {
    const stmt = this.db.prepare('SELECT * FROM leads WHERE id = ?');
    return stmt.get(id) as Lead | null;
  }
}

/**
 * Classe de operações CRUD para Mensagens
 */
export class MessageCRUD {
  private db = getDatabase();

  /**
   * Busca mensagens por chat
   */
  getByChatId(chatId: string): Message[] {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC');
    return stmt.all(chatId) as Message[];
  }

  /**
   * Busca últimas N mensagens de um chat
   */
  getLastMessages(chatId: string, limit: number = 50): Message[] {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?');
    return stmt.all(chatId, limit).reverse() as Message[];
  }

  /**
   * Adiciona mensagem
   */
  insert(message: Message): Message {
    const stmt = this.db.prepare(`
      INSERT INTO messages (chat_id, client_id, message_type, message_content, message_date, message_time, message_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      message.chat_id,
      message.client_id,
      message.message_type,
      message.message_content,
      message.message_date,
      message.message_time,
      message.message_data
    );
    return { ...message, id: result.lastInsertRowId as number };
  }

  /**
   * Remove mensagens de um chat (útil para limpeza)
   */
  deleteByChatId(chatId: string): number {
    const stmt = this.db.prepare('DELETE FROM messages WHERE chat_id = ?');
    const result = stmt.run(chatId);
    return result.changes;
  }
}

// Instâncias singleton das classes CRUD
export const clienteCRUD = new ClienteCRUD();
export const contatoCRUD = new ContatoCRUD();
export const chatCRUD = new ChatCRUD();
export const leadCRUD = new LeadCRUD();
export const messageCRUD = new MessageCRUD();