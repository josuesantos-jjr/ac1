import * as fs from 'node:fs/promises';
import path from 'node:path';
import { identificarAgendamentoCompleto } from './identificarAgendamento.ts';
import type { AgendamentoCompleto } from './identificarAgendamento.ts';
import { mainGoogleBG } from '../service/googleBG.ts';
import { format, addDays, isAfter, parseISO } from 'date-fns';
import logger from '../util/logger.ts';
import { syncManager } from '../../database/sync.ts';

export class SistemaAgendamentos {
  private clientePath: string;
  private agendamentosFile: string;

  constructor(clientePath: string) {
    this.clientePath = clientePath;
    this.agendamentosFile = path.join(clientePath, 'config', 'agendamentos.json');
  }

  /**
   * Salva agendamento completo tanto no agendamentos.json quanto no dados.json do lead
   */
  async salvarAgendamentoCompleto(
    chatId: string,
    conversation: string,
    geminiKey: string
  ): Promise<AgendamentoCompleto | null> {
    try {
      // Identificar agendamento usando a nova função
      const agendamento = await identificarAgendamentoCompleto(
        conversation,
        geminiKey,
        chatId,
        this.clientePath
      );

      if (!agendamento) {
        logger.info(`[SistemaAgendamentos] Nenhum agendamento identificado para ${chatId}`);
        return null;
      }

      // Carregar dados do lead para enriquecer o agendamento
      const dadosLead = await this.carregarDadosLead(chatId);
      if (dadosLead?.name && dadosLead.name !== 'Não identificado') {
        agendamento.nome_lead = dadosLead.name;
      }

      // Salvar no agendamentos.json central
      await this.adicionarAgendamentoCentral(agendamento);

      // Atualizar dados.json do lead
      await this.atualizarDadosLead(chatId, agendamento);

      // Criar evento no Google Calendar (se configurado)
      await this.criarEventoCalendar(agendamento, dadosLead);

      logger.info(`[SistemaAgendamentos] ✅ Agendamento salvo: ${agendamento.id_agendamento} - ${agendamento.tipo_agendamento} em ${agendamento.data_hora_agendamento}`);
      return agendamento;

    } catch (error) {
      logger.error(`[SistemaAgendamentos] Erro ao salvar agendamento para ${chatId}:`, error);
      return null;
    }
  }

