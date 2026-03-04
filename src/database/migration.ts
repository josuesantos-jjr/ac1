import fs from 'fs';
import path from 'path';
import { getDatabase } from './database.ts';
import { clienteCRUD, contatoCRUD, chatCRUD, leadCRUD, messageCRUD } from './crud.ts';
import { Cliente, Contato, Chat, Lead, Message } from './crud.ts';

/**
 * Utilitários de migração JSON → SQLite
 * Mantém isolamento total por cliente durante o processo
 */
export class MigrationUtils {
  private db = getDatabase();

  /**
   * Migra dados de um cliente específico
   */
  async migrateClient(clientId: string): Promise<void> {
    console.log(`🚀 Iniciando migração do cliente: ${clientId}`);

    const clientPath = path.join(process.cwd(), 'clientes', clientId);

    if (!fs.existsSync(clientPath)) {
      console.warn(`⚠️ Caminho do cliente não encontrado: ${clientPath}`);
      return;
    }

    try {
      // 1. Migrar configurações do cliente (infoCliente.json)
      await this.migrateClientConfig(clientId, clientPath);

      // 2. Migrar contatos
      await this.migrateContacts(clientId, clientPath);

      // 3. Migrar chats e mensagens
      await this.migrateChatsAndMessages(clientId, clientPath);

      // 4. Migrar leads
      await this.migrateLeads(clientId, clientPath);

      console.log(`✅ Migração concluída para cliente: ${clientId}`);
    } catch (error) {
      console.error(`❌ Erro na migração do cliente ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Migra configuração do cliente (infoCliente.json)
   */
  private async migrateClientConfig(clientId: string, clientPath: string): Promise<void> {
    const configPath = path.join(clientPath, 'config', 'infoCliente.json');

    if (!fs.existsSync(configPath)) {
      console.warn(`⚠️ Arquivo infoCliente.json não encontrado: ${configPath}`);
      return;
    }

    try {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Extrair informações do caminho
      const clientName = clientId;

      const cliente: Cliente = {
        client_id: clientId,
        name: configData.name || configData.CLIENTE || clientName,
        status: configData.STATUS || 'Ativo',
        cliente: configData.CLIENTE,
        ai_selected: configData.AI_SELECTED,
        target_chat_id: configData.TARGET_CHAT_ID,
        gemini_key: configData.GEMINI_KEY,
        groq_key: configData.GROQ_KEY
      };

      clienteCRUD.upsert(cliente);
      console.log(`✅ Configuração migrada para cliente: ${clientId}`);

      // Migrar configurações adicionais (prompts, etc.)
      await this.migrateAdditionalConfigs(clientId, configData);

    } catch (error) {
      console.error(`❌ Erro ao migrar configuração do cliente ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Migra configurações adicionais (prompts, regras, etc.)
   */
  private async migrateAdditionalConfigs(clientId: string, configData: any): Promise<void> {
    const configs = [
      { key: 'GEMINI_PROMPT', type: 'prompts' },
      { key: 'GEMINI_LINK', type: 'links' },
      { key: 'NAME_PROMPT', type: 'prompts' },
      { key: 'INTEREST_PROMPT', type: 'prompts' },
      { key: 'ORCAMENTO_PROMPT', type: 'prompts' },
      { key: 'SUMMARY_PROMPT', type: 'prompts' },
      { key: 'AQ_PROMPT', type: 'prompts' },
      { key: 'PROMPT_PROSPEC', type: 'prompts' },
      { key: 'PROMPT_AGENDAMENTO', type: 'prompts' },
      { key: 'PROMPT_SPLIT', type: 'prompts' },
      { key: 'PROMPT_REMARKETING', type: 'prompts' },
      { key: 'PROMPT_ATIVOS', type: 'prompts' },
      { key: 'PROMPT_CANCELADOS', type: 'prompts' },
      { key: 'PROMPT_DESISTENCIA', type: 'prompts' },
      { key: 'LEAD_PROMPT', type: 'prompts' },
      { key: 'QUALIFY_LEAD_PROMPT', type: 'prompts' },
      { key: 'GROQ_KEY', type: 'keys' },
      { key: 'GROQ_KEY_RESERVA', type: 'keys' },
      { key: 'GEMINI_KEY_BG', type: 'keys' },
      { key: 'GEMINI_KEY_AQ', type: 'keys' },
      { key: 'GEMINI_KEY_CHAT', type: 'keys' },
      { key: 'GEMINI_KEY_RESERVA', type: 'keys' },
      { key: 'QR_CODE', type: 'config' },
      { key: 'STATUS_SESSION', type: 'status' },
      { key: 'BK_CHATID', type: 'config' }
    ];

    for (const config of configs) {
      if (configData[config.key]) {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO clientes_config (client_id, config_type, config_key, config_value)
          VALUES (?, ?, ?, ?)
        `);
        stmt.run(clientId, config.type, config.key, JSON.stringify(configData[config.key]));
      }
    }
  }

  /**
   * Migra contatos do cliente
   */
  private async migrateContacts(clientId: string, clientPath: string): Promise<void> {
    const contactsPath = path.join(clientPath, 'config', 'contatos.json');

    if (!fs.existsSync(contactsPath)) {
      console.warn(`⚠️ Arquivo contatos.json não encontrado: ${contactsPath}`);
      return;
    }

    try {
      const contactsData = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));

      let migrated = 0;
      for (const [telefone, nome] of Object.entries(contactsData)) {
        const contato: Contato = {
          id: telefone,
          client_id: clientId,
          nome: nome as string,
          telefone: telefone
        };

        contatoCRUD.upsert(contato);
        migrated++;
      }

      console.log(`✅ ${migrated} contatos migrados para cliente: ${clientId}`);

    } catch (error) {
      console.error(`❌ Erro ao migrar contatos do cliente ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Migra chats e mensagens
   */
  private async migrateChatsAndMessages(clientId: string, clientPath: string): Promise<void> {
    const chatDir = path.join(clientPath, 'Chats', 'Historico');

    if (!fs.existsSync(chatDir)) {
      console.warn(`⚠️ Diretório de chats não encontrado: ${chatDir}`);
      return;
    }

    try {
      const chatFolders = fs.readdirSync(chatDir);
      let totalChats = 0;
      let totalMessages = 0;

      for (const chatFolder of chatFolders) {
        const chatPath = path.join(chatDir, chatFolder);

        if (!fs.statSync(chatPath).isDirectory()) continue;

        // 1. Migrar Dados.json
        const dadosPath = path.join(chatPath, 'Dados.json');
        if (fs.existsSync(dadosPath)) {
          const dadosData = JSON.parse(fs.readFileSync(dadosPath, 'utf-8'));
          await this.migrateChatData(clientId, chatFolder, dadosData);
          totalChats++;
        }

        // 2. Migrar mensagens
        const messagesPath = path.join(chatPath, `${chatFolder}.json`);
        if (fs.existsSync(messagesPath)) {
          const messagesData = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
          const messagesCount = await this.migrateChatMessages(clientId, chatFolder, messagesData);
          totalMessages += messagesCount;
        }
      }

      console.log(`✅ ${totalChats} chats e ${totalMessages} mensagens migrados para cliente: ${clientId}`);

    } catch (error) {
      console.error(`❌ Erro ao migrar chats do cliente ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Migra dados de um chat específico
   */
  private async migrateChatData(clientId: string, chatId: string, dadosData: any): Promise<void> {
    const chat: Chat = {
      chat_id: chatId,
      client_id: clientId,
      name: dadosData.name,
      telefone: dadosData.telefone,
      tags: JSON.stringify(dadosData.tags || []),
      lista_nome: dadosData.listaNome,
      lead: dadosData.lead,
      interesse: dadosData.interesse,
      lead_score: dadosData.leadScore,
      etapa_funil: dadosData.etapaFunil,
      is_lead_qualificado: dadosData.isLeadQualificado,
      detalhes_agendamento: JSON.stringify(dadosData.detalhes_agendamento || []),
      resumo_para_atendente: dadosData.resumoParaAtendente,
      precisa_atendimento_humano: dadosData.precisaAtendimentoHumano,
      data_ultima_mensagem_recebida: dadosData.data_ultima_mensagem_recebida,
      data_ultima_mensagem_enviada: dadosData.data_ultima_mensagem_enviada,
      data_ultima_analise: dadosData.data_ultima_analise,
      ultima_notificacao_atendimento_humano: dadosData.ultima_notificacao_atendimento_humano
    };

    chatCRUD.upsert(chat);
  }

  /**
   * Migra mensagens de um chat
   */
  private async migrateChatMessages(clientId: string, chatId: string, messagesData: any[]): Promise<number> {
    let migrated = 0;

    for (const messageData of messagesData) {
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
      migrated++;
    }

    return migrated;
  }

  /**
   * Migra leads do cliente
   */
  private async migrateLeads(clientId: string, clientPath: string): Promise<void> {
    const leadsPath = path.join(clientPath, 'config', 'leads.json');

    if (!fs.existsSync(leadsPath)) {
      console.warn(`⚠️ Arquivo leads.json não encontrado: ${leadsPath}`);
      return;
    }

    try {
      const leadsData = JSON.parse(fs.readFileSync(leadsPath, 'utf-8'));

      let migrated = 0;
      for (const [leadId, leadData] of Object.entries(leadsData)) {
        const data = leadData as any;

        const lead: Lead = {
          id: leadId,
          client_id: clientId,
          contato_id: data.contato_id || leadId,
          chat_id: data.chat_id || '',
          nome: data.nome,
          telefone: data.telefone,
          origem: data.origem,
          tags: JSON.stringify(data.tags || []),
          tipo_lead: data.tipo_lead,
          lead_score: data.lead_score,
          etapa_funil: data.etapa_funil,
          resumo_para_atendente: data.resumo_para_atendente,
          timestamp_identificacao: data.timestamp_identificacao,
          data_geracao_lead: data.data_geracao_lead,
          data_notificacao_lead: data.data_notificacao_lead
        };

        leadCRUD.upsert(lead);
        migrated++;
      }

      console.log(`✅ ${migrated} leads migrados para cliente: ${clientId}`);

    } catch (error) {
      console.error(`❌ Erro ao migrar leads do cliente ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Migra todos os clientes encontrados
   */
  async migrateAllClients(): Promise<void> {
    console.log('🚀 Iniciando migração completa de todos os clientes...');

    const clientesPath = path.join(process.cwd(), 'clientes');

    if (!fs.existsSync(clientesPath)) {
      throw new Error('Diretório clientes não encontrado');
    }

    // Encontrar todos os clientes (ativos, modelos, etc.)
    const clientIds: string[] = [];

    const findClientsRecursively = (dir: string, currentPath: string[] = []) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.')) {
          const newPath = [...currentPath, item];

          // Verificar se é um cliente (tem config/infoCliente.json)
          const infoClientePath = path.join(fullPath, 'config', 'infoCliente.json');
          if (fs.existsSync(infoClientePath)) {
            clientIds.push(newPath.join('/'));
          } else {
            // Continuar procurando recursivamente
            findClientsRecursively(fullPath, newPath);
          }
        }
      }
    };

    findClientsRecursively(clientesPath);

    console.log(`📋 Encontrados ${clientIds.length} clientes para migrar`);

    // Migrar cada cliente
    for (const clientId of clientIds) {
      try {
        await this.migrateClient(clientId);
      } catch (error) {
        console.error(`❌ Falha na migração do cliente ${clientId}, continuando...`, error);
      }
    }

    console.log('✅ Migração completa finalizada!');
  }

  /**
   * Verifica status da migração
   */
  async getMigrationStatus(): Promise<any> {
    const stats = await this.db.getStats();
    const clients = clienteCRUD.getActiveClients();

    return {
      databaseStats: stats,
      migratedClients: clients.length,
      clients: clients.map(c => ({ id: c.client_id, name: c.name, status: c.status }))
    };
  }

  /**
   * Rollback da migração (remove dados migrados)
   */
  rollbackMigration(): void {
    console.log('⚠️ Iniciando rollback da migração...');

    const tables = [
      'user_permissions',
      'audit_logs',
      'backups',
      'statistics',
      'message_buffer',
      'messages',
      'leads',
      'chats',
      'contatos',
      'clientes_config',
      'clientes'
    ];

    for (const table of tables) {
      try {
        this.db.exec(`DELETE FROM ${table}`);
        console.log(`✅ Dados removidos da tabela: ${table}`);
      } catch (error) {
        console.error(`❌ Erro ao remover dados da tabela ${table}:`, error);
      }
    }

    console.log('✅ Rollback concluído');
  }
}

// Instância singleton
export const migrationUtils = new MigrationUtils();