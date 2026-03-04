import { getDatabase } from './database.ts';

/**
 * Consultas SQL avançadas e otimizadas para o sistema CRM
 * Todas as queries incluem isolamento por client_id
 */
export class QueryManager {
  private db = getDatabase();

  /**
   * Busca clientes ativos com estatísticas
   */
  getActiveClientsWithStats(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT
          c.*,
          COUNT(DISTINCT ct.id) as total_contatos,
          COUNT(DISTINCT l.id) as total_leads,
          COUNT(DISTINCT ch.chat_id) as total_chats,
          COUNT(DISTINCT m.id) as total_mensagens
        FROM clientes c
        LEFT JOIN contatos ct ON c.client_id = ct.client_id
        LEFT JOIN leads l ON c.client_id = l.client_id
        LEFT JOIN chats ch ON c.client_id = ch.client_id
        LEFT JOIN messages m ON c.client_id = m.client_id
        WHERE c.status = 'Ativo'
        GROUP BY c.client_id
        ORDER BY c.created_at DESC
      `);
      stmt.all((err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Busca leads por tags múltiplas
   */
  getLeadsByTags(clientId: string, tags: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const tagConditions = tags.map(() => 'tags LIKE ?').join(' AND ');
      const params = tags.map(tag => `%${tag}%`);
      params.unshift(clientId);

      const stmt = this.db.prepare(`
        SELECT * FROM leads
        WHERE client_id = ? AND (${tagConditions})
        ORDER BY lead_score DESC, created_at DESC
      `);
      stmt.all(params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Busca chats que precisam atendimento humano
   */
  getChatsNeedingAttention(clientId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT
          ch.*,
          ct.nome as contato_nome,
          l.lead_score,
          l.etapa_funil
        FROM chats ch
        LEFT JOIN contatos ct ON ch.chat_id LIKE '%' || ct.id || '%' AND ch.client_id = ct.client_id
        LEFT JOIN leads l ON ch.chat_id = l.chat_id AND ch.client_id = l.client_id
        WHERE ch.client_id = ? AND ch.precisa_atendimento_humano = 1
        ORDER BY ch.data_ultima_mensagem_recebida DESC
      `);
      stmt.all(clientId, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Dashboard: Conversão por período
   */
  getConversionStats(clientId: string, days: number = 30): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT
          DATE(created_at) as data,
          COUNT(*) as novos_leads,
          SUM(CASE WHEN is_lead_qualificado = 1 THEN 1 ELSE 0 END) as leads_qualificados,
          ROUND(
            AVG(CASE WHEN lead_score > 0 THEN lead_score ELSE NULL END), 2
          ) as score_medio
        FROM leads
        WHERE client_id = ? AND created_at >= datetime('now', '-${days} days')
        GROUP BY DATE(created_at)
        ORDER BY data DESC
      `);
      stmt.all(clientId, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Relatório de mensagens por tipo
   */
  getMessageStats(clientId: string, days: number = 7): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT
          message_type,
          COUNT(*) as quantidade,
          COUNT(DISTINCT chat_id) as chats_unicos,
          MIN(created_at) as primeira_mensagem,
          MAX(created_at) as ultima_mensagem
        FROM messages
        WHERE client_id = ? AND created_at >= datetime('now', '-${days} days')
        GROUP BY message_type
        ORDER BY quantidade DESC
      `);
      stmt.all(clientId, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Busca leads qualificados com informações completas
   */
  getQualifiedLeadsFullInfo(clientId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT
          l.*,
          ct.nome as contato_nome,
          ch.name as chat_nome,
          ch.tags as chat_tags,
          ch.resumo_para_atendente,
          COUNT(m.id) as total_mensagens_chat
        FROM leads l
        LEFT JOIN contatos ct ON l.contato_id = ct.id AND l.client_id = ct.client_id
        LEFT JOIN chats ch ON l.chat_id = ch.chat_id AND l.client_id = ch.client_id
        LEFT JOIN messages m ON ch.chat_id = m.chat_id AND ch.client_id = m.client_id
        WHERE l.client_id = ? AND l.is_lead_qualificado = 1
        GROUP BY l.id, ct.nome, ch.name, ch.tags, ch.resumo_para_atendente
        ORDER BY l.lead_score DESC, l.created_at DESC
      `);
      stmt.all(clientId, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Análise de performance por cliente
   */
  getClientPerformance(clientId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT
          c.name as cliente_nome,
          c.status,
          COUNT(DISTINCT ct.id) as contatos_ativos,
          COUNT(DISTINCT l.id) as leads_totais,
          COUNT(DISTINCT CASE WHEN l.is_lead_qualificado = 1 THEN l.id END) as leads_qualificados,
          COUNT(DISTINCT ch.chat_id) as conversas_totais,
          COUNT(DISTINCT CASE WHEN ch.precisa_atendimento_humano = 1 THEN ch.chat_id END) as conversas_pendentes,
          AVG(l.lead_score) as score_medio_leads,
          COUNT(m.id) as mensagens_totais,
          MAX(ch.data_ultima_mensagem_recebida) as ultima_atividade
        FROM clientes c
        LEFT JOIN contatos ct ON c.client_id = ct.client_id
        LEFT JOIN leads l ON c.client_id = l.client_id
        LEFT JOIN chats ch ON c.client_id = ch.client_id
        LEFT JOIN messages m ON c.client_id = m.client_id
        WHERE c.client_id = ?
        GROUP BY c.client_id, c.name, c.status
      `);
      stmt.get(clientId, (err, row: any) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Busca avançada com filtros múltiplos
   */
  searchAdvanced(clientId: string, filters: {
    tags?: string[];
    status?: string;
    scoreMin?: number;
    scoreMax?: number;
    dataInicio?: string;
    dataFim?: string;
    telefone?: string;
    nome?: string;
  }): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let whereConditions = ['l.client_id = ?'];
      let params: any[] = [clientId];

      if (filters.tags && filters.tags.length > 0) {
        const tagConditions = filters.tags.map(() => 'l.tags LIKE ?').join(' AND ');
        whereConditions.push(`(${tagConditions})`);
        params.push(...filters.tags.map(tag => `%${tag}%`));
      }

      if (filters.status) {
        whereConditions.push('l.etapa_funil = ?');
        params.push(filters.status);
      }

      if (filters.scoreMin !== undefined) {
        whereConditions.push('l.lead_score >= ?');
        params.push(filters.scoreMin);
      }

      if (filters.scoreMax !== undefined) {
        whereConditions.push('l.lead_score <= ?');
        params.push(filters.scoreMax);
      }

      if (filters.dataInicio) {
        whereConditions.push('l.created_at >= ?');
        params.push(filters.dataInicio);
      }

      if (filters.dataFim) {
        whereConditions.push('l.created_at <= ?');
        params.push(filters.dataFim);
      }

      if (filters.telefone) {
        whereConditions.push('l.telefone LIKE ?');
        params.push(`%${filters.telefone}%`);
      }

      if (filters.nome) {
        whereConditions.push('l.nome LIKE ?');
        params.push(`%${filters.nome}%`);
      }

      const whereClause = whereConditions.join(' AND ');

      const stmt = this.db.prepare(`
        SELECT
          l.*,
          ct.nome as contato_nome,
          ch.resumo_para_atendente
        FROM leads l
        LEFT JOIN contatos ct ON l.contato_id = ct.id AND l.client_id = ct.client_id
        LEFT JOIN chats ch ON l.chat_id = ch.chat_id AND l.client_id = ch.client_id
        WHERE ${whereClause}
        ORDER BY l.lead_score DESC, l.created_at DESC
      `);

      stmt.all(params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Estatísticas de engajamento por período
   */
  getEngagementStats(clientId: string, periodDays: number = 30): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT
          DATE(m.created_at) as data,
          COUNT(DISTINCT m.chat_id) as chats_ativos,
          COUNT(CASE WHEN m.message_type = 'User' THEN 1 END) as mensagens_usuario,
          COUNT(CASE WHEN m.message_type = 'Bot' THEN 1 END) as mensagens_bot,
          AVG(CASE WHEN l.lead_score IS NOT NULL THEN l.lead_score END) as score_medio_leads
        FROM messages m
        LEFT JOIN leads l ON m.chat_id = l.chat_id AND m.client_id = l.client_id
        WHERE m.client_id = ? AND m.created_at >= datetime('now', '-${periodDays} days')
        GROUP BY DATE(m.created_at)
        ORDER BY data DESC
      `);
      stmt.all(clientId, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Top leads por score
   */
  getTopLeads(clientId: string, limit: number = 10): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT
          l.*,
          ct.nome as contato_nome,
          ch.resumo_para_atendente,
          COUNT(m.id) as interacoes
        FROM leads l
        LEFT JOIN contatos ct ON l.contato_id = ct.id AND l.client_id = ct.client_id
        LEFT JOIN chats ch ON l.chat_id = ch.chat_id AND l.client_id = ch.client_id
        LEFT JOIN messages m ON ch.chat_id = m.chat_id AND ch.client_id = m.client_id
        WHERE l.client_id = ? AND l.is_lead_qualificado = 1
        GROUP BY l.id, ct.nome, ch.resumo_para_atendente
        ORDER BY l.lead_score DESC, interacoes DESC
        LIMIT ?
      `);
      stmt.all([clientId, limit], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Conversas inativas (sem resposta há muito tempo)
   */
  getInactiveConversations(clientId: string, daysInactive: number = 7): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT
          ch.*,
          ct.nome as contato_nome,
          l.etapa_funil,
          l.lead_score,
          strftime('%s', 'now') - strftime('%s', ch.data_ultima_mensagem_recebida) as segundos_inativo
        FROM chats ch
        LEFT JOIN contatos ct ON ch.chat_id LIKE '%' || ct.id || '%' AND ch.client_id = ct.client_id
        LEFT JOIN leads l ON ch.chat_id = l.chat_id AND ch.client_id = l.client_id
        WHERE ch.client_id = ?
          AND ch.data_ultima_mensagem_recebida < datetime('now', '-${daysInactive} days')
          AND ch.precisa_atendimento_humano = 0
        ORDER BY ch.data_ultima_mensagem_recebida DESC
      `);
      stmt.all(clientId, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

// Instância singleton
export const queryManager = new QueryManager();