  /**
   * Carrega dados do lead do arquivo Dados.json
   */
  private async carregarDadosLead(chatId: string): Promise<any> {
    try {
      const dadosPath = path.join(this.clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
      const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
      return JSON.parse(dadosRaw);
    } catch (error) {
      logger.warn(`[SistemaAgendamentos] Dados do lead não encontrados para ${chatId}`);
      return {};
    }
  }

  /**
   * Adiciona agendamento no arquivo central agendamentos.json
   */
  private async adicionarAgendamentoCentral(agendamento: AgendamentoCompleto): Promise<void> {
    try {
      // Carregar agendamentos existentes
      let agendamentos: AgendamentoCompleto[] = [];
      try {
        const data = await fs.readFile(this.agendamentosFile, 'utf-8');
        agendamentos = JSON.parse(data);
        if (!Array.isArray(agendamentos)) {
          agendamentos = [];
        }
      } catch (error) {
        // Arquivo não existe ou está corrompido, iniciar vazio
        agendamentos = [];
      }

      // Verificar se já existe (evitar duplicatas)
      const existente = agendamentos.find(a => a.id_agendamento === agendamento.id_agendamento);
      if (existente) {
        logger.info(`[SistemaAgendamentos] Agendamento já existe: ${agendamento.id_agendamento}`);
        return;
      }

      // Adicionar novo agendamento
      agendamentos.push(agendamento);

      // 🔄 SALVAR NO SQLITE (sincronização automática) - agendamento salvo
      try {
        await syncManager.saveClientData(this.clientePath, {
          scheduling: {
            id: agendamento.id_agendamento,
            chatId: agendamento.chatId,
            type: agendamento.tipo_agendamento,
            dateTime: agendamento.data_hora_agendamento,
            status: agendamento.status_agendamento,
            leadName: agendamento.nome_lead
          }
        });
        console.log(`[SistemaAgendamentos] Agendamento salvo no SQLite para ${this.clientePath}`);
      } catch (sqliteError) {
        console.error(`[SistemaAgendamentos] Erro ao salvar agendamento no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // Salvar arquivo
      await fs.writeFile(this.agendamentosFile, JSON.stringify(agendamentos, null, 2), 'utf-8');
      logger.info(`[SistemaAgendamentos] Agendamento adicionado ao arquivo central: ${agendamento.id_agendamento}`);

    } catch (error) {
      logger.error(`[SistemaAgendamentos] Erro ao salvar no arquivo central:`, error);
      throw error;
    }
  }

  /**
   * Atualiza o arquivo Dados.json do lead com informações do agendamento
   */
  private async atualizarDadosLead(chatId: string, agendamento: AgendamentoCompleto): Promise<void> {
    try {
      const dadosPath = path.join(this.clientePath, 'Chats', 'Historico', chatId, 'Dados.json');

      // Carregar dados existentes
      let dados: any = {};
      try {
        const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
        dados = JSON.parse(dadosRaw);
      } catch (error) {
        // Criar estrutura básica se não existir
        dados = {
          name: 'Não identificado',
          telefone: chatId.replace('@c.us', ''),
          tags: [],
          listaNome: null,
        };
      }

      // Atualizar campos de agendamento
      dados.detalhes_agendamento = [{
        agendamento_identificado: true,
        tipo_agendamento: agendamento.tipo_agendamento,
        data_agendada: agendamento.data_hora_agendamento.split('T')[0].split('-').reverse().join('/'),
        horario_agendado: agendamento.data_hora_agendamento.split('T')[1].substring(0, 5),
        agendamento_notificado: [{
          chatid: false,
          TARGET_CHATID: false
        }]
      }];

      // Adicionar campos adicionais se não existirem
      if (!dados.agendamentos) {
        dados.agendamentos = [];
      }
      dados.agendamentos.push({
        id: agendamento.id_agendamento,
        tipo: agendamento.tipo_agendamento,
        data_hora: agendamento.data_hora_agendamento,
        status: agendamento.status_agendamento
      });

      // Salvar arquivo
      await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2), 'utf-8');
      logger.info(`[SistemaAgendamentos] Dados.json atualizado para ${chatId}`);

    } catch (error) {
      logger.error(`[SistemaAgendamentos] Erro ao atualizar Dados.json para ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Cria evento no Google Calendar
   */
  private async criarEventoCalendar(agendamento: AgendamentoCompleto, dadosLead: any): Promise<void> {
    try {
      // Verificar se existe configuração de calendar
      const infoPath = path.join(this.clientePath, 'config', 'infoCliente.json');
      const infoConfig = JSON.parse(await fs.readFile(infoPath, 'utf-8'));

      if (!infoConfig.google_calendar_id) {
        logger.debug(`[SistemaAgendamentos] Google Calendar não configurado, pulando criação de evento`);
        return;
      }

      // Preparar dados do evento
      const titulo = `${agendamento.tipo_agendamento.toUpperCase()} - ${agendamento.nome_lead} - ${agendamento.telefone}`;
      const descricao = `
Agendamento: ${agendamento.tipo_agendamento}
Cliente: ${agendamento.nome_lead}
Telefone: ${agendamento.telefone}
Status: ${agendamento.status_agendamento}

Resumo da conversa:
${agendamento.resumo_conversa}

Informações adicionais:
${dadosLead?.interesse ? `Interesse: ${dadosLead.interesse}` : ''}
${dadosLead?.leadScore ? `Lead Score: ${dadosLead.leadScore}/10` : ''}
${dadosLead?.etapaFunil ? `Etapa: ${dadosLead.etapaFunil}` : ''}
      `.trim();

      // Preparar dados para a API
      const eventData = {
        summary: titulo,
        description: descricao,
        start: {
          dateTime: agendamento.data_hora_agendamento,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: new Date(new Date(agendamento.data_hora_agendamento).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        location: dadosLead?.local || 'A confirmar',
        attendees: dadosLead?.email ? [{ email: dadosLead.email }] : [],
        reminders: {
          useDefault: true
        }
      };

      // Importar axios dinamicamente para fazer a chamada da API
      const axios = (await import('axios')).default;

      // Fazer chamada para a API do Google Calendar
      const response = await axios.post(
        `http://localhost:3000/api/google/calendar`,
        {
          action: 'create_event',
          calendarId: infoConfig.google_calendar_id,
          eventData
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.event) {
        logger.info(`[SistemaAgendamentos] ✅ Evento criado no Google Calendar:`);
        logger.info(`   Título: ${titulo}`);
        logger.info(`   Event ID: ${response.data.event.id}`);
        logger.info(`   Link: ${response.data.event.htmlLink}`);

        // Salvar referência do evento no agendamento
        agendamento.google_calendar_event_id = response.data.event.id;
        agendamento.google_calendar_link = response.data.event.htmlLink;

        // Atualizar agendamento no arquivo
        await this.atualizarAgendamentoComCalendar(agendamento);
      }

    } catch (error: any) {
      logger.error(`[SistemaAgendamentos] Erro ao criar evento no Calendar:`, error?.response?.data || error.message);
      // Não falhar o processo por causa do calendar
    }
  }

  /**
   * Carrega todos os agendamentos
   */
  async carregarAgendamentos(): Promise<AgendamentoCompleto[]> {
    try {
      const data = await fs.readFile(this.agendamentosFile, 'utf-8');
      const agendamentos = JSON.parse(data);
      return Array.isArray(agendamentos) ? agendamentos : [];
    } catch (error) {
      logger.warn(`[SistemaAgendamentos] Erro ao carregar agendamentos:`, error);
      return [];
    }
  }

  /**
   * Busca agendamentos por data
   */
  async buscarAgendamentosPorData(data: string): Promise<AgendamentoCompleto[]> {
    const agendamentos = await this.carregarAgendamentos();
    return agendamentos.filter(a =>
      a.data_hora_agendamento.startsWith(data) &&
      a.status_agendamento !== 'cancelado'
    );
  }

  /**
   * Atualiza status de um agendamento
   */
  async atualizarStatusAgendamento(idAgendamento: string, novoStatus: 'pendente' | 'confirmado' | 'cancelado'): Promise<boolean> {
    try {
      const agendamentos = await this.carregarAgendamentos();
      const agendamento = agendamentos.find(a => a.id_agendamento === idAgendamento);

      if (!agendamento) {
        return false;
      }

      agendamento.status_agendamento = novoStatus;
      agendamento.updated_at = new Date().toISOString();

      await fs.writeFile(this.agendamentosFile, JSON.stringify(agendamentos, null, 2), 'utf-8');
      logger.info(`[SistemaAgendamentos] Status atualizado: ${idAgendamento} -> ${novoStatus}`);
      return true;

    } catch (error) {
      logger.error(`[SistemaAgendamentos] Erro ao atualizar status:`, error);
      return false;
    }
  }

  /**
   * Atualiza agendamento com informações do Google Calendar
   */
  private async atualizarAgendamentoComCalendar(agendamento: AgendamentoCompleto): Promise<void> {
    try {
      const agendamentos = await this.carregarAgendamentos();
      const index = agendamentos.findIndex(a => a.id_agendamento === agendamento.id_agendamento);

      if (index !== -1) {
        agendamentos[index] = { ...agendamentos[index], ...agendamento, updated_at: new Date().toISOString() };
        await fs.writeFile(this.agendamentosFile, JSON.stringify(agendamentos, null, 2), 'utf-8');
        logger.info(`[SistemaAgendamentos] Agendamento atualizado com Calendar: ${agendamento.id_agendamento}`);
      }

    } catch (error) {
      logger.error(`[SistemaAgendamentos] Erro ao atualizar agendamento com Calendar:`, error);
    }
  }

  /**
   * Marca lembrete como enviado
   */
  async marcarLembreteEnviado(idAgendamento: string): Promise<boolean> {
    try {
      const agendamentos = await this.carregarAgendamentos();
      const agendamento = agendamentos.find(a => a.id_agendamento === idAgendamento);

      if (!agendamento) {
        return false;
      }

      agendamento.lembrete_enviado = true;
      agendamento.updated_at = new Date().toISOString();

      await fs.writeFile(this.agendamentosFile, JSON.stringify(agendamentos, null, 2), 'utf-8');
      logger.info(`[SistemaAgendamentos] Lembrete marcado como enviado: ${idAgendamento}`);
      return true;

    } catch (error) {
      logger.error(`[SistemaAgendamentos] Erro ao marcar lembrete:`, error);
      return false;
    }
  }
}