/**
 * Sistema de lembretes automáticos para agendamentos
 * Verifica diariamente agendamentos e envia lembretes personalizados
 */

import * as fs from 'node:fs/promises';
import path from 'node:path';
import { format, isSameDay, parseISO } from 'date-fns';
import { mainGoogleBG } from '../service/googleBG.ts';
import logger from '../util/logger.ts';
import { syncManager } from '../../database/sync.ts';

// Interface para agendamento
interface Agendamento {
  chatId: string;
  detalhes_agendamento: Array<{
    agendamento_identificado: boolean;
    tipo_agendamento: "visita" | "reunião" | null;
    data_agendada: string | null;
    horario_agendado: string | null;
    agendamento_notificado: Array<{
      chatid: boolean;
      TARGET_CHATID: boolean;
    }>;
  }>;
}

/**
 * Verifica agendamentos do dia atual e envia lembretes
 */
export async function verificarEEnviarLembretes(clientePath: string, clienteId: string, client?: any): Promise<void> {
  logger.info(`[Lembretes] Iniciando verificação de lembretes para ${clienteId}`);

  try {
    // Carrega agendamentos
    const agendamentos = await carregarAgendamentos(clientePath);

    if (!agendamentos || agendamentos.length === 0) {
      logger.info(`[Lembretes] Nenhum agendamento encontrado para ${clienteId}`);
      return;
    }

    const hoje = new Date();
    const agendamentosHoje = agendamentos.filter(agendamento => {
      const dataAgendada = agendamento.detalhes_agendamento?.[0]?.data_agendada;
      return dataAgendada && isSameDay(parseISO(dataAgendada), hoje);
    });

    if (agendamentosHoje.length === 0) {
      logger.info(`[Lembretes] Nenhum agendamento para hoje em ${clienteId}`);
      return;
    }

    logger.info(`[Lembretes] Encontrados ${agendamentosHoje.length} agendamentos para hoje`);

    // Para cada agendamento de hoje, envia lembretes
    for (const agendamento of agendamentosHoje) {
      await enviarLembretesParaAgendamento(clientePath, clienteId, agendamento);
    }

  } catch (error) {
    logger.error(`[Lembretes] Erro ao verificar lembretes para ${clienteId}:`, error);
  }
}

/**
 * Carrega agendamentos do arquivo JSON
 */
async function carregarAgendamentos(clientePath: string): Promise<Agendamento[]> {
  try {
    const agendamentosPath = path.join(clientePath, 'config', 'agendamentos.json');
    const agendamentosRaw = await fs.readFile(agendamentosPath, 'utf-8');
    const agendamentos = JSON.parse(agendamentosRaw);

    return Array.isArray(agendamentos) ? agendamentos : [];
  } catch (error) {
    logger.warn(`[Lembretes] Erro ao carregar agendamentos:`, error);
    return [];
  }
}

/**
 * Envia lembretes para um agendamento específico
 */
