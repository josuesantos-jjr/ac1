import { type ChatSession, GoogleGenerativeAI, type Content, type Part } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { rateLimitManager, RequestType } from './rateLimitManager.ts';
import { smartCache } from './smartCache.ts';
import { monitoringService } from './monitoringService.ts';
import { mainGroqSuporte } from './groqSuporte.ts';
import { setCancelCurrentSending, getIsSendingMessages } from '../util/index.ts';
import { createLogger } from '../util/logger.ts';

const logger = createLogger({
  categoria: 'google-chat',
  fonte: 'src/backend/service/googlechat.ts'
});

const activeChats = new Map();

// Função unificada de validação de resposta aplicável a todos os modelos
async function validateResponse(
  response: string,
  modelUsed: 'googleChat' | 'googleBG' | 'groq',
  recentMessages: string[],
  currentMessage: string,
  chatId: string,
  __dirname: string
): Promise<{ isValid: boolean; issues?: string[] }> {
  try {
    // Validação básica
    if (!response || response.trim() === '') {
      return { isValid: false, issues: ['Resposta vazia'] };
    }

    if (response.length < 10) {
      return { isValid: false, issues: ['Resposta muito curta'] };
    }

    // Análise contextual usando GoogleBG se disponível
    try {
      const { mainGoogleBG } = await import('./googleBG.ts');

      const validationPrompt = `Analise esta resposta de chat e determine se precisa de melhorias:

OBJETIVO: Conversar e qualificar leads imobiliários, focando em agendar visita/ligação.

Mensagem do cliente: ${currentMessage}
Resposta da IA (${modelUsed}): ${response}

PROBLEMAS A IDENTIFICAR:
1. Está repetindo saudações excessivamente?
2. Está se apresentando quando já deveria conhecer o cliente?
3. Está repetindo informações promocionais?
4. Está sendo muito robótica ou formal?
5. Está fazendo perguntas que já foram respondidas?

IMPORTANTE: Considere o contexto das mensagens recentes: ${recentMessages.slice(-3).join(' | ')}

Responda apenas com JSON: {"needsImprovement": true/false, "issues": ["problema1", "problema2"]}`;

      const analysisResponse = await mainGoogleBG({
        currentMessageBG: validationPrompt,
        chatId,
        clearHistory: false,
        __dirname
      });

      const cleanedResponse = analysisResponse.replace(/```json|```/g, '').trim();
      const validation = JSON.parse(cleanedResponse);

      if (validation.needsImprovement) {
        logger.info(`🔍 Validação detectou problemas na resposta ${modelUsed}: ${validation.issues?.join(', ')}`);
        return { isValid: false, issues: validation.issues };
      }

    } catch (validationError) {
      logger.warn(`⚠️ Falha na validação automática, aceitando resposta ${modelUsed}:`, (validationError as Error).message);
      // Em caso de falha na validação, aceita a resposta
    }

    return { isValid: true };
  } catch (error) {
    logger.error('❌ Erro na validação de resposta:', error);
    return { isValid: true }; // Em caso de erro, aceita a resposta
  }
}




const getOrCreateChatSession = (
  chatId: string,
  __dirname: string
): ChatSession => {
  const configPath = path.join(__dirname, './config/infoCliente.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const intervalo_aleatorio = Math.random() * (20 - 15) + 5;
  const genAI = new GoogleGenerativeAI(config.GEMINI_KEY_CHAT);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.5,
      topP: 0.8,
      topK: 64,
      maxOutputTokens: 819200,
      responseMimeType: 'text/plain',
    },
    systemInstruction: 'Você é Mara, assistente de vendas da CMW especializada em imóveis. Responda de forma natural, profissional e focada em qualificar o lead e agendar visita/ligação. Mantenha o contexto da conversa e seja conversacional. Evite saudações repetitivas e apresentações desnecessárias.'
  });

  console.log('activeChats.has(chatId)', activeChats.has(chatId));
  if (activeChats.has(chatId)) {
    const currentHistory = activeChats.get(chatId);
    console.log({ currentHistory, chatId });
    return model.startChat({
      history: currentHistory,
    });
  }
  const history = [
    {
      role: 'user',
      parts: [
        {
          text: Array.isArray(config.GEMINI_PROMPT)
            ? config.GEMINI_PROMPT.map((item: Record<string, string>) => {
                // Concatena todos os valores de cada objeto em uma string
                return Object.values(item).join('\n');
              }).join('\n\n') // Junta os prompts de cada objeto com duas quebras de linha
            : config.GEMINI_PROMPT ?? 'oi', // Mantém compatibilidade com string antiga
        },
      ],
    },
    {
      role: 'model',
      parts: [
        {
          text: 'Olá, certo!',
        },
      ],
    },
  ];
  activeChats.set(chatId, history);
  return model.startChat({
    history,
  });
};

