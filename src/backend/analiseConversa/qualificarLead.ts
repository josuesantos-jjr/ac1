// Interfaces adicionais para gerenciamento de leads
interface Contato {
  id: string;
  telefone: string;
  nome: string;
  clientId: string;
}
// src/backend/analiseConversa/qualificarLead.ts
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import logger from '../util/logger.ts'; // Supondo um logger central
import { detectarMudancasSignificativas, compararDetalhesAgendamento } from './comparadores.ts';
import { mainGoogleBG } from '../service/googleBG.ts';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import path from 'node:path';
import { syncManager } from '../../database/sync.ts';

// Interface para definir a estrutura da resposta da IA
export interface AnaliseLead {
  nome: string | null;
  interesse: string | null;
  leadScore: number;
  etapaFunil: string | null;
  isLeadQualificado: boolean;
  detalhes_agendamento: Array<{
    agendamento_identificado: boolean;
    tipo_agendamento: "visita" | "reunião" | null;
    data_agendada: string | null; // Formato "YYYY-MM-DD",
    horario_agendado: string | null; // Formato "HH:MM",
    agendamento_notificado: Array<{
      chatid: boolean;
      TARGET_CHATID: boolean;
    }>
  }>;
  resumoParaAtendente: string | null;
  precisaAtendimentoHumano: boolean;
  tags: string[];
}


/**
 * Constrói o prompt completo com contexto do cliente para análise com IA
 */
function construirPromptComContexto(
  promptTemplate: string,
  objetivo: string,
  funilVendas: string,
  produtosServicos: string,
  conversationHistory: string
): string {
  // Extrai apenas a parte dos produtos/serviços (remove informações desnecessárias)
  const produtosLimpos = produtosServicos
    .replace(/\*\*\* [^*\n]+(\n|\r\n)/g, '') // Remove cabeçalhos ***
    .replace(/\n{3,}/g, '\n\n') // Limita quebras de linha
    .replace(/\n\s*\n/g, '\n') // Remove linhas vazias extras
    .trim();

  return promptTemplate
    .replace('{funnel_steps}', funilVendas)
    .replace('{conversation_history}', conversationHistory)
    .replace('{objetivo}', objetivo)
    .replace('{produtos_servicos}', produtosLimpos);
}

/**
 * Carrega dados atuais do chat para comparação
 */
async function carregarDadosAtuais(clientePath: string, chatId: string): Promise<Partial<AnaliseLead>> {
  try {
    const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
    const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
    return JSON.parse(dadosRaw);
  } catch (error) {
    logger.info(`[Qualificar Lead] Dados atuais não encontrados para ${chatId}, usando dados vazios`);
    return {};
  }
}

/**
 * Verifica se precisa de atendimento humano baseado em critérios inteligentes
 */
function analisarNecessidadeAtendimentoHumano(analise: AnaliseLead, conversationHistory: string): boolean {
  // Critério 1: Se está há muito tempo na mesma etapa sem progresso
  if (analise.etapaFunil === 'Acolhimento' && analise.leadScore <= 3) {
    return true; // Não consegue sair da acolhimento
  }

  // Critério 2: Se tem lead score baixo mas conversa está avançada
  const numeroMensagens = conversationHistory.split('\n').length;
  if (numeroMensagens > 10 && analise.leadScore < 5) {
    return true; // Muitas mensagens mas pouco progresso
  }

  // Critério 3: Se não consegue identificar informações básicas
  if (!analise.nome && numeroMensagens > 5) {
    return true; // Não consegue extrair nem o nome após várias mensagens
  }

  // Critério 4: Se está repetindo as mesmas informações
  const palavrasRepetidas = conversationHistory.toLowerCase().includes('não entendi') ||
                           conversationHistory.toLowerCase().includes('repita') ||
                           conversationHistory.toLowerCase().includes('fale novamente');
  if (palavrasRepetidas && analise.leadScore < 6) {
    return true; // Cliente pedindo para repetir e pouco progresso
  }

  // Critério 5: Se lead score está caindo
  // (Isso seria detectado pela comparação granular)

  return false; // Não precisa de atendimento humano
}

/**
 * Verifica se já passou o tempo mínimo para nova notificação de atendimento humano
 */