async function enviarLembretesParaAgendamento(
   clientePath: string,
   clienteId: string,
   agendamento: Agendamento,
   client?: any
 ): Promise<void> {
  const chatId = agendamento.chatId;
  const detalhes = agendamento.detalhes_agendamento?.[0];

  if (!detalhes || !detalhes.data_agendada || !detalhes.horario_agendado) {
    return;
  }

  // Verifica se já foi notificado hoje
  const jaNotificadoChatId = detalhes.agendamento_notificado?.[0]?.chatid || false;
  const jaNotificadoTarget = detalhes.agendamento_notificado?.[0]?.TARGET_CHATID || false;

  logger.info(`[Lembretes] Processando agendamento para ${chatId}: ${detalhes.data_agendada} às ${detalhes.horario_agendado}`);

  try {
    // Carrega dados do lead para personalização
    const dadosLead = await carregarDadosLead(clientePath, chatId);

    // Gera lembretes personalizados
    const lembreteParaChatId = await gerarLembretePersonalizado(
      'chatid',
      dadosLead,
      detalhes,
      clientePath,
      chatId
    );

    const lembreteParaTarget = await gerarLembretePersonalizado(
      'target_chatid',
      dadosLead,
      detalhes,
      clientePath,
      chatId
    );

     // ===== ENVIO REAL DOS LEMBRETES VIA WHATSAPP =====
     if (client) {
       try {
         if (lembreteParaChatId) {
           await client.sendText(chatId, lembreteParaChatId);
           logger.info(`[Lembretes] ✅ Lembrete enviado para cliente ${chatId}`);
         } else {
           logger.warn(`[Lembretes] ⚠️ Nenhum lembrete gerado para ${chatId}`);
         }

         // Carrega TARGET_CHAT_ID da configuração
         const infoConfig = JSON.parse(
           await fs.readFile(path.join(clientePath, 'config', 'infoCliente.json'), 'utf-8')
         );
         const targetChatId = infoConfig.TARGET_CHAT_ID || '';

         if (lembreteParaTarget && targetChatId) {
           await client.sendText(targetChatId, lembreteParaTarget);
           logger.info(`[Lembretes] ✅ Lembrete enviado para equipe ${targetChatId}`);
         } else if (lembreteParaTarget && !targetChatId) {
           logger.warn(`[Lembretes] ⚠️ TARGET_CHAT_ID não configurado para lembretes da equipe`);
         }
       } catch (error) {
         logger.error(`[Lembretes] ❌ Erro ao enviar lembretes via WhatsApp para ${chatId}:`, error);
         throw error; // Re-throw para ser capturado pelo sistema de notificações
       }
     } else {
       // Fallback para modo sem cliente (apenas logging)
       logger.info(`[Lembretes] 📝 Cliente WhatsApp não disponível, apenas logging:`);
       logger.info(`[Lembretes] Lembrete para ${chatId}: ${lembreteParaChatId?.substring(0, 100)}...`);
       if (lembreteParaTarget) {
         logger.info(`[Lembretes] Lembrete para target: ${lembreteParaTarget.substring(0, 100)}...`);
       }
     }

    // Marca como notificado
    await marcarComoNotificado(clientePath, chatId);

  } catch (error) {
    logger.error(`[Lembretes] Erro ao processar lembretes para ${chatId}:`, error);
  }
}

/**
 * Carrega dados do lead para personalização
 */
async function carregarDadosLead(clientePath: string, chatId: string): Promise<any> {
  try {
    const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
    const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
    return JSON.parse(dadosRaw);
  } catch (error) {
    logger.warn(`[Lembretes] Dados do lead não encontrados para ${chatId}`);
    return {};
  }
}

/**
 * Gera mensagem de lembrete personalizada usando IA
 */
async function gerarLembretePersonalizado(
  tipo: 'chatid' | 'target_chatid',
  dadosLead: any,
  detalhesAgendamento: any,
  clientePath: string,
  chatId: string
): Promise<string | null> {
  try {
    // Carrega configuração do cliente
    const infoConfig = JSON.parse(
      await fs.readFile(path.join(clientePath, 'config', 'infoCliente.json'), 'utf-8')
    );

    const targetChatId = infoConfig.TARGET_CHAT_ID || '';

    if (tipo === 'target_chatid' && !targetChatId) {
      logger.warn(`[Lembretes] TARGET_CHAT_ID não configurado`);
      return null;
    }

    // Constrói prompt baseado no tipo
    let prompt = '';

    if (tipo === 'chatid') {
      prompt = `Você é um assistente de vendas lembrando o cliente sobre um agendamento.

Dados do agendamento:
- Data: ${detalhesAgendamento.data_agendada}
- Horário: ${detalhesAgendamento.horario_agendado}
- Tipo: ${detalhesAgendamento.tipo_agendamento || 'reunião'}

Dados do lead:
- Nome: ${dadosLead.nome || 'Cliente'}
- Interesse: ${dadosLead.interesse || 'Não informado'}

Histórico da conversa recente:
${await carregarHistoricoRecente(clientePath, chatId)}

Escreva uma mensagem curta e amigável lembrando o cliente do agendamento de hoje. Seja pessoal e mencione o nome se disponível.`;
    } else {
      prompt = `Você é um assistente de vendas enviando notificação interna sobre agendamento.

Dados do agendamento:
- Data: ${detalhesAgendamento.data_agendada}
- Horário: ${detalhesAgendamento.horario_agendado}
- Tipo: ${detalhesAgendamento.tipo_agendamento || 'reunião'}
- ChatId do cliente: ${chatId}

Dados do lead:
- Nome: ${dadosLead.nome || 'Não identificado'}
- Telefone: ${dadosLead.telefone || dadosLead.number || 'Não informado'}
- Interesse: ${dadosLead.interesse || 'Não informado'}
- Lead Score: ${dadosLead.leadScore || 'N/A'}
- Etapa do Funil: ${dadosLead.etapaFunil || 'N/A'}
- Tags: ${dadosLead.tags?.join(', ') || 'Nenhuma'}

Resumo para atendente: ${dadosLead.resumoParaAtendente || 'Não disponível'}

Escreva uma notificação estruturada no formato:
"Não se esqueça do agendamento hoje!

*Dados do Lead*
Nome: ${dadosLead.nome || 'Não identificado'}
Telefone: ${dadosLead.telefone || dadosLead.number || 'Não informado'}
Tags: ${dadosLead.tags?.join(', ') || 'Nenhuma'}
Resumo: ${dadosLead.resumoParaAtendente || 'Não disponível'}

Insights e oportunidades baseados no perfil do lead... (gere insights relevantes)`;
    }

    // Usa GoogleBG para gerar mensagem personalizada
    const mensagem = await mainGoogleBG({
      currentMessageBG: prompt,
      chatId: tipo === 'chatid' ? chatId : targetChatId,
      clearHistory: true,
      __dirname: clientePath,
    });

    return mensagem || null;

  } catch (error) {
    logger.error(`[Lembretes] Erro ao gerar lembrete personalizado para ${tipo}:`, error);
    return null;
  }
}

