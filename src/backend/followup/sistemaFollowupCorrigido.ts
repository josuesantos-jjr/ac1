/**
 * Sistema de Follow-up Corrigido
 * Resolve problemas de duplicação e integração com agendamentos
 */

import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import path from 'node:path';
import { gerarMensagemFollowUp } from './gerarMensagemFollowUp.ts';
import { getFollowUpConfig } from './config.ts';
import { mainGoogleBG } from '../service/googleBG.ts';
import logger from '../util/logger.ts';
import { syncManager } from '../../database/sync.ts';

// Interface para estrutura de follow-up
interface FollowUpEntry {
  chatid: string;
  nivel_followup: number;
  data_ultimo_followup?: string;
  proximo_followup?: string;
}

/**
 * Corrige duplicação no arquivo followups.json
 * Remove entradas duplicadas mantendo apenas a de nível mais alto
 */
export async function corrigirDuplicacaoFollowup(clientePath: string): Promise<void> {
  try {
    logger.info(`[FollowUp Corrigido] Iniciando correção de duplicação em ${clientePath}`);

    const followupsPath = path.join(clientePath, 'config', 'followups.json');

    if (!fsSync.existsSync(followupsPath)) {
      logger.info(`[FollowUp Corrigido] Arquivo followups.json não encontrado, criando novo`);
      await fs.writeFile(followupsPath, '[]', 'utf-8');
      return;
    }

    const followupsRaw = await fs.readFile(followupsPath, 'utf-8');
    const followups: FollowUpEntry[] = JSON.parse(followupsRaw);

    if (!Array.isArray(followups)) {
      logger.warn(`[FollowUp Corrigido] Dados inválidos no followups.json, resetando`);
      await fs.writeFile(followupsPath, '[]', 'utf-8');
      return;
    }

    // Remove duplicatas mantendo o nível mais alto para cada chatid
    const followupsUnicos = new Map<string, FollowUpEntry>();

    for (const followup of followups) {
      const chatid = followup.chatid;

      if (followupsUnicos.has(chatid)) {
        // Se já existe, mantém apenas o de nível mais alto
        const existente = followupsUnicos.get(chatid)!;
        if (followup.nivel_followup > existente.nivel_followup) {
          followupsUnicos.set(chatid, followup);
        }
      } else {
        followupsUnicos.set(chatid, followup);
      }
    }

    const followupsCorrigidos = Array.from(followupsUnicos.values());

    await fs.writeFile(followupsPath, JSON.stringify(followupsCorrigidos, null, 2), 'utf-8');

    // 🔄 SALVAR NO SQLITE (sincronização automática)
    // clientId já é apenas o nome da pasta (ex: "CMW"), não precisa extrair do caminho
    const clientId = clientePath.split(/[\\/]/).pop() || 'default';
    try {
      await syncManager.saveClientData(clientId, {
        followups: followupsCorrigidos
      });
      console.log(`[Sistema Followup Corrigido] Followups corrigidos salvos no SQLite para ${clientId}`);
    } catch (sqliteError) {
      console.error(`[Sistema Followup Corrigido] Erro ao salvar no SQLite:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    logger.info(`[FollowUp Corrigido] Corrigidos ${followups.length - followupsCorrigidos.length} duplicatas`);

  } catch (error) {
    logger.error(`[FollowUp Corrigido] Erro ao corrigir duplicação:`, error);
  }
}

/**
 * Adiciona ou atualiza follow-up apenas se não existir
 */
export async function adicionarOuAtualizarFollowup(
  clientePath: string,
  chatId: string,
  nivel: number = 1
): Promise<boolean> {
  try {
    const followupsPath = path.join(clientePath, 'config', 'followups.json');
    let followups: FollowUpEntry[] = [];

    // Carrega followups existentes
    if (fsSync.existsSync(followupsPath)) {
      const followupsRaw = await fs.readFile(followupsPath, 'utf-8');
      followups = JSON.parse(followupsRaw);
    }

    // Verifica se já existe entrada para este chatid
    const followupExistente = followups.find(f => f.chatid === chatId);

    if (followupExistente) {
      // Só atualiza se o novo nível for maior
      if (nivel > followupExistente.nivel_followup) {
        followupExistente.nivel_followup = nivel;
        followupExistente.data_ultimo_followup = new Date().toISOString();

        logger.info(`[FollowUp Corrigido] Nível atualizado para ${chatId}: ${nivel}`);
      } else {
        logger.info(`[FollowUp Corrigido] Nível ${nivel} ignorado para ${chatId} (atual: ${followupExistente.nivel_followup})`);
      }
    } else {
      // Cria nova entrada
      const novoFollowup: FollowUpEntry = {
        chatid: chatId,
        nivel_followup: nivel,
        data_ultimo_followup: new Date().toISOString()
      };

      followups.push(novoFollowup);
      logger.info(`[FollowUp Corrigido] Novo follow-up criado para ${chatId}: nível ${nivel}`);
    }

    // 🔄 SALVAR NO SQLITE (sincronização automática)
    // clientId já é apenas o nome da pasta (ex: "CMW"), não precisa extrair do caminho
    const clientId = clientePath.split(/[\\/]/).pop() || 'default';
    try {
      await syncManager.saveClientData(clientId, {
        followups: followups
      });
      console.log(`[Sistema Followup Corrigido] Followups salvos no SQLite para ${clientId}`);
    } catch (sqliteError) {
      console.error(`[Sistema Followup Corrigido] Erro ao salvar no SQLite:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    // 📄 SALVAR NO JSON (manter funcionalidade original)
    await fs.writeFile(followupsPath, JSON.stringify(followups, null, 2), 'utf-8');
    return true;

  } catch (error) {
    logger.error(`[FollowUp Corrigido] Erro ao adicionar follow-up para ${chatId}:`, error);
    return false;
  }
}

/**
 * Verifica se deve iniciar follow-up considerando agendamentos
 */
export async function verificarInicioFollowup(
  clientePath: string,
  chatId: string,
  dadosLead: any
): Promise<boolean> {
  try {
    // Verifica se há agendamento ativo
    const temAgendamentoAtivo = await verificarAgendamentoAtivo(clientePath, chatId);

    if (temAgendamentoAtivo) {
      logger.info(`[FollowUp Corrigido] ${chatId} tem agendamento ativo, follow-up pausado`);
      return false;
    }

    // Verifica se já passou a data do agendamento (se houve agendamento)
    const agendamentoExpirado = await verificarAgendamentoExpirado(clientePath, chatId);

    if (agendamentoExpirado) {
      logger.info(`[FollowUp Corrigido] Agendamento expirado para ${chatId}, iniciando follow-up`);
      return true;
    }

    // Se não tem agendamento, pode iniciar follow-up normalmente
    logger.info(`[FollowUp Corrigido] Iniciando follow-up normal para ${chatId}`);
    return true;

  } catch (error) {
    logger.error(`[FollowUp Corrigido] Erro ao verificar início de follow-up para ${chatId}:`, error);
    return false;
  }
}

/**
 * Verifica se há agendamento ativo para o chat
 */
async function verificarAgendamentoAtivo(clientePath: string, chatId: string): Promise<boolean> {
  try {
    // Verifica no dados.json do chat
    const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');

    if (!fsSync.existsSync(dadosPath)) {
      return false;
    }

    const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
    const dados = JSON.parse(dadosRaw);

    const agendamento = dados.detalhes_agendamento?.[0];

    if (!agendamento || !agendamento.agendamento_identificado) {
      return false;
    }

    const dataAgendada = agendamento.data_agendada;
    if (!dataAgendada) {
      return false;
    }

    // Verifica se a data do agendamento é futura
    const hoje = new Date();
    const dataAgendamento = new Date(dataAgendada);

    return dataAgendamento > hoje;

  } catch (error) {
    logger.error(`[FollowUp Corrigido] Erro ao verificar agendamento ativo para ${chatId}:`, error);
    return false;
  }
}

/**
 * Verifica se agendamento já passou (expirou)
 */
async function verificarAgendamentoExpirado(clientePath: string, chatId: string): Promise<boolean> {
  try {
    // Verifica no dados.json do chat
    const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');

    if (!fsSync.existsSync(dadosPath)) {
      return false;
    }

    const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
    const dados = JSON.parse(dadosRaw);

    const agendamento = dados.detalhes_agendamento?.[0];

    if (!agendamento || !agendamento.agendamento_identificado) {
      return false;
    }

    const dataAgendada = agendamento.data_agendada;
    if (!dataAgendada) {
      return false;
    }

    // Verifica se a data do agendamento já passou
    const hoje = new Date();
    const dataAgendamento = new Date(dataAgendada);

    return dataAgendamento < hoje;

  } catch (error) {
    logger.error(`[FollowUp Corrigido] Erro ao verificar agendamento expirado para ${chatId}:`, error);
    return false;
  }
}

/**
 * Gera e envia mensagem de follow-up usando prompt correto do config
 */
export async function enviarFollowupPersonalizado(
  clientePath: string,
  clienteId: string,
  chatId: string,
  nivel: number,
  conversationHistory: string
): Promise<boolean> {
  try {
    logger.info(`[FollowUp Corrigido] Gerando mensagem personalizada para ${chatId} (nível ${nivel})`);

    // Carrega configuração de follow-up
    const config = await getFollowUpConfig(clientePath);

    if (!config.ativo) {
      logger.info(`[FollowUp Corrigido] Follow-up desativado para ${clienteId}`);
      return false;
    }

    // Obtém o prompt correto baseado no nível
    let promptBase = '';

    if (config.promptGeral && config.prompt) {
      promptBase = config.prompt;
    } else if (config.promptsPorNivel && config.promptsPorNivel[nivel - 1]) {
      promptBase = config.promptsPorNivel[nivel - 1];
    } else {
      logger.warn(`[FollowUp Corrigido] Prompt não encontrado para nível ${nivel}, usando mensagem genérica`);
      promptBase = "Reative a conversa com uma mensagem curta e dinamica, se houver dados para personalizar a mensagem pode utilizar. Mas instigue o cliente a continuar conversando";
    }

    if (!promptBase) {
      logger.warn(`[FollowUp Corrigido] Prompt vazio para nível ${nivel}`);
      return false;
    }

    // Constrói prompt completo com contexto
    const promptCompleto = `${promptBase}\n\nContexto da conversa anterior:\n${conversationHistory}\n\nDados do lead disponíveis para personalização:\n${JSON.stringify(await carregarDadosLead(clientePath, chatId), null, 2)}\n\nInstrução: Gere APENAS a mensagem de follow-up.`;

    // Gera mensagem usando GoogleBG
    const mensagem = await mainGoogleBG({
      currentMessageBG: promptCompleto,
      chatId: chatId,
      clearHistory: true,
      __dirname: clientePath,
    });

    if (!mensagem || mensagem.trim() === '') {
      logger.warn(`[FollowUp Corrigido] Mensagem vazia gerada para ${chatId}`);
      return false;
    }

    logger.info(`[FollowUp Corrigido] Mensagem gerada para ${chatId}: ${mensagem.substring(0, 100)}...`);

    // TODO: Integrar com cliente WhatsApp para envio real
    // Por enquanto, apenas salva no histórico

    // Salva mensagem no histórico do chat
    await salvarMensagemNoHistorico(clientePath, chatId, mensagem, 'IA');

    // Atualiza dados do follow-up
    await atualizarDadosFollowup(clientePath, chatId, nivel);

    return true;

  } catch (error) {
    logger.error(`[FollowUp Corrigido] Erro ao enviar follow-up para ${chatId}:`, error);
    return false;
  }
}

/**
 * Carrega dados do lead para contexto
 */
async function carregarDadosLead(clientePath: string, chatId: string): Promise<any> {
  try {
    const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
    const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
    return JSON.parse(dadosRaw);
  } catch (error) {
    return {};
  }
}

/**
 * Salva mensagem no histórico do chat
 */
async function salvarMensagemNoHistorico(
  clientePath: string,
  chatId: string,
  mensagem: string,
  tipo: 'User' | 'IA'
): Promise<void> {
  try {
    const historicoPath = path.join(clientePath, 'Chats', 'Historico', chatId, `${chatId}.json`);

    let mensagens = [];
    if (fsSync.existsSync(historicoPath)) {
      const historicoRaw = await fs.readFile(historicoPath, 'utf-8');
      mensagens = JSON.parse(historicoRaw);
    }

    const novaMensagem = {
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      type: tipo,
      message: mensagem
    };

    mensagens.push(novaMensagem);

    await fs.writeFile(historicoPath, JSON.stringify(mensagens, null, 2), 'utf-8');

  } catch (error) {
    logger.error(`[FollowUp Corrigido] Erro ao salvar mensagem no histórico para ${chatId}:`, error);
  }
}

/**
 * Atualiza dados do follow-up após envio
 */
async function atualizarDadosFollowup(
  clientePath: string,
  chatId: string,
  nivel: number
): Promise<void> {
  try {
    const followupsPath = path.join(clientePath, 'config', 'followups.json');
    const followupsRaw = await fs.readFile(followupsPath, 'utf-8');
    const followups = JSON.parse(followupsRaw);

    const followup = followups.find((f: any) => f.chatid === chatId);
    if (followup) {
      followup.nivel_followup = nivel + 1; // Próximo nível
      followup.data_ultimo_followup = new Date().toISOString();

      // 🔄 SALVAR NO SQLITE (sincronização automática)
      // clientId já é apenas o nome da pasta (ex: "CMW"), não precisa extrair do caminho
      const clientId = clientePath.split(/[\\/]/).pop() || 'default';
      try {
        await syncManager.saveClientData(clientId, {
          followups: followups
        });
        console.log(`[Sistema Followup Corrigido] Followups atualizados salvos no SQLite para ${clientId}`);
      } catch (sqliteError) {
        console.error(`[Sistema Followup Corrigido] Erro ao salvar no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // 📄 SALVAR NO JSON (manter funcionalidade original)
      await fs.writeFile(followupsPath, JSON.stringify(followups, null, 2), 'utf-8');
    }

  } catch (error) {
    logger.error(`[FollowUp Corrigido] Erro ao atualizar dados do follow-up para ${chatId}:`, error);
  }
}