import { analisarIntencao } from './analiseIntencao.ts';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import path from 'node:path';
import { identificarAgendamento } from './identificarAgendamento.ts';
import { SistemaAgendamentos } from './sistemaAgendamentos.ts';
import { qualificarLead } from './qualificarLead.ts';
import { syncManager } from '../../database/sync.ts';



const logger = {
  info: (message: string, ...args: any[]) => console.log(`INFO: ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`WARN: ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`ERROR: ${message}`, ...args),
};

/**
 * Salva agendamento no arquivo agendamentos.json apenas se houver mudanças
 */
async function salvarAgendamentoSeNecessario(
  clientePath: string,
  chatId: string,
  detalhesAgendamento: any
): Promise<void> {
  try {
    const agendamentosPath = path.join(clientePath, 'config', 'agendamentos.json');
    let agendamentosRaw = '';

    try {
      agendamentosRaw = await fs.readFile(agendamentosPath, 'utf-8');
    } catch (error) {
      // Se arquivo não existir, cria estrutura básica
      agendamentosRaw = '[]';
    }

    const agendamentos = JSON.parse(agendamentosRaw);

    // Verifica se já existe agendamento para este chatId
    const agendamentoExistente = agendamentos.find((a: any) => a.chatId === chatId);

    if (agendamentoExistente) {
      // Verifica se há mudanças significativas no agendamento
      const dadosAgendamentoAtuais = agendamentoExistente.detalhes_agendamento?.[0];
      if (dadosAgendamentoAtuais &&
          dadosAgendamentoAtuais.data_agendada === detalhesAgendamento.data_agendada &&
          dadosAgendamentoAtuais.horario_agendado === detalhesAgendamento.horario_agendado) {
        logger.info(`[Monitoramento Conversa] Agendamento já existe e não há mudanças para ${chatId}`);
        return;
      }

      // Atualiza agendamento existente
      agendamentoExistente.detalhes_agendamento = [detalhesAgendamento];
      logger.info(`[Monitoramento Conversa] Agendamento atualizado para ${chatId}`);
    } else {
      // Adiciona novo agendamento
      agendamentos.push({
        chatId,
        detalhes_agendamento: [detalhesAgendamento]
      });
      logger.info(`[Monitoramento Conversa] Novo agendamento adicionado para ${chatId}`);
    }

    await fs.writeFile(agendamentosPath, JSON.stringify(agendamentos, null, 2), 'utf-8');

  } catch (error) {
    logger.error(`[Monitoramento Conversa] Erro ao salvar agendamento para ${chatId}:`, error);
  }
}