/**
 * Carrega histórico recente da conversa para contexto
 */
async function carregarHistoricoRecente(clientePath: string, chatId: string): Promise<string> {
  try {
    const historicoPath = path.join(clientePath, 'Chats', 'Historico', chatId, `${chatId}.json`);
    const historicoRaw = await fs.readFile(historicoPath, 'utf-8');
    const mensagens = JSON.parse(historicoRaw);

    if (Array.isArray(mensagens)) {
      // Pega as últimas 5 mensagens para contexto
      const ultimasMensagens = mensagens.slice(-5);
      return ultimasMensagens.map((m: any) => `${m.type}: ${m.message}`).join('\n');
    }

    return '';
  } catch (error) {
    return '';
  }
}

/**
 * Marca agendamento como notificado
 */
async function marcarComoNotificado(clientePath: string, chatId: string): Promise<void> {
  try {
    const agendamentosPath = path.join(clientePath, 'config', 'agendamentos.json');
    const agendamentosRaw = await fs.readFile(agendamentosPath, 'utf-8');
    const agendamentos = JSON.parse(agendamentosRaw);

    const agendamento = agendamentos.find((a: any) => a.chatId === chatId);
    if (agendamento && agendamento.detalhes_agendamento?.[0]) {
      if (!agendamento.detalhes_agendamento[0].agendamento_notificado) {
        agendamento.detalhes_agendamento[0].agendamento_notificado = [];
      }

      agendamento.detalhes_agendamento[0].agendamento_notificado[0] = {
        chatid: true,
        TARGET_CHATID: true
      };

      // 🔄 SALVAR NO SQLITE (sincronização automática)
      // clientId já é apenas o nome da pasta (ex: "CMW"), não precisa extrair do caminho
      const clientId = clientePath.split(/[\\/]/).pop() || 'default';
      try {
        await syncManager.saveClientData(clientId, {
          agendamentos: agendamentos
        });
        console.log(`[Sistema Lembretes] Agendamentos salvos no SQLite para ${clientId}`);
      } catch (sqliteError) {
        console.error(`[Sistema Lembretes] Erro ao salvar no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // 📄 SALVAR NO JSON (manter funcionalidade original)
      await fs.writeFile(agendamentosPath, JSON.stringify(agendamentos, null, 2), 'utf-8');
      logger.info(`[Lembretes] Agendamento marcado como notificado para ${chatId}`);
    }

  } catch (error) {
    logger.error(`[Lembretes] Erro ao marcar notificação para ${chatId}:`, error);
  }
}