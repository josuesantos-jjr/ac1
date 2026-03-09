import fs from 'fs';
import path from 'path';
import { getDatabase } from './database.ts';
import { clienteCRUD, contatoCRUD, chatCRUD, leadCRUD, messageCRUD } from './crud.ts';
import type { Cliente, Contato, Chat, Lead, Message } from './crud.ts';

/**
 * Sistema de sincronização bidirecional JSON ↔ SQLite
 * Mantém consistência entre os dois sistemas durante transição
 */
export class SyncManager {
  private db = getDatabase();

  /**
   * Feature flags para controle da sincronização
   */
  private features = {
    sqlite_read: process.env.SQLITE_READ === 'true',
    sqlite_write: process.env.SQLITE_WRITE === 'true',
    json_fallback: process.env.JSON_FALLBACK !== 'false',
    sync_enabled: process.env.SYNC_ENABLED === 'true'
  };

  // Lista de pastas de sistema que não devem ir na pasta clientes/
  private systemFolders = ['system-cache', 'monitoring'];

  /**
   * Detecta se um clientId é de sistema
   */
  private isSystemFolder(clientId: string): boolean {
    return this.systemFolders.includes(clientId);
  }

  /**
   * Obtém o caminho correto para um cliente
   */
  private getClientPath(clientId: string): string {
    // Se clientId já contém o caminho completo, extrair apenas o nome
    let cleanClientId = clientId;
    
    // Se contém separadores de caminho, extrair apenas a última parte (nome da pasta)
    if (clientId.includes('/') || clientId.includes('\\')) {
      const pathParts = clientId.split(/[\\/]/);
      cleanClientId = pathParts[pathParts.length - 1];
    }
    
    if (this.isSystemFolder(cleanClientId)) {
      return path.join(process.cwd(), cleanClientId);
    } else {
      return path.join(process.cwd(), 'clientes', cleanClientId);
    }
  }

  constructor() {
    console.log('🔄 SyncManager inicializado com features:', this.features);
  }