async function podeNotificarAtendimentoHumano(clientePath: string, chatId: string): Promise<boolean> {
  try {
    const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
    const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
    const dados = JSON.parse(dadosRaw);

    const ultimaNotificacao = dados.ultima_notificacao_atendimento_humano;
    if (!ultimaNotificacao) {
      return true; // Nunca notificou, pode notificar
    }

    const tempoPassado = Date.now() - new Date(ultimaNotificacao).getTime();
    const tempoMinimo = 15 * 60 * 1000; // 15 minutos em milissegundos

    return tempoPassado >= tempoMinimo;

  } catch (error) {
    logger.info(`[Atendimento Humano] Erro ao verificar tempo de notificação para ${chatId}`);
    return true; // Em caso de erro, permite notificação
  }
}

/**
 * Salva análise no arquivo dados.json sempre
 */
async function salvarAnalise(
  clientePath: string,
  chatId: string,
  analiseNova: AnaliseLead,
  conversationHistory: string,
  infoConfig: any,
  client?: any
): Promise<boolean> {
  try {
    const dadosAtuais = await carregarDadosAtuais(clientePath, chatId);
    logger.info(`[Qualificar Lead] 💾 Salvando análise sempre para ${chatId}`);

    // Carrega dados existentes ou cria estrutura básica
    let dadosCompletos = dadosAtuais;

    if (!dadosCompletos || Object.keys(dadosCompletos).length === 0) {
      dadosCompletos = {
        interesse: null,
        leadScore: 0,
        etapaFunil: null,
        isLeadQualificado: false,
        detalhes_agendamento: [{
          agendamento_identificado: false,
          tipo_agendamento: null,
          data_agendada: null,
          horario_agendado: null,
          agendamento_notificado: [
            { chatid: false, TARGET_CHATID: false }
          ]
        }],
        resumoParaAtendente: null,
        precisaAtendimentoHumano: false,
        tags: []
      };
    }

    // Analisa necessidade de atendimento humano com critérios inteligentes
    const necessidadeAtendimentoHumano = analisarNecessidadeAtendimentoHumano(analiseNova, conversationHistory);

    // Verifica se pode notificar atendimento humano (buffer de 15 minutos)
    const podeNotificar = await podeNotificarAtendimentoHumano(clientePath, chatId);

    // Define se precisa de atendimento humano
    let precisaAtendimentoHumanoFinal = analiseNova.precisaAtendimentoHumano;

    if (necessidadeAtendimentoHumano && podeNotificar) {
      precisaAtendimentoHumanoFinal = true;
      logger.info(`[Qualificar Lead] 🚨 ATENDIMENTO HUMANO NECESSÁRIO para ${chatId}`);
    } else if (necessidadeAtendimentoHumano && !podeNotificar) {
      logger.info(`[Qualificar Lead] ⚠️ Atendimento humano necessário mas buffer de 15min não passou para ${chatId}`);
    }

    // Mescla dados mantendo campos existentes e adicionando novos
    const dadosAtualizados = {
      ...dadosCompletos,
      ...analiseNova,
      precisaAtendimentoHumano: precisaAtendimentoHumanoFinal,
      // Garante que campos críticos sejam preservados
      data_ultima_analise: new Date().toISOString(),
      telefone: chatId.split('@')[0],
      // Salva timestamp da última notificação se foi marcado como necessário
      ...(precisaAtendimentoHumanoFinal && !analiseNova.precisaAtendimentoHumano ? {
        ultima_notificacao_atendimento_humano: new Date().toISOString()
      } : {})
    };

    // 🔄 SALVAR NO SQLITE (sincronização automática) - qualificação de lead
    try {
      await syncManager.saveClientData(clientePath, {
        leadQualification: {
          chatId: chatId,
          nome: dadosAtualizados.nome,
          interesse: dadosAtualizados.interesse,
          leadScore: dadosAtualizados.leadScore,
          etapaFunil: dadosAtualizados.etapaFunil,
          isLeadQualificado: dadosAtualizados.isLeadQualificado,
          tags: dadosAtualizados.tags,
          detalhes_agendamento: dadosAtualizados.detalhes_agendamento,
          precisaAtendimentoHumano: dadosAtualizados.precisaAtendimentoHumano
        }
      });
      console.log(`[qualificarLead] Qualificação de lead salva no SQLite para ${clientePath}`);
    } catch (sqliteError) {
      console.error(`[qualificarLead] Erro ao salvar no SQLite:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    // Salva no arquivo Dados.json
    const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
    await fs.writeFile(dadosPath, JSON.stringify(dadosAtualizados, null, 2), 'utf-8');

    logger.info(`[Qualificar Lead] ✅ DADOS SALVOS para ${chatId}:`);
    logger.info(`[Qualificar Lead] 📝 Nome: ${analiseNova.nome || 'Não identificado'}`);
    logger.info(`[Qualificar Lead] 🎯 Interesse: ${analiseNova.interesse || 'Não identificado'}`);
    logger.info(`[Qualificar Lead] 📊 Score: ${analiseNova.leadScore}/10`);
    logger.info(`[Qualificar Lead] 🏢 Etapa: ${analiseNova.etapaFunil || 'Não identificada'}`);
    logger.info(`[Qualificar Lead] ✅ Qualificado: ${analiseNova.isLeadQualificado}`);
    logger.info(`[Qualificar Lead] 🏷️ Tags: ${analiseNova.tags?.join(', ') || 'Nenhuma'}`);
    logger.info(`[Qualificar Lead] 📅 Agendamento: ${analiseNova.detalhes_agendamento?.[0]?.agendamento_identificado ? 'Sim' : 'Não'}`);
    logger.info(`[Qualificar Lead] 🚨 Atendimento Humano: ${precisaAtendimentoHumanoFinal}`);
    logger.info(`[Qualificar Lead] 📞 Telefone: ${chatId.split('@')[0]}`);
    logger.info(`[Qualificar Lead] 💾 Arquivo: ${dadosPath}`);

    // ===== NOVO FLUXO INTEGRADO =====
    // Se o lead foi qualificado, processa automaticamente
    if (analiseNova.isLeadQualificado === true) {
      logger.info(`[Qualificar Lead] 🚀 Iniciando processo integrado de identificação de lead para ${chatId}`);

      try {
        // 1. Criar/encontrar contato principal
        const { id: contatoId, isNovo: isNewContato } = await findOrCreateContatoPrincipal(
          chatId.split('@')[0],
          analiseNova.nome || 'Não identificado',
          infoConfig.CLIENTE || '',
          clientePath
        );

        if (!contatoId) {
          throw new Error("Falha ao obter ID do contato principal.");
        }
        logger.info(`[Qualificar Lead] Contato principal ${isNewContato ? 'criado' : 'encontrado'}: ${contatoId}`);

        // 2. Verificar se lead já existe
        const existingLead = await findLeadByChatId(infoConfig.CLIENTE || '', chatId, clientePath);

        if (existingLead) {
          logger.info(`[Qualificar Lead] Lead ${existingLead.id} já existe para chatId: ${chatId}`);
        } else {
          logger.info(`[Qualificar Lead] Criando novo lead para ${chatId}`);

          // 3. Preparar dados do lead
          const leadData = {
            chatId: chatId,
            nome: analiseNova.nome || 'Não identificado',
            telefone: chatId.split('@')[0],
            origem: 'Contato Direto',
            tags: analiseNova.tags || [],
          };

          // 4. Salvar no leads.json
          logger.info(`[Qualificar Lead] Salvando novo lead de contatoId: ${contatoId}`);
          const newLead = await saveLead(contatoId, leadData, clientePath, infoConfig);
          if (newLead) {
            logger.info(`[Qualificar Lead] ✅ Novo lead salvo com ID: ${newLead.id}`);

            // 5. Enviar notificação imediata
            console.log(`[Qualificar Lead] 🔔 Enviando notificação imediata para ${chatId}`);
            console.log(`[Qualificar Lead] 📱 Cliente WhatsApp disponível: ${client ? 'SIM' : 'NÃO'}`);

            if (client) {
              console.log(`[Qualificar Lead] ✅ Enviando notificação via cliente WhatsApp`);
              await notifyLeadIdentified(
                client, // Cliente WhatsApp válido
                infoConfig.CLIENTE || '',
                chatId,
                newLead.id,
                analiseNova.resumoParaAtendente || 'Nenhum resumo disponível',
                clientePath,
                infoConfig
              );
              console.log(`[Qualificar Lead] 🎉 Notificação enviada com sucesso!`);
            } else {
              console.log(`[Qualificar Lead] ⚠️ Cliente WhatsApp não disponível - notificação não enviada`);
            }
          } else {
            logger.error(`[Qualificar Lead] ❌ Falha ao salvar novo lead para chatId: ${chatId}`);
          }
        }
      } catch (error) {
        logger.error(`[Qualificar Lead] ❌ Erro no processo integrado de identificação de lead para ${chatId}:`, error);
      }
    }

    return true;

  } catch (error) {
    logger.error(`[Qualificar Lead] Erro ao salvar análise para ${chatId}:`, error);
    return false;
  }
}

/**
 * Analisa uma conversa para qualificar o lead usando IA com contexto completo
 * e salva apenas quando há mudanças significativas
 *
 * @param conversationHistory O histórico completo da conversa.
 * @param infoConfig O objeto de configuração do cliente (infoCliente.json).
 * @param clientePath Caminho base do cliente
 * @param chatId ID do chat para salvar dados
 * @returns Uma Promise com o objeto AnaliseLead ou null se a análise falhar.
 */
export async function qualificarLead(
  conversationHistory: string,
  infoConfig: any,
  clientePath: string,
  chatId: string,
  client?: any
): Promise<AnaliseLead | null> {
  try {
    logger.info(`[Qualificar Lead] Iniciando análise para ${chatId}`);

    // Verifica se temos configuração necessária para usar IA
    if (!infoConfig.GEMINI_KEY_BG || !infoConfig.QUALIFY_LEAD_PROMPT) {
      logger.warn('[Qualificar Lead] Configuração de IA ausente, usando análise local');
      return await analisarConversaLocal(conversationHistory, infoConfig);
    }

    // Constrói prompt com contexto completo
    const funilVendas = infoConfig.GEMINI_PROMPT?.[0]?.['Funil de vendas'];
    const funilString = Array.isArray(funilVendas) ? funilVendas.map((e: any) => e.nome).join(' -> ') : funilVendas || 'Acolhimento -> Qualificação -> Agendamento';
    const promptCompleto = construirPromptComContexto(
      infoConfig.QUALIFY_LEAD_PROMPT,
      infoConfig.GEMINI_PROMPT?.[0]?.['Objetivo'] || 'Analisar lead para qualificação',
      funilString,
      infoConfig.GEMINI_PROMPT?.[0]?.['Produtos ou Serviços'] || '',
      conversationHistory
    );

    try {
      // Usa o GoogleBG para análise com contexto
      const analiseIA = await analisarComIA(clientePath, chatId, conversationHistory, infoConfig);

      if (analiseIA) {
        // Sempre tenta salvar os dados da IA (ignora comparação para primeira análise)
        const dadosAtuais = await carregarDadosAtuais(clientePath, chatId);
        const haDadosAtuais = dadosAtuais && Object.keys(dadosAtuais).length > 0;

        // Sempre salva análise (comportamento modificado)
        console.log(`[Qualificar Lead] 💾 Sempre salvando análise para ${chatId}`);
        await salvarAnalise(clientePath, chatId, analiseIA, conversationHistory, infoConfig, client);

        return analiseIA;
      }
    } catch (apiError) {
      logger.warn('[Qualificar Lead] Erro na API, tentando análise local:', apiError);
    }

    // Fallback para análise local se IA falhar
    return await analisarConversaLocal(conversationHistory, infoConfig);

  } catch (error) {
    logger.error('[Qualificar Lead] Erro geral na análise:', error);
    return null;
  }
}

function analisarConversaLocal(conversationHistory: string, infoConfig: any): AnaliseLead {
  logger.info('[Qualificar Lead] Usando análise local - IA não disponível');

  // Quando IA não está disponível, retorna apenas valores seguros padrão
  // Não tenta extrair informações manualmente - deixa isso para a IA

  return {
    nome: null, // IA identifica quando disponível
    interesse: null, // IA identifica quando disponível
    leadScore: 1, // Score mínimo para indicar que foi processado
    etapaFunil: 'Acolhimento', // Etapa inicial padrão
    isLeadQualificado: false, // Não considera qualificado sem IA
    detalhes_agendamento: [{
      agendamento_identificado: false, // IA identifica quando disponível
      tipo_agendamento: null,
      data_agendada: null,
      horario_agendado: null,
      agendamento_notificado: [
        { chatid: false, TARGET_CHATID: false }
      ]
    }],
    resumoParaAtendente: 'Análise automática - IA não disponível no momento',
    precisaAtendimentoHumano: false,
    tags: ['analise-pendente'] // Tag indicando que precisa de análise manual
  };
}

async function analisarComIA(
  clientePath: string,
  chatId: string,
  conversationHistory: string,
  infoConfig: any
): Promise<AnaliseLead | null> {
  logger.info(`[Qualificar Lead] Iniciando análise com IA para ${chatId}`);

  const geminiKey = infoConfig.GEMINI_KEY_BG || infoConfig.GEMINI_KEY;
  const promptTemplate = infoConfig.QUALIFY_LEAD_PROMPT;
  const funilDeVendasRaw = infoConfig.GEMINI_PROMPT?.[0]?.['Funil de vendas'];
  const funilDeVendas = Array.isArray(funilDeVendasRaw) ? funilDeVendasRaw.map((e: any) => e.nome).join(' -> ') : funilDeVendasRaw || 'Acolhimento -> Qualificação -> Agendamento';
  const objetivo = infoConfig.GEMINI_PROMPT?.[0]?.['Objetivo'];
  const produtosServicos = infoConfig.GEMINI_PROMPT?.[0]?.['Produtos ou Serviços'];

  if (!geminiKey || !promptTemplate) {
    logger.error('[Qualificar Lead] Configuração de IA ausente.');
    return null;
  }

  // Constrói o prompt completo com contexto
  const promptCompleto = construirPromptCompleto(
    promptTemplate,
    objetivo,
    funilDeVendas,
    produtosServicos,
    conversationHistory
  );

  logger.info(`[Qualificar Lead] Prompt construído (${promptCompleto.length} caracteres)`);
  logger.info(`[Qualificar Lead] Enviando para GoogleBG: ${promptCompleto.substring(0, 150)}...`);

  try {
    // Usa GoogleBG ao invés de chamada direta
    const responseText = await mainGoogleBG({
      currentMessageBG: promptCompleto,
      chatId: chatId,
      clearHistory: true, // Resposta única sem histórico
      __dirname: clientePath,
    });

    if (!responseText) {
      logger.error('[Qualificar Lead] Resposta vazia do GoogleBG');
      return null;
    }

    // Limpa a resposta para garantir que seja um JSON válido
    const cleanedJson = responseText.replace(/^```json\s*|```$/g, '').trim();

    logger.info(`[Qualificar Lead] Resposta do GoogleBG (${cleanedJson.length} chars): ${cleanedJson.substring(0, 300)}...`);

    try {
      const analise = JSON.parse(cleanedJson) as AnaliseLead;

      // Validação da resposta
      if (typeof analise.leadScore !== 'number' || analise.leadScore < 0 || analise.leadScore > 10) {
        throw new Error(`leadScore inválido: ${analise.leadScore}`);
      }

      logger.info(`[Qualificar Lead] ✅ Análise IA bem-sucedida:`);
      logger.info(`[Qualificar Lead] Nome: ${analise.nome || 'Não identificado'}`);
      logger.info(`[Qualificar Lead] Interesse: ${analise.interesse || 'Não identificado'}`);
      logger.info(`[Qualificar Lead] LeadScore: ${analise.leadScore}/10`);
      logger.info(`[Qualificar Lead] Etapa: ${analise.etapaFunil || 'Não identificada'}`);
      logger.info(`[Qualificar Lead] Qualificado: ${analise.isLeadQualificado}`);
      logger.info(`[Qualificar Lead] Tags: ${analise.tags?.join(', ') || 'Nenhuma'}`);
      logger.info(`[Qualificar Lead] Agendamento: ${analise.detalhes_agendamento?.[0]?.agendamento_identificado ? 'Sim' : 'Não'}`);

      return analise;

    } catch (parseError) {
      logger.error(`[Qualificar Lead] ❌ Erro ao parsear JSON da IA: ${parseError}`);
      logger.error(`[Qualificar Lead] Resposta recebida: ${cleanedJson}`);
      throw parseError;
    }

  } catch (apiError) {
    logger.error(`[Qualificar Lead] ❌ Erro na API GoogleBG: ${apiError}`);
    throw apiError;
  }
}

/**
 * Constrói prompt completo com contexto do cliente
 */
function construirPromptCompleto(
  promptTemplate: string,
  objetivo: string,
  funilVendas: string,
  produtosServicos: string,
  conversationHistory: string
): string {
  // Extrai apenas a parte dos produtos/serviços (remove informações desnecessárias)
  const produtosLimpos = produtosServicos
    .replace(/\*\*\* [^*\n]+(\n|\r\n)/g, '') // Remove cabeçalhos ***
    .replace(/\n{3,}/g, '\n\n') // Limita quebras de linha
    .replace(/\n\s*\n/g, '\n') // Remove linhas vazias extras
    .trim();

  return promptTemplate
    .replace('{funnel_steps}', funilVendas || 'Acolhimento -> Qualificação -> Agendamento')
    .replace('{conversation_history}', conversationHistory)
    .replace('{objetivo}', objetivo || 'Analisar lead para qualificação')
    .replace('{produtos_servicos}', produtosLimpos);
}

// ===== FUNÇÕES DE GERENCIAMENTO DE LEADS =====

/**
 * Busca um lead existente pelo chatId
 */
async function findLeadByChatId(clientId: string, chatId: string, clientePath: string): Promise<any | undefined> {
  const filePath = path.join(clientePath, 'config', 'leads.json');
  if (fsSync.existsSync(filePath)) {
    const data = fsSync.readFileSync(filePath, 'utf-8');
    if (data && data.trim()) {
      try {
        const leads = JSON.parse(data);

        if (Array.isArray(leads) && leads.length > 0) {
          return leads.find((lead: any) => lead.chatId === chatId && lead.clientId === clientId);
        }
      } catch (error) {
        logger.error('Erro ao analisar o arquivo leads.json:', error);
        return undefined;
      }
    }
  } else {
    fsSync.writeFileSync(filePath, '[]', 'utf-8');
    logger.info(`Arquivo ${filePath} criado como array vazio.`);
    return undefined;
  }
  return undefined;
}

/**
 * Cria ou encontra contato principal
 */
async function findOrCreateContatoPrincipal(telefone: string, nome: string, clientId: string, clientePath: string): Promise<{ id: string; isNovo: boolean }> {
  const filePath = path.join(clientePath, 'config', 'contatos.json');
  let contatos: Contato[] = [];

  if (fsSync.existsSync(filePath)) {
    const data = fsSync.readFileSync(filePath, 'utf-8');
    if (data) {
      try {
        contatos = JSON.parse(data);
      } catch (error) {
        logger.error('Erro ao analisar o arquivo contatos.json, resetando arquivo:', error);
        contatos = [];
        fsSync.writeFileSync(filePath, JSON.stringify(contatos, null, 2), 'utf-8');
      }
    }
  } else {
    fsSync.writeFileSync(filePath, JSON.stringify(contatos, null, 2), 'utf-8');
    logger.info(`Arquivo ${filePath} criado.`);
  }

  let contato = contatos.find((c: any) => c.telefone === telefone);
  if (contato) {
    return { id: contato.id, isNovo: false };
  } else {
    const novoContato = { id: Math.random().toString(36).substring(2, 15), telefone, nome, clientId };
    contatos.push(novoContato);
    fsSync.writeFileSync(filePath, JSON.stringify(contatos, null, 2), 'utf-8');
    return { id: novoContato.id, isNovo: true };
  }
}

/**
 * Salva novo lead no arquivo leads.json
 */
async function saveLead(contatoId: string, leadData: any, clientePath: string, infoConfig: any): Promise<any | undefined> {
  const filePath = path.join(clientePath, 'config', 'leads.json');
  let leadsArray: any[] = [];

  try {
    if (fsSync.existsSync(filePath)) {
      const data = fsSync.readFileSync(filePath, 'utf-8');
      if (data && data.trim()) {
        const parsedData = JSON.parse(data);
        // Garante que seja sempre um array, não um objeto aninhado
        leadsArray = Array.isArray(parsedData) ? parsedData : [];
      }
    } else {
      // Cria arquivo vazio como array
      fsSync.writeFileSync(filePath, '[]', 'utf-8');
      logger.info(`Arquivo ${filePath} criado como array vazio.`);
    }
  } catch (error) {
    logger.error(`Erro ao ler ou analisar ${filePath}, criando array vazio.`, error);
    leadsArray = [];
  }

  const now = new Date();

  const newLead = {
    id: Math.random().toString(36).substring(2, 15),
    clientId: infoConfig.CLIENTE,
    contatoId,
    ...leadData,
    tipoLead: 'Novo Lead',
    timestampIdentificacao: now.toISOString(),
    dataGeracaoLead: now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    dataNotificacaoLead: null,
  };

  // Adiciona o novo lead ao array
  leadsArray.push(newLead);

  try {
    fsSync.writeFileSync(filePath, JSON.stringify(leadsArray, null, 2), 'utf-8');
    logger.info(`Novo lead salvo em ${filePath} com ID: ${newLead.id}`);
    return newLead;
  } catch (error) {
    logger.error(`Erro ao salvar o arquivo leads.json em ${filePath}:`, error);
    return undefined;
  }
}

/**
 * Notifica lead qualificado para o target_chatid
 */
async function notifyLeadIdentified(client: any, clientId: string, chatId: string, leadId: string, summary: string, clientePath: string, infoConfig: any) {
  console.log(`[notifyLeadIdentified] 🔍 Iniciando processo de notificação`);
  console.log(`[notifyLeadIdentified] 📱 Cliente disponível: ${client ? 'SIM' : 'NÃO'}`);
  console.log(`[notifyLeadIdentified] 📞 Chat ID: ${chatId}`);
  console.log(`[notifyLeadIdentified] 🆔 Lead ID: ${leadId}`);

  try {
    const TARGET_CHAT_ID = infoConfig.TARGET_CHAT_ID;
    console.log(`[notifyLeadIdentified] 🎯 TARGET_CHAT_ID: ${TARGET_CHAT_ID}`);

    if (TARGET_CHAT_ID) {
      const nomeClienteSimples = path.basename(clientePath);
      console.log(`[notifyLeadIdentified] 🏢 Nome cliente: ${nomeClienteSimples}`);

      const leadAtualizado = await findLeadByChatId(clientId, chatId, clientePath);
      console.log(`[notifyLeadIdentified] 🔍 Lead encontrado: ${leadAtualizado ? 'SIM' : 'NÃO'}`);

      const dadosFilePath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
      let dados = {};

      if (fsSync.existsSync(dadosFilePath)) {
        const dadosFileContent = fsSync.readFileSync(dadosFilePath, 'utf-8');
        dados = JSON.parse(dadosFileContent);
        console.log(`[notifyLeadIdentified] 📄 Dados carregados: ${Object.keys(dados as any).length} campos`);
      } else {
        console.log(`[notifyLeadIdentified] ⚠️ Arquivo Dados.json não encontrado`);
      }

      // Adiciona data de notificação ao lead
      const now = new Date();
      if (leadAtualizado) {
        leadAtualizado.dataNotificacaoLead = now.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        await updateLeadSummary(clientId, leadAtualizado.id, leadAtualizado.contatoId, summary, clientePath);
        console.log(`[notifyLeadIdentified] 📅 Data de notificação adicionada ao lead`);
      }

      const tipoLeadDisplay = leadAtualizado?.tipoLead || 'Novo Lead';
      const insights = gerarInsightsParaLead(leadAtualizado);

      const mensagemNotificacao = `🎯 *${tipoLeadDisplay} Identificado!* 🎯\n\n` +
        `*Cliente:* ${nomeClienteSimples}\n` +
        `*Nome:* ${leadAtualizado.name || 'Não identificado'}\n` +
        `*Telefone:* ${leadAtualizado?.telefone || chatId.split('@')[0]}\n` +
        `*Interesse:* ${(dados as any).interesse || 'Não especificado'}\n` +
        `*Lead Score:* ${(dados as any).leadScore || 'N/A'}/10\n` +
        `*Etapa do Funil:* ${(dados as any).etapaFunil || 'Não identificada'}\n` +
        `*Tags:* ${(dados as any).tags?.join(', ') || 'Nenhuma'}\n` +
        (leadAtualizado?.origem ? `*Origem:* ${leadAtualizado.origem}\n` : '') +
        `*Data de Identificação:* ${new Date(leadAtualizado?.timestampIdentificacao || Date.now()).toLocaleDateString('pt-BR')} ${new Date(leadAtualizado?.timestampIdentificacao || Date.now()).toLocaleTimeString('pt-BR')}\n\n` +
        `*📋 Resumo da Conversa:*\n${summary || 'Resumo não gerado.'}\n\n` +
        `*🎯 Insights para Abordagem:*\n${insights}`;

      console.log(`[notifyLeadIdentified] 📨 Enviando notificação para ${TARGET_CHAT_ID}`);
      console.log(`[notifyLeadIdentified] 📝 Tamanho da mensagem: ${mensagemNotificacao.length} caracteres`);

      await client.sendText(TARGET_CHAT_ID, mensagemNotificacao);
      console.log(`[notifyLeadIdentified] ✅ Notificação enviada com sucesso!`);
      logger.info(`Notificação de novo lead enviada com sucesso para ${chatId}`);
    } else {
      console.log(`[notifyLeadIdentified] ⚠️ TARGET_CHAT_ID não configurado`);
      logger.warn(`TARGET_CHAT_ID não configurado. Notificação de novo lead não enviada.`);
    }
  } catch (error) {
    console.error(`[notifyLeadIdentified] ❌ Erro ao notificar:`, error);
    logger.error(`Erro ao notificar novo lead para ${chatId}:`, error);
  }
}

/**
 * Atualiza o resumo do lead no arquivo leads.json
 */
async function updateLeadSummary(clientId: string, leadId: string, contatoId: string, summary: string, clientePath: string): Promise<boolean> {
  const filePath = path.join(clientePath, 'config', 'leads.json');
  if (fsSync.existsSync(filePath)) {
    const data = fsSync.readFileSync(filePath, 'utf-8');
    if (data && data.trim()) {
      try {
        const leads = JSON.parse(data);

        if (Array.isArray(leads) && leads.length > 0) {
          const leadIndex = leads.findIndex((lead: any) => lead.id === leadId && lead.clientId === clientId);
          if (leadIndex !== -1) {
            leads[leadIndex].summary = summary;
            try {
              fsSync.writeFileSync(filePath, JSON.stringify(leads, null, 2), 'utf-8');
              return true;
            } catch (error) {
              logger.error('Erro ao salvar o arquivo leads.json:', error);
              return false;
            }
          } else {
            logger.warn(`Lead com ID ${leadId} não encontrado para o cliente ${clientId}.`);
            return false;
          }
        }
      } catch (error) {
        logger.error('Erro ao analisar o arquivo leads.json:', error);
        return false;
      }
    }
  }
  return false;
}

/**
 * Gera insights personalizados para o lead
 */
function gerarInsightsParaLead(analise: any): string {
  const insights = [];

  if (analise.leadScore >= 8) {
    insights.push('• Lead com alta probabilidade de conversão');
    insights.push('• Recomenda-se contato imediato para não perder oportunidade');
  } else if (analise.leadScore >= 6) {
    insights.push('• Lead morno com bom potencial');
    insights.push('• Acompanhar nos próximos dias para amadurecer interesse');
  }

  if (analise.detalhes_agendamento?.[0]?.agendamento_identificado) {
    insights.push('• Cliente demonstrou interesse real marcando agendamento');
    insights.push('• Preparar apresentação detalhada do imóvel');
  }

  if (analise.tags?.includes('interesse-apartamento')) {
    insights.push('• Foco em benefícios de apartamentos (segurança, praticidade)');
  }

  if (analise.tags?.includes('interesse-casa')) {
    insights.push('• Foco em benefícios de casas (espaço, privacidade)');
  }

  if (analise.precisaAtendimentoHumano) {
    insights.push('• ⚠️ INTERVENÇÃO HUMANA NECESSÁRIA');
    insights.push('• Sistema automatizado não está sendo eficaz');
  }

  return insights.length > 0 ? insights.join('\n') : '• Analisar perfil do cliente para abordagem personalizada';
}