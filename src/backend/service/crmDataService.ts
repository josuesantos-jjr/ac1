import sqlite3 from 'sqlite3';
import { googleSheetsAuth } from './googleSheetsAuth';

const fs = require('fs');
const path = require('path');

// Logger simples para evitar dependências
const logger = {
  info: (msg: any) => console.log(`[CRM-INFO] ${msg}`),
  warn: (msg: any) => console.warn(`[CRM-WARN] ${msg}`),
  error: (msg: any) => console.error(`[CRM-ERROR] ${msg}`)
};


// Interface para contato CRM
export interface CRMContact {
  id: string;
  chatId: string;
  clienteId: string; // Novo campo para identificar o cliente
  nome?: string;
  sobrenome?: string;
  telefone: string;
  email?: string;
  tags: string[];
  listaNome?: string;
  lead: 'sim' | 'não';
  data_ultima_mensagem_recebida: string;
  data_ultima_mensagem_enviada: string;
  nome_identificado?: string;
  interesse?: string;
  leadScore: number;
  etapaFunil: string;
  isLeadQualificado: boolean;
  detalhes_agendamento?: any;
  resumoParaAtendente?: string;
  precisaAtendimentoHumano: boolean;
  data_ultima_analise: string;
  ultima_notificacao_atendimento_humano?: string;
  valorEstimado?: number;
  notas?: string;
  status: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

// Classe para gerenciar dados CRM
export class CRMDataService {
  private db!: sqlite3.Database;
  private clientSpreadsheetIds: Map<string, string> = new Map(); // clientId -> spreadsheetId
  private isGoogleAuthenticated = false;

  constructor() {
    this.initializeDatabase();
    this.checkGoogleAuth();
  }

  private initializeDatabase() {
    const dbPath = path.join(process.cwd(), 'crm_data.db');

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error(`Erro ao abrir banco de dados SQLite: ${err}`);
        throw err;
      }
      logger.info('Banco de dados SQLite conectado');