  /**
   * Salva dados do cliente com sincronização bidirecional
   */
  async saveClientData(clientId: string, data: any): Promise<void> {
    try {
      // 1. Sempre tenta salvar no SQLite se write estiver habilitado
      if (this.features.sqlite_write) {
        await this.saveToSQLite(clientId, data);
      }

      // 2. Sempre salva no JSON como backup/fallback
      if (this.features.json_fallback) {
        await this.saveToJSON(clientId, data);
      }

      console.log(`✅ Dados salvos para cliente ${clientId}`);

    } catch (error) {
      console.error(`❌ Erro ao salvar dados do cliente ${clientId}:`, error);

      // Fallback: tenta salvar apenas no JSON se tudo falhar
      if (this.features.json_fallback) {
        try {
          await this.saveToJSON(clientId, data);
          console.log(`🔄 Fallback: dados salvos apenas no JSON para ${clientId}`);
        } catch (fallbackError) {
          console.error(`💀 Fallback também falhou para ${clientId}:`, fallbackError);
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  /**
   * Carrega dados do cliente com fallback
   */
  async loadClientData(clientId: string): Promise<any> {
    try {
      // 1. Tenta carregar do SQLite se read estiver habilitado
      if (this.features.sqlite_read) {
        const sqliteData = await this.loadFromSQLite(clientId);
        if (sqliteData) {
          console.log(`📖 Dados carregados do SQLite para ${clientId}`);
          return sqliteData;
        }
      }

      // 2. Fallback: carrega do JSON
      if (this.features.json_fallback) {
        const jsonData = await this.loadFromJSON(clientId);
        if (jsonData) {
          console.log(`📖 Fallback: dados carregados do JSON para ${clientId}`);
          return jsonData;
        }
      }

      console.warn(`⚠️ Nenhum dado encontrado para cliente ${clientId}`);
      return null;

    } catch (error) {
      console.error(`❌ Erro ao carregar dados do cliente ${clientId}:`, error);

      // Último fallback: tentar JSON
      if (this.features.json_fallback) {
        try {
          const jsonData = await this.loadFromJSON(clientId);
          console.log(`🔄 Último fallback: dados do JSON para ${clientId}`);
          return jsonData;
        } catch (fallbackError) {
          console.error(`💀 Todos os fallbacks falharam para ${clientId}`);
        }
      }

      return null;
    }
  }

  /**
   * Salva dados no SQLite
   */
  private async saveToSQLite(clientId: string, data: any): Promise<void> {
    // Pula salvamento no SQLite para pastas de sistema
    if (this.isSystemFolder(clientId)) {
      console.log(`⏭️ Pulando salvamento SQLite para pasta de sistema: ${clientId}`);
      return;
    }

    // Inicia transação para garantir consistência
    await this.db.transaction(async () => {
      // 1. Salvar/atualizar cliente
      if (data.infoCliente) {
        const cliente: Cliente = {
          client_id: clientId,
          name: data.infoCliente.CLIENTE,
          status: data.infoCliente.STATUS || 'ativo', // Padronizar para minúsculo
          folder_type: undefined, // Removido - não usamos mais subpastas
          cliente: data.infoCliente.CLIENTE,
          ai_selected: data.infoCliente.AI_SELECTED,
          target_chat_id: data.infoCliente.TARGET_CHAT_ID,
          gemini_key: data.infoCliente.GEMINI_KEY,
          groq_key: data.infoCliente.GROQ_KEY,
          codigo: data.infoCliente.codigo || clientId // código fixo
        };
        clienteCRUD.upsert(cliente);
      }

      // 2. Salvar contatos
      if (data.contatos) {
        for (const [telefone, nome] of Object.entries(data.contatos)) {
          const contato: Contato = {
            id: telefone,
            client_id: clientId,
            nome: nome as string,
            telefone: telefone
          };
          contatoCRUD.upsert(contato);
        }
      }

      // 3. Salvar leads
      if (data.leads) {
        for (const [leadId, leadData] of Object.entries(data.leads)) {
          const lead = leadData as any;
          const leadObj: Lead = {
            id: leadId,
            client_id: clientId,
            contato_id: lead.contato_id || leadId,
            chat_id: lead.chat_id || '',
            nome: lead.nome,
            telefone: lead.telefone,
            origem: lead.origem,
            tags: JSON.stringify(lead.tags || []),
            tipo_lead: lead.tipo_lead,
            lead_score: lead.lead_score,
            etapa_funil: lead.etapa_funil,
            resumo_para_atendente: lead.resumo_para_atendente,
            timestamp_identificacao: lead.timestamp_identificacao,
            data_geracao_lead: lead.data_geracao_lead,
            data_notificacao_lead: lead.data_notificacao_lead
          };
          leadCRUD.upsert(leadObj);
        }
      }

      // 4. Salvar chats e mensagens
      if (data.chats) {
        for (const [chatId, chatData] of Object.entries(data.chats)) {
          const chat = chatData as any;

          // Salvar chat
          const chatObj: Chat = {
            chat_id: chatId,
            client_id: clientId,
            name: chat.name,
            telefone: chat.telefone,
            tags: JSON.stringify(chat.tags || []),
            lista_nome: chat.listaNome,
            lead: chat.lead,
            interesse: chat.interesse,
            lead_score: chat.leadScore,
            etapa_funil: chat.etapaFunil,
            is_lead_qualificado: chat.isLeadQualificado,
            detalhes_agendamento: JSON.stringify(chat.detalhes_agendamento || []),
            resumo_para_atendente: chat.resumoParaAtendente,
            precisa_atendimento_humano: chat.precisaAtendimentoHumano,
            data_ultima_mensagem_recebida: chat.data_ultima_mensagem_recebida,
            data_ultima_mensagem_enviada: chat.data_ultima_mensagem_enviada,
            data_ultima_analise: chat.data_ultima_analise,
            ultima_notificacao_atendimento_humano: chat.ultima_notificacao_atendimento_humano
          };
          chatCRUD.upsert(chatObj);

          // Salvar mensagens se existirem
          if (chat.messages) {
            for (const messageData of chat.messages) {
              const message: Message = {
                chat_id: chatId,
                client_id: clientId,
                message_type: messageData.type,
                message_content: messageData.message,
                message_date: messageData.date,
                message_time: messageData.time,
                message_data: JSON.stringify(messageData)
              };
              messageCRUD.insert(message);
            }
          }
        }
      }
    });
  }

  /**
   * Salva dados no JSON
   */
  private async saveToJSON(clientId: string, data: any): Promise<void> {
    // clientId agora é apenas o nome do cliente (ex: "CMW", "system-cache")
    if (!clientId) {
      throw new Error(`Invalid clientId format: "${clientId}". Expected simple client name`);
    }

    // Usar caminho correto baseado no tipo de cliente
    const clientPath = this.getClientPath(clientId);
    const configPath = path.join(clientPath, 'config');

    // SEGURANÇA: Verificar se o cliente existe antes de criar pastas
    // Isso evita criar pastas inválidas quando um nome de exibição (CLIENTE) é passado
    const infoClientePath = path.join(clientPath, 'config', 'infoCliente.json');
    if (!fs.existsSync(infoClientePath)) {
      console.log(`[SyncManager] Cliente ${clientId} não existe (infoCliente.json não encontrado), pulando salvamento`);
      return;
    }

    fs.mkdirSync(configPath, { recursive: true });

    // Salvar infoCliente.json
    if (data.infoCliente) {
      const infoClientePath = path.join(configPath, 'infoCliente.json');
      fs.writeFileSync(infoClientePath, JSON.stringify(data.infoCliente, null, 2));
    }

    // Salvar contatos.json
    if (data.contatos) {
      const contatosPath = path.join(configPath, 'contatos.json');
      fs.writeFileSync(contatosPath, JSON.stringify(data.contatos, null, 2));
    }

    // Salvar leads.json
    if (data.leads) {
      const leadsPath = path.join(configPath, 'leads.json');
      fs.writeFileSync(leadsPath, JSON.stringify(data.leads, null, 2));
    }

    // Salvar dados específicos do sistema
    if (data.smartCache) {
      const smartCachePath = path.join(configPath, 'smartCache.json');
      fs.writeFileSync(smartCachePath, JSON.stringify(data.smartCache, null, 2));
    }

    if (data.monitoringAlerts) {
      const monitoringPath = path.join(configPath, 'monitoringAlerts.json');
      fs.writeFileSync(monitoringPath, JSON.stringify(data.monitoringAlerts, null, 2));
    }

    // Salvar chats apenas para clientes normais (não para sistema)
    if (data.chats && !this.isSystemFolder(clientId)) {
      const chatsPath = path.join(clientPath, 'Chats', 'Historico');
      fs.mkdirSync(chatsPath, { recursive: true });

      for (const [chatId, chatData] of Object.entries(data.chats)) {
        const chat = chatData as any;

        // Salvar Dados.json
        const dadosPath = path.join(chatsPath, chatId, 'Dados.json');
        fs.mkdirSync(path.dirname(dadosPath), { recursive: true });

        const dadosData = {
          name: chat.name,
          telefone: chat.telefone,
          tags: JSON.parse(chat.tags || '[]'),
          listaNome: chat.lista_nome,
          lead: chat.lead,
          interesse: chat.interesse,
          leadScore: chat.lead_score,
          etapaFunil: chat.etapa_funil,
          isLeadQualificado: chat.is_lead_qualificado,
          detalhes_agendamento: JSON.parse(chat.detalhes_agendamento || '[]'),
          resumoParaAtendente: chat.resumo_para_atendente,
          precisaAtendimentoHumano: chat.precisa_atendimento_humano,
          data_ultima_mensagem_recebida: chat.data_ultima_mensagem_recebida,
          data_ultima_mensagem_enviada: chat.data_ultima_mensagem_enviada,
          data_ultima_analise: chat.data_ultima_analise,
          ultima_notificacao_atendimento_humano: chat.ultima_notificacao_atendimento_humano
        };

        fs.writeFileSync(dadosPath, JSON.stringify(dadosData, null, 2));

        // Salvar mensagens se existirem
        if (chat.messages) {
          const messagesPath = path.join(chatsPath, chatId, `${chatId}.json`);
          fs.writeFileSync(messagesPath, JSON.stringify(chat.messages, null, 2));
        }
      }
    }
  }

  /**
   * Carrega dados do SQLite
   */
  private async loadFromSQLite(clientId: string): Promise<any> {
    // Pula carregamento do SQLite para pastas de sistema
    if (this.isSystemFolder(clientId)) {
      console.log(`⏭️ Pulando carregamento SQLite para pasta de sistema: ${clientId}`);
      return null;
    }

    const data: any = {};

    // Carregar cliente
    const cliente = clienteCRUD.getByClientId(clientId);
    if (cliente) {
      data.infoCliente = {
        CLIENTE: cliente.cliente,
        name: cliente.name,
        STATUS: cliente.status,
        AI_SELECTED: cliente.ai_selected,
        TARGET_CHAT_ID: cliente.target_chat_id,
        GEMINI_KEY: cliente.gemini_key,
        GROQ_KEY: cliente.groq_key
        // Adicionar outras configurações do clientes_config se necessário
      };
    }

    // Carregar contatos
    const contatos = contatoCRUD.getByClientId(clientId);
    if (contatos.length > 0) {
      data.contatos = {};
      for (const contato of contatos) {
        data.contatos[contato.telefone!] = contato.nome;
      }
    }

    // Carregar leads
    const leads = leadCRUD.getByClientId(clientId);
    if (leads.length > 0) {
      data.leads = {};
      for (const lead of leads) {
        data.leads[lead.id] = {
          contato_id: lead.contato_id,
          chat_id: lead.chat_id,
          nome: lead.nome,
          telefone: lead.telefone,
          origem: lead.origem,
          tags: JSON.parse(lead.tags || '[]'),
          tipo_lead: lead.tipo_lead,
          lead_score: lead.lead_score,
          etapa_funil: lead.etapa_funil,
          resumo_para_atendente: lead.resumo_para_atendente,
          timestamp_identificacao: lead.timestamp_identificacao,
          data_geracao_lead: lead.data_geracao_lead,
          data_notificacao_lead: lead.data_notificacao_lead
        };
      }
    }

    // Carregar chats
    const chats = chatCRUD.getByClientId(clientId);
    if (chats.length > 0) {
      data.chats = {};
      for (const chat of chats) {
        data.chats[chat.chat_id] = {
          name: chat.name,
          telefone: chat.telefone,
          tags: JSON.parse(chat.tags || '[]'),
          listaNome: chat.lista_nome,
          lead: chat.lead,
          interesse: chat.interesse,
          leadScore: chat.lead_score,
          etapaFunil: chat.etapa_funil,
          isLeadQualificado: chat.is_lead_qualificado,
          detalhes_agendamento: JSON.parse(chat.detalhes_agendamento || '[]'),
          resumoParaAtendente: chat.resumo_para_atendente,
          precisaAtendimentoHumano: chat.precisa_atendimento_humano,
          data_ultima_mensagem_recebida: chat.data_ultima_mensagem_recebida,
          data_ultima_mensagem_enviada: chat.data_ultima_mensagem_enviada,
          data_ultima_analise: chat.data_ultima_analise,
          ultima_notificacao_atendimento_humano: chat.ultima_notificacao_atendimento_humano,
          messages: messageCRUD.getByChatId(chat.chat_id)
        };
      }
    }

    return Object.keys(data).length > 0 ? data : null;
  }

  /**
   * Carrega dados do JSON
   */
  private async loadFromJSON(clientId: string): Promise<any> {
    // Usar caminho correto baseado no tipo de cliente
    const clientPath = this.getClientPath(clientId);
    const configPath = path.join(clientPath, 'config');

    const data: any = {};

    // Carregar infoCliente.json
    const infoClientePath = path.join(configPath, 'infoCliente.json');
    if (fs.existsSync(infoClientePath)) {
      data.infoCliente = JSON.parse(fs.readFileSync(infoClientePath, 'utf-8'));
    }

    // Carregar contatos.json
    const contatosPath = path.join(configPath, 'contatos.json');
    if (fs.existsSync(contatosPath)) {
      data.contatos = JSON.parse(fs.readFileSync(contatosPath, 'utf-8'));
    }

    // Carregar leads.json
    const leadsPath = path.join(configPath, 'leads.json');
    if (fs.existsSync(leadsPath)) {
      data.leads = JSON.parse(fs.readFileSync(leadsPath, 'utf-8'));
    }

    // Carregar dados específicos do sistema
    const smartCachePath = path.join(configPath, 'smartCache.json');
    if (fs.existsSync(smartCachePath)) {
      data.smartCache = JSON.parse(fs.readFileSync(smartCachePath, 'utf-8'));
    }

    const monitoringPath = path.join(configPath, 'monitoringAlerts.json');
    if (fs.existsSync(monitoringPath)) {
      data.monitoringAlerts = JSON.parse(fs.readFileSync(monitoringPath, 'utf-8'));
    }

    // Carregar chats (Dados.json de cada chat) - apenas para clientes normais
    if (!this.isSystemFolder(clientId)) {
      const chatsPath = path.join(clientPath, 'Chats', 'Historico');
      if (fs.existsSync(chatsPath)) {
        data.chats = {};
        const chatFolders = fs.readdirSync(chatsPath);

        for (const chatFolder of chatFolders) {
          const dadosPath = path.join(chatsPath, chatFolder, 'Dados.json');
          const messagesPath = path.join(chatsPath, chatFolder, `${chatFolder}.json`);

          if (fs.existsSync(dadosPath)) {
            data.chats[chatFolder] = JSON.parse(fs.readFileSync(dadosPath, 'utf-8'));

            // Adicionar mensagens se existirem
            if (fs.existsSync(messagesPath)) {
              data.chats[chatFolder].messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
            }
          }
        }
      }
    }

    return Object.keys(data).length > 0 ? data : null;
  }

  /**
   * Atualiza feature flags em runtime
   */
  updateFeatures(newFeatures: Partial<typeof this.features>): void {
    this.features = { ...this.features, ...newFeatures };
    console.log('🔄 Features atualizadas:', this.features);
  }

  /**
   * Verifica saúde da sincronização
   */
  async healthCheck(clientId: string): Promise<any> {
    const results = {
      sqlite: { status: 'unknown' as string, error: null as string | null },
      json: { status: 'unknown' as string, error: null as string | null },
      sync: { status: 'unknown' as string, data_match: null as boolean | null }
    };

    // Testar SQLite
    try {
      const cliente = clienteCRUD.getByClientId(clientId);
      results.sqlite.status = cliente ? 'healthy' : 'no_data';
    } catch (error) {
      results.sqlite.status = 'error';
      results.sqlite.error = error instanceof Error ? error.message : String(error);
    }

    // Testar JSON
    try {
      const jsonData = await this.loadFromJSON(clientId);
      results.json.status = jsonData ? 'healthy' : 'no_data';
    } catch (error) {
      results.json.status = 'error';
      results.json.error = error instanceof Error ? error.message : String(error);
    }

    // Verificar sincronização
    if (results.sqlite.status === 'healthy' && results.json.status === 'healthy') {
      try {
        const sqliteData = await this.loadFromSQLite(clientId);
        const jsonData = await this.loadFromJSON(clientId);
        results.sync.data_match = JSON.stringify(sqliteData) === JSON.stringify(jsonData);
        results.sync.status = results.sync.data_match ? 'synced' : 'out_of_sync';
      } catch (error) {
        results.sync.status = 'error';
      }
    }

    return results;
  }
}

// Instância singleton
export const syncManager = new SyncManager();