export const mainGoogleChat = async ({
  currentMessageChat,
  chatId,
  clearHistory,
  maxRetries = 3, // Reduzido para 3 tentativas
  __dirname,
}: {
  currentMessageChat: string;
  chatId: string;
  clearHistory: boolean;
  maxRetries?: number;
  __dirname: string;
}): Promise<string> => {
  const startTime = Date.now();
  let retries = 0;

  logger.info(`[mainGoogleChat] Iniciando processamento da mensagem para ${chatId}`);
  logger.info(`[mainGoogleChat] getIsSendingMessages(): ${getIsSendingMessages()}`);

  // Ponto de verificação: Validação de entrada crítica para chat
  if (!currentMessageChat || currentMessageChat.trim() === '') {
    console.warn('⚠️ Mensagem vazia fornecida ao GoogleChat');
    return 'Mensagem vazia fornecida';
  }

  // Se há mensagens sendo enviadas, cancela o envio atual e aguarda um buffer
  if (await getIsSendingMessages()) {
    logger.info('💬 Nova mensagem do usuário recebida durante o envio da IA. Cancelando envios pendentes...');
    logger.info(`[mainGoogleChat] setCancelCurrentSending(true) chamado`);
    await setCancelCurrentSending(true);
    // Aguarda um pequeno buffer para garantir que o cancelamento seja processado e para o usuário terminar de digitar
    await new Promise(resolve => setTimeout(resolve, 1500));
    logger.info(`[mainGoogleChat] Aguardando buffer de 1500ms`);
  }

  // Chat não usa cache para garantir respostas únicas e contextualizadas
  logger.info(`🚀 GoogleChat processando mensagem para ${chatId} (${currentMessageChat.length} caracteres)`);

  while (retries < maxRetries) {
    try {
      // Chat sempre tem prioridade máxima - registra mas não fila
      const requestId = await rateLimitManager.enqueueRequest(
        RequestType.CHAT,
        chatId,
        currentMessageChat,
        __dirname
      );

      const chat = getOrCreateChatSession(chatId, __dirname);
      const enhancedMessage = `Instrução: Gere uma resposta curta e objetiva. Evite repetir informações, o nome do cliente ou se apresentar novamente se já o fez. Foque em qualificar o lead e agendar uma visita/ligação. Mensagem do cliente: ${currentMessageChat}`;
      const promptParts: Part[] = [{ text: enhancedMessage }];
      logger.info(`📤 GoogleChat enviando ${promptParts[0].text?.length} caracteres para ${chatId}`);

      // Timeout inteligente para sendMessage
      const timeoutMs = Math.min(5000 + (retries * 2000), 15000); // Timeout aumenta com tentativas, máximo 15s
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout no sendMessage após ${timeoutMs}ms`)), timeoutMs);
      });

      const result = await Promise.race([chat.sendMessage(promptParts), timeoutPromise]);

      // Ponto de verificação: Verifica resposta válida
      if (!result || !result.response) {
        throw new Error('Resposta inválida da API Gemini Chat');
      }

      const response = result.response;
      let text = response.text();

      // Verifica se a resposta contém erros críticos
      if (
        text.includes('429 Too Many Requests') ||
        text.includes('503 Service Unavailable') ||
        text.includes('[500 Internal Server Error]')
      ) {
        throw new Error(`Erro crítico de API: ${text}`);
      }

      // Validação unificada da resposta
      const recentIAMessages = await getRecentIAMessages(chatId, __dirname);
      const validation = await validateResponse(text, 'googleChat', recentIAMessages, currentMessageChat, chatId, __dirname);

      if (!validation.isValid && validation.issues) {
        logger.info(`🔄 Resposta do GoogleChat precisa de ajustes: ${validation.issues.join(', ')}`);

        // Tenta fallback para GoogleBG se validação falhar
        try {
          logger.info('🔄 Tentando GoogleBG para resposta aprimorada...');
          const { mainGoogleBG } = await import('./googleBG.ts');

          const improvedPrompt = `Melhore esta resposta baseada nos problemas identificados.

PROBLEMAS: ${validation.issues.join(', ')}

Mensagem original do cliente: ${currentMessageChat}
Resposta atual (com problemas): ${text}

Mensagens recentes do contexto: ${recentIAMessages.slice(-3).join(' | ')}

Gere uma resposta melhorada que resolva estes problemas.`;

          const improvedResponse = await mainGoogleBG({
            currentMessageBG: improvedPrompt,
            chatId,
            clearHistory: true,
            __dirname
          });

          if (improvedResponse && improvedResponse.trim() !== '') {
            text = improvedResponse;
            logger.info('✅ Resposta aprimorada pelo GoogleBG');
          }

        } catch (bgError) {
          logger.warn('⚠️ Falha ao usar GoogleBG para aprimoramento, mantendo resposta original:', (bgError as Error).message);
        }
      }

      // Validação final: Verificação adicional de repetições (fallback se validação não capturou)
      const clientName = extractClientNameFromHistory(activeChats.get(chatId) || []);
      if (detectRepetitiveGreetings(recentIAMessages, clientName)) {
        logger.info('🔄 Repetição de saudação detectada, mas mantendo resposta original (validação deve resolver isso).');
        // Removido generateAlternativeMessage conforme solicitado - a validação deve ser suficiente
      }

      // Atualiza histórico se necessário
      if (clearHistory) {
        activeChats.delete(chatId);
      } else {
        activeChats.set(chatId, [
          ...activeChats.get(chatId),
          {
            role: 'user',
            parts: [{ text: currentMessageChat }],
          },
          {
            role: 'model',
            parts: [{ text: text }],
          },
        ]);
      }

      // Registra métricas de sucesso
      rateLimitManager.recordSuccessfulUsage('GEMINI_KEY_CHAT');
      // monitoringService.recordAPICall('googleChat', Date.now() - startTime, true, undefined, chatId, 'chat', 'gemini');

      const responseTime = Date.now() - startTime;
      logger.info(`✅ GoogleChat respondeu em ${responseTime}ms: ${text.substring(0, 100)}...`);

      // Ponto de verificação: Garante que resposta não está vazia
      if (!text || text.trim() === '') {
        throw new Error('Resposta vazia do GoogleChat');
      }

      return text;

    } catch (error: any) {
      retries++;
      const errorType = error.message || 'Erro desconhecido';
      const responseTime = Date.now() - startTime;

      logger.error(`❌ Tentativa ${retries}/${maxRetries} falhou no GoogleChat (${responseTime}ms):`, errorType);

      // Registra métricas de erro
      // monitoringService.recordAPICall('googleChat', responseTime, false, errorType, chatId, 'chat', 'gemini');

      // Ponto de verificação: Se erro de autenticação, não tenta novamente
      if (errorType.includes('Invalid API key') || errorType.includes('unauthorized')) {
        logger.error('🚫 Erro de autenticação no GoogleChat');
        return 'Erro crítico: Falha na autenticação da API';
      }

      // Tenta failover para Groq se Google falhar (mesmo para chat)
      if (retries >= maxRetries) {
        logger.info('🔄 Chat: Todas as tentativas no Google falharam, tentando Groq...');
        try {
          const groqResponse = await mainGroqSuporte({
            currentMessage: currentMessageChat,
            chatId,
            clearHistory,
            maxRetries: 2,
            __dirname
          });

          // Registra sucesso do fallback
          // monitoringService.recordAPICall('googleChat', Date.now() - startTime, true, 'fallback_groq', chatId, 'chat', 'groq');
          logger.info(`✅ Fallback Groq para chat funcionou em ${Date.now() - startTime}ms`);

          return groqResponse;

        } catch (groqError) {
          logger.error('💀 Falha crítica no chat: Google e Groq falharam');
          // monitoringService.recordAPICall('googleChat', Date.now() - startTime, false, 'fallback_failed', chatId, 'chat', 'failed');
          return 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.';
        }
      }

      // Para chat, usa backoff mais agressivo para tentar responder rapidamente
      const backoffTime = Math.min(500 * Math.pow(1.5, retries), 3000); // Máximo 3 segundos
      logger.info(`⏳ Chat aguardando ${backoffTime}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }

  // Se chegou aqui, todas as tentativas falharam completamente
  const totalTime = Date.now() - startTime;
  logger.error(`💀 Falha definitiva no GoogleChat após ${totalTime}ms`);
  return 'Erro: Não foi possível gerar resposta no momento. Tente novamente.';
}

// Função para notificar BK_CHATID em caso de falha completa
async function notifyFailureToBK(
  chatId: string,
  originalMessage: string,
  cycleCount: number,
  __dirname: string,
  isFinal: boolean = false
): Promise<void> {
  try {
    const configPath = path.join(__dirname, './config/infoCliente.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const bkChatId = config.BK_CHATID || config.TARGET_CHAT_ID;

    if (!bkChatId) {
      logger.warn('BK_CHATID não configurado para notificação de erro');
      return;
    }

    const notificationMessage = `🚨 *ERRO NO SISTEMA DE IA - CICLO ${cycleCount}*

📱 Chat ID: ${chatId}
📝 Mensagem do cliente: ${originalMessage.substring(0, 100)}...
⏰ Horário: ${new Date().toLocaleString('pt-BR')}
🔄 Ciclo: ${cycleCount}/2

Todos os serviços de IA falharam. Verifique o sistema.`;

    // Importa dinamicamente para evitar dependência circular
    const { mainGoogleBG } = await import('./googleBG.ts');

    await mainGoogleBG({
      currentMessageBG: `Envie esta notificação para ${bkChatId}: ${notificationMessage}`,
      chatId: bkChatId,
      clearHistory: true,
      __dirname
    });

    logger.info(`📢 Notificação de erro enviada para ${bkChatId}`);

  } catch (error) {
    logger.error('Erro ao enviar notificação de falha:', error);
  }
}

// Função auxiliar para extrair o nome do cliente do histórico
function extractClientNameFromHistory(history: Content[]): string | null {
  for (const entry of history) {
    if (entry.role === 'user' && entry.parts && entry.parts[0] && 'text' in entry.parts[0]) {
      const userMessage = entry.parts[0].text;
      if (userMessage) { // Adiciona verificação para userMessage
        const match = userMessage.match(/(?:meu nome é|sou|me chamo)\s+([a-zA-ZÀ-ÿ\s]+)/i);
        if (match && match[1]) {
          return match[1].trim().split(' ')[0]; // Retorna apenas o primeiro nome
        }
      }
    }
  }
  return null;
}



// Função para obter múltiplas mensagens recentes da IA para análise
async function getRecentIAMessages(
  chatId: string,
  __dirname: string,
  limit: number = 10
): Promise<string[]> {
  try {
    const filePath = path.join(
      __dirname,
      'Chats',
      'Historico',
      `${chatId}`,
      `${chatId}.json`
    );
    const data = await fs.promises.readFile(filePath, 'utf-8');
    const messages = JSON.parse(data);

    const recentMessages: string[] = [];

    // Percorre as mensagens de trás para frente para obter as mais recentes
    for (let i = messages.length - 1; i >= 0 && recentMessages.length < limit; i--) {
      if (messages[i].type === 'IA') {
        recentMessages.unshift(messages[i].message); // Adiciona no início para manter ordem cronológica
      }
    }

    return recentMessages;
  } catch (error) {
    console.error('Erro ao ler o arquivo de mensagens:', error);
    return [];
  }
}

// Função para detectar saudações repetitivas
function detectRepetitiveGreetings(messages: string[], clientName: string | null): boolean {
  if (messages.length < 2) return false;

  const greetingsPatterns = [
    /^(olá|ola|oi|bom dia|boa tarde|boa noite|e aí|e ai),?\s+\w+/i, // Saudação + nome (Olá Josué)
    /^(olá|ola|oi|bom dia|boa tarde|boa noite)\b/i, // Saudação sozinha (Olá)
    /\b(sou (a )?mara|me chamo mara|prazer,?\s+\w+)\b/i, // Apresentações
    /\b(tudo bem|tudo jóia|tudo certo|como vai|como está)\b/i, // Perguntas de estado
  ];

  const keyPhrases = [
    'especialista em primeiro imóvel',
    'agendar visita ou ligação',
    'residencial barcelona',
    'entrada parcelada',
    'documentação grátis',
  ];

  let greetingCount = 0;
  let presentationCount = 0;
  let keyPhraseRepetitionCount = 0;
  let clientNameMentionCount = 0;

  const recentMessages = messages.slice(-10); // Analisa mais mensagens para contexto (últimas 10)

  for (const message of recentMessages) {
    const normalizedMessage = message.toLowerCase().trim();

    // Conta saudações e apresentações separadamente
    const hasGreeting =
      greetingsPatterns[0].test(normalizedMessage) ||
      greetingsPatterns[1].test(normalizedMessage);
    const hasPresentation = greetingsPatterns[2].test(normalizedMessage);

    if (hasGreeting) {
      greetingCount++;
    }
    if (hasPresentation) {
      presentationCount++;
    }

    // Conta repetição de frases-chave
    for (const phrase of keyPhrases) {
      if (normalizedMessage.includes(phrase)) {
        keyPhraseRepetitionCount++;
      }
    }

    // Conta menções ao nome do cliente
    if (clientName && normalizedMessage.includes(clientName.toLowerCase())) {
      clientNameMentionCount++;
    }
  }

  // Considera repetitivo se:
  // 1. Há 2+ saudações nas últimas 10 mensagens, OU
  // 2. Há apresentação repetitiva (já que apresentação deve ser única), OU
  // 3. Uma frase-chave se repete 3+ vezes nas últimas 10 mensagens, OU
  // 4. O nome do cliente é mencionado 3+ vezes nas últimas 5 mensagens (se o nome for conhecido)
  const isRepetitiveGreeting = greetingCount >= 2 || presentationCount >= 2;
  const isRepetitiveKeyPhrase = keyPhraseRepetitionCount >= 3;
  const isExcessiveNameMention = clientName ? (clientNameMentionCount >= 3 && recentMessages.length >= 5) : false;

  return isRepetitiveGreeting || isRepetitiveKeyPhrase || isExcessiveNameMention;
}