      // Criar tabelas se não existirem
      this.createTables();
    });
  }

  private createTables() {
    const sql = `
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        chatId TEXT UNIQUE,
        clienteId TEXT,
        nome TEXT,
        sobrenome TEXT,
        telefone TEXT,
        email TEXT,
        tags TEXT,
        listaNome TEXT,
        lead TEXT CHECK(lead IN ('sim', 'não')),
        data_ultima_mensagem_recebida TEXT,
        data_ultima_mensagem_enviada TEXT,
        nome_identificado TEXT,
        interesse TEXT,
        leadScore INTEGER DEFAULT 0,
        etapaFunil TEXT DEFAULT 'Prospecto',
        isLeadQualificado INTEGER DEFAULT 0,
        detalhes_agendamento TEXT,
        resumoParaAtendente TEXT,
        precisaAtendimentoHumano INTEGER DEFAULT 0,
        data_ultima_analise TEXT,
        ultima_notificacao_atendimento_humano TEXT,
        valorEstimado REAL,
        notas TEXT,
        status TEXT DEFAULT 'Ativo',
        dataCriacao TEXT DEFAULT CURRENT_TIMESTAMP,
        dataAtualizacao TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `;

    this.db.exec(sql, (err) => {
      if (err) {
        logger.error(`Erro ao criar tabelas: ${err}`);
      } else {
        logger.info('Tabelas do banco de dados criadas/verificada');
      }
    });
  }

  private async checkGoogleAuth() {
    this.isGoogleAuthenticated = googleSheetsAuth.isAuthenticated();
    if (this.isGoogleAuthenticated) {
      await this.loadSpreadsheetId();
    }
  }

  private async loadSpreadsheetId(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT value FROM sync_metadata WHERE key = ?', ['spreadsheetId'], (err, row: any) => {
        if (err) {
          logger.error(`Erro ao carregar spreadsheetId: ${err}`);
          reject(err);
        } else {
          // Mantém compatibilidade com código antigo que pode usar spreadsheetId global
          resolve();
        }
      });
    });
  }

  private saveSpreadsheetId(spreadsheetId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)',
        ['spreadsheetId', spreadsheetId],
        (err) => {
          if (err) {
            logger.error(`Erro ao salvar spreadsheetId: ${err}`);
            reject(err);
          } else {
            // Mantém compatibilidade com código antigo
            resolve();
          }
        }
      );
    });
  }

  // Carregar configuração CRM do cliente
  async loadClientCrmConfig(clientId: string): Promise<any> {
    try {
      const configPath = path.join(process.cwd(), 'clientes', clientId, 'config', 'crm-config.json');

      if (!fs.existsSync(configPath)) {
        return null;
      }

      const configData = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData);

      // Armazenar spreadsheetId do cliente
      if (config.spreadsheetId) {
        this.clientSpreadsheetIds.set(clientId, config.spreadsheetId);
      }

      return config;
    } catch (error) {
      logger.error(`Erro ao carregar configuração CRM do cliente ${clientId}: ${error}`);
      return null;
    }
  }

  // Salvar configuração CRM do cliente
  async saveClientCrmConfig(clientId: string, config: any): Promise<void> {
    try {
      const clientDir = path.join(process.cwd(), 'clientes', clientId, 'config');
      const configPath = path.join(clientDir, 'crm-config.json');

      if (!fs.existsSync(clientDir)) {
        fs.mkdirSync(clientDir, { recursive: true });
      }

      const updatedConfig = {
        ...config,
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');

      // Armazenar spreadsheetId do cliente
      if (config.spreadsheetId) {
        this.clientSpreadsheetIds.set(clientId, config.spreadsheetId);
      }

      logger.info(`Configuração CRM salva para cliente ${clientId}`);
    } catch (error) {
      logger.error(`Erro ao salvar configuração CRM do cliente ${clientId}: ${error}`);
      throw error;
    }
  }

  // Converte dados.json para formato CRM
  private convertDadosToCRM(chatId: string, dados: any, clienteId: string): CRMContact {
    return {
      id: chatId,
      chatId,
      clienteId,
      nome: dados.name || dados.nome,
      sobrenome: dados.sobrenome || '',
      telefone: dados.telefone || dados.number || chatId.replace('@c.us', ''),
      email: dados.email || '',
      tags: Array.isArray(dados.tags) ? dados.tags : [],
      listaNome: dados.listaNome || null,
      lead: dados.lead === 'sim' ? 'sim' : 'não',
      data_ultima_mensagem_recebida: dados.data_ultima_mensagem_recebida || new Date().toISOString(),
      data_ultima_mensagem_enviada: dados.data_ultima_mensagem_enviada || new Date().toISOString(),
      nome_identificado: dados.nome || null,
      interesse: dados.interesse || '',
      leadScore: dados.leadScore || 0,
      etapaFunil: dados.etapaFunil || 'Prospecto',
      isLeadQualificado: dados.isLeadQualificado || false,
      detalhes_agendamento: dados.detalhes_agendamento || {},
      resumoParaAtendente: dados.resumoParaAtendente || '',
      precisaAtendimentoHumano: dados.precisaAtendimentoHumano || false,
      data_ultima_analise: dados.data_ultima_analise || new Date().toISOString(),
      ultima_notificacao_atendimento_humano: dados.ultima_notificacao_atendimento_humano || null,
      valorEstimado: dados.valorEstimado || 0,
      notas: dados.notas || '',
      status: dados.status || 'Ativo',
      dataCriacao: dados.dataCriacao || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };
  }

  // Salva contato no SQLite
  async saveContact(contact: CRMContact): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO contacts (
          id, chatId, clienteId, nome, sobrenome, telefone, email, tags, listaNome, lead,
          data_ultima_mensagem_recebida, data_ultima_mensagem_enviada,
          nome_identificado, interesse, leadScore, etapaFunil, isLeadQualificado,
          detalhes_agendamento, resumoParaAtendente, precisaAtendimentoHumano,
          data_ultima_analise, ultima_notificacao_atendimento_humano,
          valorEstimado, notas, status, dataCriacao, dataAtualizacao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        contact.id,
        contact.chatId,
        contact.clienteId,
        contact.nome,
        contact.sobrenome,
        contact.telefone,
        contact.email,
        JSON.stringify(contact.tags),
        contact.listaNome,
        contact.lead,
        contact.data_ultima_mensagem_recebida,
        contact.data_ultima_mensagem_enviada,
        contact.nome_identificado,
        contact.interesse,
        contact.leadScore,
        contact.etapaFunil,
        contact.isLeadQualificado ? 1 : 0,
        JSON.stringify(contact.detalhes_agendamento),
        contact.resumoParaAtendente,
        contact.precisaAtendimentoHumano ? 1 : 0,
        contact.data_ultima_analise,
        contact.ultima_notificacao_atendimento_humano,
        contact.valorEstimado,
        contact.notas,
        contact.status,
        contact.dataCriacao,
        contact.dataAtualizacao
      ];

      this.db.run(sql, params, (err) => {
        if (err) {
          logger.error(`Erro ao salvar contato: ${err}`);
          reject(err);
        } else {
          logger.info(`Contato ${contact.id} salvo no SQLite`);
          resolve();
        }
      });
    });
  }

  // Carrega contato do SQLite
  async loadContact(chatId: string): Promise<CRMContact | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM contacts WHERE chatId = ?';

      this.db.get(sql, [chatId], (err, row: any) => {
        if (err) {
          logger.error(`Erro ao carregar contato: ${err}`);
          reject(err);
        } else if (row) {
          // Converte dados do banco para formato CRM
          const contact: CRMContact = {
            ...row,
            tags: JSON.parse(row.tags || '[]'),
            isLeadQualificado: row.isLeadQualificado === 1,
            precisaAtendimentoHumano: row.precisaAtendimentoHumano === 1,
            detalhes_agendamento: JSON.parse(row.detalhes_agendamento || '{}')
          };
          resolve(contact);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Lista todos os contatos
  async listContacts(filters?: {
    clienteId?: string;
    etapaFunil?: string;
    lead?: 'sim' | 'não';
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CRMContact[]> {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM contacts WHERE 1=1';
      const params: any[] = [];

      if (filters?.clienteId) {
        sql += ' AND clienteId = ?';
        params.push(filters.clienteId);
      }

      if (filters?.etapaFunil) {
        sql += ' AND etapaFunil = ?';
        params.push(filters.etapaFunil);
      }

      if (filters?.lead) {
        sql += ' AND lead = ?';
        params.push(filters.lead);
      }

      if (filters?.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }

      sql += ' ORDER BY dataAtualizacao DESC';

      if (filters?.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters?.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }

      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) {
          logger.error(`Erro ao listar contatos: ${err}`);
          reject(err);
        } else {
          const contacts: CRMContact[] = rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]'),
            isLeadQualificado: row.isLeadQualificado === 1,
            precisaAtendimentoHumano: row.precisaAtendimentoHumano === 1,
            detalhes_agendamento: JSON.parse(row.detalhes_agendamento || '{}')
          }));
          resolve(contacts);
        }
      });
    });
  }

  // Atualiza contato e sincroniza se necessário
  async updateContact(chatId: string, updates: Partial<CRMContact>): Promise<void> {
    const contact = await this.loadContact(chatId);
    if (!contact) {
      throw new Error(`Contato ${chatId} não encontrado`);
    }

    const updatedContact: CRMContact = {
      ...contact,
      ...updates,
      dataAtualizacao: new Date().toISOString()
    };

    await this.saveContact(updatedContact);

    // Sincroniza com Google Sheets se autenticado e auto-sync ativado
    if (this.isGoogleAuthenticated) {
      try {
        const clientConfig = await this.loadClientCrmConfig(contact.clienteId);
        const autoSyncEnabled = clientConfig?.autoSync !== false; // Default true

        if (autoSyncEnabled) {
          await this.syncToGoogleSheets(updatedContact);
        }
      } catch (error) {
        logger.warn(`Falha ao sincronizar com Google Sheets: ${error}`);
      }
    }
  }

  // Adiciona novo contato
  async addContact(contact: CRMContact): Promise<void> {
    contact.dataCriacao = new Date().toISOString();
    contact.dataAtualizacao = new Date().toISOString();

    await this.saveContact(contact);

    // Sincroniza com Google Sheets se autenticado e auto-sync ativado
    if (this.isGoogleAuthenticated) {
      try {
        const clientConfig = await this.loadClientCrmConfig(contact.clienteId);
        const autoSyncEnabled = clientConfig?.autoSync !== false; // Default true

        if (autoSyncEnabled) {
          await this.syncToGoogleSheets(contact);
        }
      } catch (error) {
        logger.warn(`Falha ao sincronizar com Google Sheets: ${error}`);
      }
    }
  }

  // Cria ou obtém planilha do Google Sheets para um cliente específico
  private async createOrGetSpreadsheet(clientId?: string): Promise<string> {
    const sheets = await googleSheetsAuth.getSheetsClient();
    const drive = await googleSheetsAuth.getDriveClient();

    // Se clientId fornecido, tentar usar configuração específica do cliente
    if (clientId) {
      const clientConfig = await this.loadClientCrmConfig(clientId);
      if (clientConfig?.spreadsheetId) {
        try {
          // Verifica se a planilha ainda existe
          await sheets.spreadsheets.get({ spreadsheetId: clientConfig.spreadsheetId });
          return clientConfig.spreadsheetId;
        } catch (error) {
          logger.warn(`Planilha do cliente ${clientId} não encontrada, será criada nova...`);
          // Remove spreadsheetId inválido da configuração
          clientConfig.spreadsheetId = null;
          await this.saveClientCrmConfig(clientId, clientConfig);
        }
      }
    }

    // Fallback para planilha global (para compatibilidade)
    if (this.clientSpreadsheetIds.get('global')) {
      const globalSpreadsheetId = this.clientSpreadsheetIds.get('global')!;
      try {
        await sheets.spreadsheets.get({ spreadsheetId: globalSpreadsheetId });
        return globalSpreadsheetId;
      } catch (error) {
        logger.warn('Planilha global não encontrada, criando nova...');
        this.clientSpreadsheetIds.delete('global');
      }
    }

    // Cria nova planilha
    const spreadsheetName = clientId ? `CRM - ${clientId}` : 'CRM - Sistema de Vendas';
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: spreadsheetName,
          locale: 'pt_BR'
        },
        sheets: [{
          properties: {
            title: 'Contatos',
            gridProperties: {
              rowCount: 1000,
              columnCount: 25
            }
          }
        }]
      }
    });

    const newSpreadsheetId = spreadsheet.data.spreadsheetId!;

    // Salvar na configuração do cliente se clientId fornecido
    if (clientId) {
      const clientConfig = await this.loadClientCrmConfig(clientId) || {};
      clientConfig.spreadsheetId = newSpreadsheetId;
      await this.saveClientCrmConfig(clientId, clientConfig);
    } else {
      // Fallback para configuração global
      await this.saveSpreadsheetId(newSpreadsheetId);
      this.clientSpreadsheetIds.set('global', newSpreadsheetId);
    }

    // Adiciona cabeçalhos
    await this.initializeSheetHeaders(newSpreadsheetId);

    logger.info(`Nova planilha criada para ${clientId || 'global'}: ${newSpreadsheetId}`);
    return newSpreadsheetId;
  }

  // Inicializa cabeçalhos da planilha
  private async initializeSheetHeaders(spreadsheetId: string): Promise<void> {
    const sheets = await googleSheetsAuth.getSheetsClient();

    const headers = [
      'ID', 'Chat ID', 'Nome', 'Sobrenome', 'Telefone', 'Email', 'Tags',
      'Lista Nome', 'É Lead', 'Última Msg Recebida', 'Última Msg Enviada',
      'Nome Identificado', 'Interesse', 'Lead Score', 'Etapa Funil',
      'Lead Qualificado', 'Detalhes Agendamento', 'Resumo Atendente',
      'Precisa Atendimento Humano', 'Última Análise', 'Última Notificação',
      'Valor Estimado', 'Notas', 'Status', 'Data Criação', 'Data Atualização'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Contatos!A1:Z1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers]
      }
    });

    logger.info('Cabeçalhos da planilha inicializados');
  }

  // Sincroniza contato para Google Sheets
  private async syncToGoogleSheets(contact: CRMContact): Promise<void> {
    try {
      const spreadsheetId = await this.createOrGetSpreadsheet(contact.clienteId);
      const sheets = await googleSheetsAuth.getSheetsClient();

      // Carregar configuração do cliente para obter mapeamento de campos
      const clientConfig = await this.loadClientCrmConfig(contact.clienteId);
      const mappings = clientConfig?.mappings || [];

      // Se há mapeamento personalizado, usar ele
      let rowData: any[];
      if (mappings.length > 0) {
        rowData = mappings.map((mapping: any) => {
          const value = (contact as any)[mapping.field];
          switch (mapping.dataType) {
            case 'number':
              return value || 0;
            case 'date':
              return value ? new Date(value).toLocaleDateString('pt-BR') : '';
            case 'string':
            default:
              if (Array.isArray(value)) {
                return value.join('; ');
              }
              if (typeof value === 'boolean') {
                return value ? 'Sim' : 'Não';
              }
              if (typeof value === 'object') {
                return JSON.stringify(value);
              }
              return value || '';
          }
        });
      } else {
        // Mapeamento padrão
        rowData = [
          contact.id,
          contact.chatId,
          contact.nome || '',
          contact.sobrenome || '',
          contact.telefone,
          contact.email || '',
          contact.tags.join('; '),
          contact.listaNome || '',
          contact.lead,
          contact.data_ultima_mensagem_recebida,
          contact.data_ultima_mensagem_enviada,
          contact.nome_identificado || '',
          contact.interesse || '',
          contact.leadScore,
          contact.etapaFunil,
          contact.isLeadQualificado ? 'Sim' : 'Não',
          JSON.stringify(contact.detalhes_agendamento),
          contact.resumoParaAtendente || '',
          contact.precisaAtendimentoHumano ? 'Sim' : 'Não',
          contact.data_ultima_analise,
          contact.ultima_notificacao_atendimento_humano || '',
          contact.valorEstimado || '',
          contact.notas || '',
          contact.status,
          contact.dataCriacao,
          contact.dataAtualizacao
        ];
      }

      // Verifica se contato já existe na planilha
      const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Contatos!A:A'
      });

      const rows = existingData.data.values || [];
      let rowIndex = -1;

      for (let i = 1; i < rows.length; i++) { // Começa do 1 para pular cabeçalho
        if (rows[i][0] === contact.id) {
          rowIndex = i + 1; // +1 porque arrays são 0-indexed mas sheets são 1-indexed
          break;
        }
      }

      const range = rowIndex > 0
        ? `Contatos!A${rowIndex}:Z${rowIndex}`
        : `Contatos!A${rows.length + 1}:Z${rows.length + 1}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowData]
        }
      });

      logger.info(`Contato ${contact.id} sincronizado com Google Sheets do cliente ${contact.clienteId}`);

    } catch (error) {
      logger.error(`Erro ao sincronizar com Google Sheets: ${error}`);
      throw error;
    }
  }

  // Sincroniza dados do Google Sheets para SQLite
  async syncFromGoogleSheets(clientId?: string): Promise<void> {
    if (!this.isGoogleAuthenticated) {
      throw new Error('Usuário não autenticado no Google');
    }

    try {
      const spreadsheetId = await this.createOrGetSpreadsheet(clientId);
      const sheets = await googleSheetsAuth.getSheetsClient();

      // Carregar configuração do cliente para obter mapeamento de campos
      const clientConfig = clientId ? await this.loadClientCrmConfig(clientId) : null;
      const mappings = clientConfig?.mappings || [];

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Contatos!A2:Z' // Pula cabeçalho
      });

      const rows = response.data.values || [];
      let syncedCount = 0;

      for (const row of rows) {
        try {
          let contact: CRMContact;

          if (mappings.length > 0 && row.length >= mappings.length) {
            // Usar mapeamento personalizado
            const contactData: any = {
              clienteId: clientId || 'unknown'
            };

            mappings.forEach((mapping: any, index: number) => {
              let value = row[index];
              switch (mapping.dataType) {
                case 'number':
                  value = parseFloat(value) || 0;
                  break;
                case 'date':
                  // Tentar converter string de data
                  break;
                case 'string':
                default:
                  if (mapping.field === 'tags' && typeof value === 'string') {
                    value = value.split('; ').filter((tag: string) => tag.trim());
                  } else if (mapping.field === 'isLeadQualificado' || mapping.field === 'precisaAtendimentoHumano') {
                    value = value === 'Sim' || value === 'true';
                  } else if (mapping.field === 'leadScore') {
                    value = parseInt(value) || 0;
                  } else if (mapping.field === 'detalhes_agendamento' && typeof value === 'string') {
                    try {
                      value = JSON.parse(value);
                    } catch {
                      value = {};
                    }
                  }
                  break;
              }
              contactData[mapping.field] = value;
            });

            contact = contactData as CRMContact;
          } else if (row.length >= 26) {
            // Mapeamento padrão
            contact = {
              id: row[0],
              chatId: row[1],
              clienteId: clientId || row[1] || 'unknown',
              nome: row[2] || undefined,
              sobrenome: row[3] || undefined,
              telefone: row[4],
              email: row[5] || undefined,
              tags: row[6] ? row[6].split('; ').filter((tag: string) => tag.trim()) : [],
              listaNome: row[7] || undefined,
              lead: row[8] === 'sim' ? 'sim' : 'não',
              data_ultima_mensagem_recebida: row[9],
              data_ultima_mensagem_enviada: row[10],
              nome_identificado: row[11] || undefined,
              interesse: row[12] || undefined,
              leadScore: parseInt(row[13]) || 0,
              etapaFunil: row[14],
              isLeadQualificado: row[15] === 'Sim',
              detalhes_agendamento: row[16] ? JSON.parse(row[16]) : {},
              resumoParaAtendente: row[17] || undefined,
              precisaAtendimentoHumano: row[18] === 'Sim',
              data_ultima_analise: row[19],
              ultima_notificacao_atendimento_humano: row[20] || undefined,
              valorEstimado: parseFloat(row[21]) || 0,
              notas: row[22] || undefined,
              status: row[23],
              dataCriacao: row[24],
              dataAtualizacao: row[25]
            };
          } else {
            continue; // Pular linhas incompletas
          }

          await this.saveContact(contact);
          syncedCount++;

        } catch (rowError) {
          logger.warn(`Erro ao processar linha ${rows.indexOf(row) + 2}: ${rowError}`);
        }
      }

      logger.info(`${syncedCount} contatos sincronizados do Google Sheets${clientId ? ` para cliente ${clientId}` : ''}`);

    } catch (error) {
      logger.error(`Erro ao sincronizar do Google Sheets: ${error}`);
      throw error;
    }
  }

  // Importa dados de dados.json
  async importFromDadosJson(clientePath: string): Promise<number> {
    let importedCount = 0;

    try {
      // Extrair clienteId do path (ex: clientes/CMW -> CMW)
      const clienteId = path.basename(clientePath);
      const historicoPath = path.join(clientePath, 'Chats', 'Historico');

      logger.info(`[crmDataService] Importando dados para cliente: ${clienteId}`);
      logger.info(`[crmDataService] Caminho histórico: ${historicoPath}`);

      if (!fs.existsSync(historicoPath)) {
        logger.warn(`Diretório de histórico não encontrado: ${historicoPath}`);
        return 0;
      }

      const chatDirs = fs.readdirSync(historicoPath);
      logger.info(`[crmDataService] Encontrados ${chatDirs.length} diretórios de chat: ${chatDirs.join(', ')}`);

      for (const chatDir of chatDirs) {
        const dadosPath = path.join(historicoPath, chatDir, 'Dados.json'); // Arquivo é "Dados.json" com D maiúsculo

        logger.info(`[crmDataService] Verificando arquivo: ${dadosPath}`);

        if (fs.existsSync(dadosPath)) {
          try {
            logger.info(`[crmDataService] Lendo dados de ${chatDir}`);
            const dados = JSON.parse(fs.readFileSync(dadosPath, 'utf-8'));
            const chatId = chatDir.replace('@c.us', '') + '@c.us';

            logger.info(`[crmDataService] Convertendo dados para chatId: ${chatId}, clienteId: ${clienteId}`);
            const contact = this.convertDadosToCRM(chatId, dados, clienteId);

            logger.info(`[crmDataService] Salvando contato: ${contact.chatId} (${contact.etapaFunil})`);
            await this.saveContact(contact);
            importedCount++;

            logger.info(`[crmDataService] Contato ${chatId} salvo com sucesso`);

          } catch (error) {
            logger.error(`Erro ao importar dados.json de ${chatDir}: ${error}`);
          }
        } else {
          logger.warn(`Arquivo Dados.json não encontrado para ${chatDir}: ${dadosPath}`);
        }
      }

      logger.info(`${importedCount} contatos importados de dados.json para cliente ${clienteId}`);

    } catch (error) {
      logger.error(`Erro ao importar dados.json: ${error}`);
      throw error;
    }

    return importedCount;
  }

  // Exporta para CSV
  async exportToCSV(): Promise<string> {
    const contacts = await this.listContacts();
    const csvHeaders = [
      'ID', 'Chat ID', 'Nome', 'Sobrenome', 'Telefone', 'Email', 'Tags',
      'Lista Nome', 'É Lead', 'Última Msg Recebida', 'Última Msg Enviada',
      'Nome Identificado', 'Interesse', 'Lead Score', 'Etapa Funil',
      'Lead Qualificado', 'Resumo Atendente', 'Precisa Atendimento Humano',
      'Valor Estimado', 'Notas', 'Status', 'Data Criação', 'Data Atualização'
    ];

    const csvRows = contacts.map(contact => [
      contact.id,
      contact.chatId,
      contact.nome || '',
      contact.sobrenome || '',
      contact.telefone,
      contact.email || '',
      `"${contact.tags.join('; ')}"`,
      contact.listaNome || '',
      contact.lead,
      contact.data_ultima_mensagem_recebida,
      contact.data_ultima_mensagem_enviada,
      contact.nome_identificado || '',
      `"${contact.interesse || ''}"`,
      contact.leadScore,
      contact.etapaFunil,
      contact.isLeadQualificado ? 'Sim' : 'Não',
      `"${contact.resumoParaAtendente || ''}"`,
      contact.precisaAtendimentoHumano ? 'Sim' : 'Não',
      contact.valorEstimado || '',
      `"${contact.notas || ''}"`,
      contact.status,
      contact.dataCriacao,
      contact.dataAtualizacao
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Fecha conexão com banco de dados
  close(): void {
    this.db.close((err) => {
      if (err) {
        logger.error(`Erro ao fechar banco de dados: ${err}`);
      } else {
        logger.info('Banco de dados fechado');
      }
    });
  }
}

// Instância singleton
export const crmDataService = new CRMDataService();