export async function monitorarConversa(
  clientePath: string,
  chatId: string,
  listaNome: string | null,
  client: any
) {
  try {
    logger.info(`[Monitoramento Conversa] Iniciando monitoramento para ${chatId}`);

    // Carrega conversa
    const historicoPath = path.join(clientePath, 'Chats', 'Historico', chatId, `${chatId}.json`);
    let conversation = '';

    try {
      const rawConversation = await fs.readFile(historicoPath, 'utf-8');
      const messages = JSON.parse(rawConversation);
      if (Array.isArray(messages)) {
        conversation = messages.map((m: any) => `${m.type}: ${m.message}`).join('\n');
      }
    } catch (error) {
      logger.warn(`[Monitoramento Conversa] Não foi possível carregar conversa para ${chatId}`);
      return;
    }

    if (!conversation.trim()) {
      logger.warn(`[Monitoramento Conversa] Conversa vazia para ${chatId}`);
      return;
    }

    // Carrega configuração
    const infoPath = path.join(clientePath, 'config', 'infoCliente.json');
    let geminiKey = '';
    try {
      const infoConfig = JSON.parse(await fs.readFile(infoPath, 'utf-8'));
      geminiKey = infoConfig.GEMINI_KEY || '';
    } catch (error) {
      logger.error(`Erro ao ler infoCliente.json: ${error}`);
    }

    // Verifica intenção apenas para logging
    const intencao = await analisarIntencao(conversation, geminiKey, logger);
    if (!intencao) {
      logger.warn(`[Monitoramento Conversa] Não foi possível determinar intenção para ${chatId}`);
    }

    logger.info(`[Monitoramento Conversa] Intenção detectada: ${intencao} para ${chatId}`);

    // ===== NOVO SISTEMA: Usa SistemaAgendamentos para detectar e salvar agendamentos =====
    const sistemaAgendamentos = new SistemaAgendamentos(clientePath);
    const agendamentoSalvo = await sistemaAgendamentos.salvarAgendamentoCompleto(chatId, conversation, geminiKey);

    // Para compatibilidade, também chama a função antiga
    const agendamento = await identificarAgendamento(conversation, geminiKey, chatId, clientePath);

    // ===== NOVO: CHAMADA INTEGRADA DA QUALIFICAÇÃO DE LEADS =====
    logger.info(`[Monitoramento Conversa] 🔍 Iniciando qualificação de lead para ${chatId}`);

    try {
      // Carrega configuração completa
      const infoConfig = JSON.parse(await fs.readFile(infoPath, 'utf-8'));

      // Chama qualificarLead com cliente WhatsApp válido
      console.log(`[Monitoramento Conversa] 📞 Chamando qualificarLead com cliente WhatsApp válido`);
      const analise = await qualificarLead(conversation, infoConfig, clientePath, chatId, client);

      if (analise) {
        console.log(`[Monitoramento Conversa] ✅ Análise de lead concluída:`);
        console.log(`[Monitoramento Conversa]    - Nome: ${analise.nome || 'Não identificado'}`);
        console.log(`[Monitoramento Conversa]    - Score: ${analise.leadScore}/10`);
        console.log(`[Monitoramento Conversa]    - Qualificado: ${analise.isLeadQualificado}`);
        console.log(`[Monitoramento Conversa]    - Etapa: ${analise.etapaFunil}`);

        // Verifica se é um lead recém-qualificado
        const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
        let dadosAnteriores = null;

        try {
          if (fsSync.existsSync(dadosPath)) {
            const dadosRaw = fsSync.readFileSync(dadosPath, 'utf-8');
            dadosAnteriores = JSON.parse(dadosRaw);
          }
        } catch (error) {
          console.log(`[Monitoramento Conversa] Não foi possível carregar dados anteriores para ${chatId}`);
        }

        // Se foi recém-qualificado, loga isso
        if (analise.isLeadQualificado && (!dadosAnteriores || !dadosAnteriores.isLeadQualificado)) {
          console.log(`[Monitoramento Conversa] 🎯 LEAD RECÉM-QUALIFICADO DETECTADO!`);
          console.log(`[Monitoramento Conversa] 📊 Lead Score: ${analise.leadScore}/10`);
          console.log(`[Monitoramento Conversa] 🏆 Qualificado: ${analise.isLeadQualificado}`);
          console.log(`[Monitoramento Conversa] 📞 Cliente WhatsApp disponível para notificação`);

          // A notificação será enviada dentro do qualificarLead.ts com o cliente válido
        } else if (analise.isLeadQualificado && dadosAnteriores?.isLeadQualificado) {
          console.log(`[Monitoramento Conversa] 📋 Lead já estava qualificado anteriormente`);
        } else {
          console.log(`[Monitoramento Conversa] 📝 Lead analisado mas não qualificado`);
        }

        // Se precisar de atendimento humano, loga
        if (analise.precisaAtendimentoHumano) {
          console.log(`[Monitoramento Conversa] 🚨 ATENDIMENTO HUMANO NECESSÁRIO`);
          console.log(`[Monitoramento Conversa] 📋 Resumo: ${analise.resumoParaAtendente || 'N/A'}`);
        }
      } else {
        console.log(`[Monitoramento Conversa] ❌ qualificarLead retornou null`);
      }
    } catch (error) {
      console.error(`[Monitoramento Conversa] ❌ Erro na qualificação de lead:`, error);
      logger.error(`[Monitoramento Conversa] Erro na qualificação de lead para ${chatId}:`, error);
    }

    if (agendamento.data_agendada && agendamento.horario_agendado) {
      logger.info(`[Monitoramento Conversa] Agendamento detectado para ${chatId}: ${agendamento.data_agendada} às ${agendamento.horario_agendado}`);

      // Carrega dados atuais para comparação
      const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
      let dadosAtuais = {};

      try {
        const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
        dadosAtuais = JSON.parse(dadosRaw);
      } catch (error) {
        logger.info(`[Monitoramento Conversa] Criando novo arquivo Dados.json para ${chatId}`);
      }

      // Verifica se agendamento já existe
      const agendamentoExistente = (dadosAtuais as any).detalhes_agendamento?.[0];
      const haMudanca = !agendamentoExistente ||
        agendamentoExistente.data_agendada !== agendamento.data_agendada ||
        agendamentoExistente.horario_agendado !== agendamento.horario_agendado;

      if (haMudanca) {
        logger.info(`[Monitoramento Conversa] Novo agendamento detectado para ${chatId}`);

        const detalhesAgendamento = {
          agendamento_identificado: true,
          tipo_agendamento: conversation.toLowerCase().includes('visita') ? 'visita' : 'reunião',
          data_agendada: agendamento.data_agendada,
          horario_agendado: agendamento.horario_agendado,
          agendamento_notificado: [{ chatid: false, TARGET_CHATID: false }]
        };

        // 🔄 SALVAR NO SQLITE (sincronização automática) - monitoramento de conversa
        try {
          await syncManager.saveClientData(clientePath, {
            conversationMonitoring: {
              chatId: chatId,
              intent: intencao,
              schedulingDetected: agendamento.data_agendada ? true : false,
              leadQualified: false, // Será atualizado pela qualificação de lead
              humanAttentionNeeded: false // Será atualizado pela qualificação de lead
            }
          });
          console.log(`[monitoramentoConversa] Monitoramento salvo no SQLite para ${clientePath}`);
        } catch (sqliteError) {
          console.error(`[monitoramentoConversa] Erro ao salvar no SQLite:`, sqliteError);
          // Continua com o salvamento JSON mesmo se SQLite falhar
        }

        // Atualiza dados.json
        (dadosAtuais as any).detalhes_agendamento = [detalhesAgendamento];
        await fs.writeFile(dadosPath, JSON.stringify(dadosAtuais, null, 2), 'utf-8');

        // Salva no arquivo de agendamentos
        await salvarAgendamentoSeNecessario(clientePath, chatId, detalhesAgendamento);
    
        // Atualiza dados.json
        (dadosAtuais as any).detalhes_agendamento = [detalhesAgendamento];
        await fs.writeFile(dadosPath, JSON.stringify(dadosAtuais, null, 2), 'utf-8');
      }
    }

    logger.info(`[Monitoramento Conversa] Monitoramento concluído para ${chatId}`);

  } catch (error) {
    logger.error(`[Monitoramento Conversa] Erro ao monitorar conversa ${chatId}:`, error);
  }
}
