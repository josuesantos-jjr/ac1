import { type Whatsapp } from '@wppconnect-team/wppconnect';
import { saveMessageToFile } from '../disparo/disparo.ts';
import { processTriggers } from '../service/braim/gatilhos.ts';
import { mainGoogleBG } from '../service/googleBG.ts';
import { createLogger } from './logger.ts';
import { removeEmojisIfConfigured } from './emojiUtils.ts';

// Cria logger específico para o backend geral (sem cliente específico)
const logger = createLogger({
  categoria: 'backend-util',
  fonte: 'src/backend/util/index.ts'
});
import * as fsSync from 'fs';
import * as path from 'path';
import { getClienteMessageController, ScalableMessageManager } from './storage/MessageManager.ts';

type AIOption = `GPT` | `GEMINI`;

// ✅ NOVO: Usa sistema de controle moderno internamente

export async function setCancelCurrentSending(value: boolean) {
  if (value) {
    // Usa novo sistema para cancelar operações atuais (assíncrono agora)
    try {
      const globalManager = ScalableMessageManager.getGlobalInstance();
      await globalManager.cancelAllCurrentSending();
    } catch (error) {
      console.error('Erro ao cancelar operações:', error);
    }
  }
}

/**
 * ✅ NOVO: Validação de formato de WID (WhatsApp ID)
 * Verifica se o WID está em formato válido antes do envio
 */
export function isValidWid(wid: string): boolean {
  if (!wid || typeof wid !== 'string') return false;

  // Formatos válidos:
  // - Individual: 5511999999999@c.us
  // - Grupo: 120363422191671112@g.us
  // - Broadcast: 5511999999999@broadcast

  const widPattern = /^\d+@(c\.us|g\.us|broadcast)$/;
  return widPattern.test(wid);
}

/**
 * ✅ NOVO: Sanitização de WID inválido
 * Corrige formatos comuns de WID inválido
 */
export function sanitizeWid(wid: string): string | null {
  if (!wid) return null;

  // Remove espaços extras
  let sanitized = wid.trim();

  // Corrige formato com @c.us duplo
  sanitized = sanitized.replace(/@c\.us@c\.us$/, '@c.us');
  sanitized = sanitized.replace(/@g\.us@g\.us$/, '@g.us');

  // Remove caracteres inválidos
  sanitized = sanitized.replace(/[^0-9@c.usg]/g, '');

  // Verifica se após sanitização ficou válido
  return isValidWid(sanitized) ? sanitized : null;
}

export async function getIsSendingMessages(): Promise<boolean> {
  // Usa novo sistema internamente (assíncrono agora)
  try {
    const globalManager = ScalableMessageManager.getGlobalInstance();
    return await globalManager.isSendingGlobally();
  } catch (error) {
    console.error('Erro ao verificar estado:', error);
    return false;
  }
}

/**
 * Valida se uma mensagem recebida é realmente válida antes de cancelar o envio
 * Verifica se há mensagens reais salvas no histórico do chat específico antes de permitir o cancelamento
 */
function isValidMessageReceived(clientePath: string, targetNumber: string, isCheckingDuringChatResponse: boolean = false): boolean {
  try {
    console.log(`[isValidMessageReceived] Verificando se há mensagens reais no histórico do chat ${targetNumber}...`);

    // Verifica se o cliente optou por ignorar mensagens durante o disparo (mas permite durante respostas de chat)
    if (!isCheckingDuringChatResponse && shouldIgnoreMessageDuringSending(clientePath)) {
      console.log(`[isValidMessageReceived] Cliente configurado para ignorar mensagens durante disparo`);
      return false;
    }

    // Verifica especificamente o chat que está sendo usado no envio
    const chatId = targetNumber.replace('@c.us', '');
    const chatDir = `${chatId}@c.us`;
    const historicoPath = path.join(clientePath, 'Chats', 'Historico', chatDir, `${chatDir}.json`);

    if (!fsSync.existsSync(historicoPath)) {
      console.log(`[isValidMessageReceived] Histórico não encontrado para o chat ${targetNumber}`);
      return false;
    }

    try {
      const historicoContent = fsSync.readFileSync(historicoPath, 'utf-8');
      const mensagens = JSON.parse(historicoContent);

      if (Array.isArray(mensagens) && mensagens.length > 0) {
        // Verifica se a última mensagem é recente (últimos 5 segundos) e do usuário
        const ultimaMensagem = mensagens[mensagens.length - 1];
        const tempoMensagem = new Date(`${ultimaMensagem.date} ${ultimaMensagem.time}`).getTime();
        const tempoAtual = Date.now();
        const diferencaTempo = (tempoAtual - tempoMensagem) / 1000; // em segundos

        // Só aceita mensagens do tipo 'User' (texto ou áudio já transcrito) nos últimos 10 segundos
        if (diferencaTempo <= 10 && ultimaMensagem.type === 'User') {
          console.log(`[isValidMessageReceived] ✅ Mensagem válida encontrada no chat ${targetNumber}:`);
          console.log(`[isValidMessageReceived]    - Tipo: ${ultimaMensagem.type}`);
          console.log(`[isValidMessageReceived]    - Tempo: ${diferencaTempo.toFixed(1)}s atrás`);
          console.log(`[isValidMessageReceived]    - Mensagem: "${ultimaMensagem.message.substring(0, 100)}..."`);
          return true; // Há mensagem real do usuário (texto ou áudio transcrito)
        } else {
          console.log(`[isValidMessageReceived] Última mensagem não é do tipo 'User':`);
          console.log(`[isValidMessageReceived]    - Tipo: ${ultimaMensagem.type} (precisa ser 'User')`);
          console.log(`[isValidMessageReceived]    - Tempo: ${diferencaTempo.toFixed(1)}s atrás (máx 10s)`);
        }
      } else {
        console.log(`[isValidMessageReceived] Nenhuma mensagem encontrada no histórico do chat ${targetNumber}`);
      }
    } catch (error) {
      console.error(`[isValidMessageReceived] Erro ao ler histórico do chat ${targetNumber}:`, error);
    }

    console.log(`[isValidMessageReceived] ❌ Nenhuma mensagem válida encontrada no chat ${targetNumber}`);
    return false; // Não há mensagens reais recentes neste chat

  } catch (error) {
    console.error(`[isValidMessageReceived] Erro ao validar mensagem:`, error);
    return false; // Em caso de erro, não cancela
  }
}

/**
 * Verifica se o sistema deve ignorar mensagens recebidas durante o envio
 * Esta configuração pode ser controlada através das regras do cliente
 */
export function shouldIgnoreMessageDuringSending(clientePath: string): boolean {
  try {
    const regrasPath = path.join(clientePath, 'config', 'regrasDisparo.json');
    if (!fsSync.existsSync(regrasPath)) {
      return true; // Por padrão, ignora para evitar problemas
    }

    const regrasContent = fsSync.readFileSync(regrasPath, 'utf-8');
    const regras = JSON.parse(regrasContent);

    // Se não estiver definido, usa configuração conservadora (ignorar)
    return regras.ignorarMensagensDuranteDisparo !== false;
  } catch (error) {
    console.error(`[shouldIgnoreMessageDuringSending] Erro ao ler configuração:`, error);
    return true; // Em caso de erro, ignora para evitar problemas
  }
}

export function splitMessages(text: string): string[] {
  if (/[:*;$*-]/.test(text)) {
    return splitSimpleMessages(text, true);
  }

  const blockPattern = /\*\*\*[\s\S]*?\*\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = blockPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  const splitParts = parts.flatMap(part => {
    if (part.startsWith("***") && part.endsWith("***")) {
      return part;
    } else {
      return splitSimpleMessages(part, false);
    }
  }).filter(part => part.trim() !== "");

  // Limita a 5 partes
  if (splitParts.length > 5) {
    return splitParts.slice(0, 5);
  }
  return splitParts;
}

function splitSimpleMessages(text: string, useSpecialSplit: boolean): string[] {
  if (useSpecialSplit && text.includes('***')) {
    const parts = [];
    let lastIndex = 0;
    const regex = /\*\*\*/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index).trim());
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex).trim());
    }

    return parts.filter(part => part !== "");
  }

  if (useSpecialSplit) {
    const complexPattern = /(\([^)]*\))|(http[s]?:\/\/[^\s]+)|(www\.[^\s]+)|([^\s]+@[^\s]+\.[^\s]+)|(["'].*?["'])|(R\$\s*\d+(?:\.\d{3})*(?:,(?:[0-9]{2})))/g;
    const placeholders = text.match(complexPattern) ?? [];
    const placeholder = 'PLACEHOLDER_';
    let currentIndex = 0;

    const textWithPlaceholders = text.replace(complexPattern, () => `${placeholder}${currentIndex++}`);
    const splitPattern = /(?:[R$]\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?\s*(?!\d))|[^.?!\n]+(?:[.?!\n]+["']?|(?<!\d|\d{1,3}(?:\.\d{3})+)[.](?!\d))/g;
    let parts = textWithPlaceholders.match(splitPattern) ?? ([] as string[]);

    if (placeholders.length > 0) {
      parts = parts.map((part) => {
        let result = part;
        placeholders.forEach((val, idx) => {
          result = result.replace(new RegExp(`${placeholder}${idx}`, 'g'), val);
        });
        return result;
      });
    }

    return parts;
  }

  const parts = [];
  let currentPart = '';
  for (let i = 0; i < text.length; i++) {
    currentPart += text[i];
    if (['.', '?', '!'].includes(text[i])) {
      parts.push(currentPart.trim());
      currentPart = '';
    } else if (text[i] === '\n') {
      if (currentPart.trim() !== '') {
        parts.push(currentPart.trim());
      }
      currentPart = '';
    }
  }
  if (currentPart.trim() !== '') {
    parts.push(currentPart.trim());
  }
  return parts.filter(part => part !== "");
}

export async function sendMessagesWithDelay({
  messages,
  client,
  targetNumber,
  __dirname,
  clienteIdCompleto,
  clientePath,
  logger,
}: {
  messages: string[];
  client: Whatsapp;
  targetNumber: string;
  __dirname: string;
  clienteIdCompleto: string;
  clientePath: string;
  logger: any;
}): Promise<void> {
  console.log(`[sendMessagesWithDelay] Iniciando envio de mensagens para ${targetNumber}`);

  // ✅ Usa novo sistema de controle
  const clienteController = getClienteMessageController(clienteIdCompleto);
  const abortController = await clienteController.iniciarDisparo(targetNumber);
  const signal = abortController.signal;

  // ✅ Variáveis locais para compatibilidade interna
  let isSendingMessages = true;

  const messageQueue = messages.map((msg) => ({
    message: msg.replace(/\\n/g, '\n').trimStart(),
    delay: Math.min(msg.length * 100, 5000),
  }));

  console.log(`[sendMessagesWithDelay] Fila de mensagens:`, messageQueue);

  const cancellableTimeout = (ms: number, signal: AbortSignal) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Timeout aborted'));
      }, { once: true });
    });
  };

  async function sendMessageWithRetryAndTyping(client: any, messageData: { message: string; delay: number }, __dirname: string, maxRetries = 3, signal: AbortSignal): Promise<any> {
    const { message, delay } = messageData;
    let retries = 0;

    console.log(`[sendMessageWithRetryAndTyping] Tentando enviar mensagem: "${message.substring(0, 50)}..."`);

    while (retries < maxRetries) {
      if (signal.aborted) {
        console.log(`[sendMessageWithRetryAndTyping] Cancelamento solicitado. Abortando envio de mensagens.`);
        try {
          await client.stopTyping(targetNumber);
        } catch (stopError: any) {
          if (stopError.code === 'chat_not_found' || stopError.message?.includes('Chat not found')) {
            console.log(`[sendMessageWithRetryAndTyping] Erro ao parar digitação durante cancelamento (ignorado): ${stopError.message}`);
          } else {
            throw stopError;
          }
        }
        isSendingMessages = false;
        return null;
      }

      try {
        console.log(`[sendMessageWithRetryAndTyping] Iniciando digitação (tentativa ${retries + 1})`);
        await client.startTyping(targetNumber);

        if (signal.aborted) {
          console.log(`[sendMessageWithRetryAndTyping] Cancelamento solicitado durante digitação. Abortando.`);
          try {
            await client.stopTyping(targetNumber);
          } catch (stopError: any) {
            if (stopError.code === 'chat_not_found' || stopError.message?.includes('Chat not found')) {
              console.log(`[sendMessageWithRetryAndTyping] Erro ao parar digitação durante cancelamento (ignorado): ${stopError.message}`);
            } else {
              throw stopError;
            }
          }
          isSendingMessages = false;
          return null;
        }
      } catch (typingError: any) {
        if (typingError.code === 'chat_not_found' || typingError.message?.includes('Chat not found')) {
          console.log(`[sendMessageWithRetryAndTyping] Erro de digitação (chat não encontrado), continuando sem indicador: ${typingError.message}`);
        } else {
          throw typingError;
        }
      }

      console.log(`[sendMessageWithRetryAndTyping] Aguardando delay de ${delay}ms`);
      await cancellableTimeout(delay, signal);

      if (signal.aborted) {
        console.log(`[sendMessageWithRetryAndTyping] Cancelamento solicitado durante delay. Abortando.`);
        try {
          await client.stopTyping(targetNumber);
        } catch (stopError: any) {
          if (stopError.code === 'chat_not_found' || stopError.message?.includes('Chat not found')) {
            console.log(`[sendMessageWithRetryAndTyping] Erro ao parar digitação durante delay (ignorado): ${stopError.message}`);
          } else {
            throw stopError;
          }
        }
        isSendingMessages = false;
        return null;
      }

      try {
        console.log(`[sendMessageWithRetryAndTyping] Enviando mensagem (tentativa ${retries + 1})`);
        // Remove emojis se configurado antes de enviar
        const cleanMessage = removeEmojisIfConfigured(clientePath, message);
        const result = await client.sendText(targetNumber, cleanMessage);

        try {
          await client.stopTyping(targetNumber);
        } catch (stopTypingError: any) {
          if (stopTypingError.code === 'chat_not_found' || stopTypingError.message?.includes('Chat not found')) {
            console.log(`[sendMessageWithRetryAndTyping] Erro ao parar digitação (ignorado): ${stopTypingError.message}`);
          } else {
            throw stopTypingError;
          }
        }

        // Salva apenas após envio bem-sucedido
        await saveMessageToFile(clienteIdCompleto, clientePath, targetNumber, cleanMessage, `IA`);
        await processTriggers(client, targetNumber, cleanMessage, __dirname);
        console.log(`[sendMessageWithRetryAndTyping] Mensagem enviada com sucesso`);
        return result;
      } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'Timeout aborted') {
          console.log(`[sendMessageWithRetryAndTyping] Envio abortado devido a cancelamento.`);
          try {
            await client.stopTyping(targetNumber);
          } catch (stopError: any) {
            if (stopError.code === 'chat_not_found' || stopError.message?.includes('Chat not found')) {
              console.log(`[sendMessageWithRetryAndTyping] Erro ao parar digitação durante cancelamento (ignorado): ${stopError.message}`);
            } else {
              throw stopError;
            }
          }
          isSendingMessages = false;
          return null;
        }

        retries++;
        console.error(`[sendMessageWithRetryAndTyping] Erro ao enviar mensagem (tentativa ${retries}):`, error);

        try {
          await client.stopTyping(targetNumber);
        } catch (stopError: any) {
          if (stopError.code === 'chat_not_found' || stopError.message?.includes('Chat not found')) {
            console.log(`[sendMessageWithRetryAndTyping] Erro ao parar digitação durante erro (ignorado): ${stopError.message}`);
          } else {
            throw stopError;
          }
        }

        const retryDelay = 2000 * retries;
        console.log(`[sendMessageWithRetryAndTyping] Tentando novamente em ${retryDelay / 1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    console.error(`[sendMessageWithRetryAndTyping] Falha ao enviar mensagem "${message.substring(0, 50)}..." após ${maxRetries} tentativas.`);

    try {
      await client.stopTyping(targetNumber);
    } catch (stopError: any) {
      if (stopError.code === 'chat_not_found' || stopError.message?.includes('Chat not found')) {
        console.log(`[sendMessageWithRetryAndTyping] Erro ao parar digitação após falha (ignorado): ${stopError.message}`);
      } else {
        throw stopError;
      }
    }

    isSendingMessages = false;
    return null;
  }

  for (const messageData of messageQueue) {
    if (signal.aborted) {
      console.log(`[sendMessagesWithDelay] Cancelamento solicitado. Interrompendo processamento da fila.`);
      isSendingMessages = false;
      return;
    }

    // Validação adicional: verifica se há mensagens realmente válidas antes de cancelar
    if (isSendingMessages && signal.aborted && !isValidMessageReceived(clientePath, targetNumber)) {
      console.log(`[sendMessagesWithDelay] Cancelamento ignorado - nenhuma mensagem válida detectada. Continuando envio...`);
      // Reseta o sinal de aborto se foi causado por mensagem inválida
      // Usa novo sistema para resetar
      await clienteController.finalizar(targetNumber);
      const newController = await clienteController.iniciarDisparo(targetNumber);
      Object.assign(abortController, newController);
      continue;
    }

    console.log(`[sendMessagesWithDelay] Processando mensagem da fila: "${messageData.message.substring(0, 50)}..."`);
    await sendMessageWithRetryAndTyping(client, messageData, __dirname, 3, signal);

    // ✅ NOVA VERIFICAÇÃO: Verificar se uma nova mensagem foi recebida durante o envio
    if (isValidMessageReceived(clientePath, targetNumber, true)) {
      console.log(`[sendMessagesWithDelay] Nova mensagem detectada durante o envio para ${targetNumber}. Interrompendo envio restante.`);
      // Cancela o envio restante
      abortController.abort();
      isSendingMessages = false;
      console.log(`[sendMessagesWithDelay] Abortando envio após detectar nova mensagem.`);
      return;
    }
  }

  isSendingMessages = false;
  // ✅ Usa novo sistema para finalizar
  clienteController.finalizar(targetNumber);
}

const MAX_MESSAGE_PARTS = 4;

async function analyzeAndReformatProductMessages(
  originalMessage: string,
  chatId: string,
  __dirname: string,
  logger: any
): Promise<string> {
  const productKeywords = ["produto", "serviço", "preço", "R$", "detalhes", "lista", "opções", "cardápio", "menu", "catálogo"];
  const containsProductKeywords = productKeywords.some(keyword =>
    originalMessage.toLowerCase().includes(keyword)
  );

  if (!containsProductKeywords) {
    return originalMessage;
  }

  logger.info(`[analyzeAndReformatProductMessages] Mensagem para ${chatId} contém palavras-chave de produto. Analisando com IA...`);

  const analysisPrompt = `Analise a seguinte mensagem. Se ela contiver uma lista ou detalhes de produtos/serviços que estão divididos em várias partes, reestruture a mensagem para que todas essas informações fiquem juntas em um único bloco. Envolva este bloco com *** no início e *** no final. Se a mensagem não contiver informações de produtos ou se elas já estiverem em um formato adequado, retorne a mensagem original sem alterações. A mensagem é:

"${originalMessage}"

Retorne apenas o texto final, sem introduções ou explicações.`;

  try {
    const reformattedMessage = await mainGoogleBG({
      currentMessageBG: analysisPrompt,
      chatId,
      clearHistory: true,
      __dirname,
    });

    if (reformattedMessage && reformattedMessage.trim() !== '' && reformattedMessage.trim() !== originalMessage.trim()) {
      logger.info(`[analyzeAndReformatProductMessages] IA reformatou a mensagem para ${chatId}.`);
      return reformattedMessage;
    } else {
      logger.info(`[analyzeAndReformatProductMessages] IA não aplicou reformatação para ${chatId}. Usando mensagem original.`);
      return originalMessage;
    }
  } catch (error) {
    logger.error(`[analyzeAndReformatProductMessages] Erro ao analisar mensagem com IA para ${chatId}:`, error);
    return originalMessage;
  }
}

export async function handleMessageSplitting({
  client,
  originalMessage,
  chatId,
  __dirname,
  AI_SELECTED,
  infoConfig,
  logger,
}: {
  client: Whatsapp;
  originalMessage: string;
  chatId: string;
  __dirname: string;
  AI_SELECTED: AIOption;
  infoConfig: any;
  logger: any;
}): Promise<string[]> {
  try {
    logger.info(`[handleMessageSplitting] Processando mensagem de ${originalMessage.length} caracteres`);

    const messageToProcess = await analyzeAndReformatProductMessages(
      originalMessage,
      chatId,
      __dirname,
      logger
    );

    let messagesToSplit: string[] = splitMessages(messageToProcess);

    logger.info(`[handleMessageSplitting] Mensagem dividida em ${messagesToSplit.length} partes`);

    // Limite para 4 partes
    const maxParts = 4;

    if (messagesToSplit.length > maxParts) {
      logger.warn(`[handleMessageSplitting] ${messagesToSplit.length} partes geradas, limite é ${maxParts}. Reformulando...`);
      const reformulatedMessage = await reformatMessageForSplitting(
        client,
        messageToProcess,
        chatId,
        __dirname,
        logger
      );
      messagesToSplit = splitMessages(reformulatedMessage);
      logger.info(`[handleMessageSplitting] Mensagem reformulada dividida em ${messagesToSplit.length} partes`);
    }

    if (messagesToSplit.length > maxParts) {
      logger.warn(`[handleMessageSplitting] Mesmo após reformulação, ${messagesToSplit.length} partes geradas, limitando`);
      messagesToSplit = messagesToSplit.slice(0, maxParts);
    }

    return messagesToSplit;
  } catch (error) {
    logger.error(`[handleMessageSplitting] Erro ao processar mensagem:`, error);
    return [originalMessage];
  }
}

// Função para reformular mensagem se exceder 4 partes com fallbacks
async function reformatMessageForSplitting(
  client: any,
  message: string,
  chatId: string,
  __dirname: string,
  logger: any
): Promise<string> {
  const reformulationPrompt = `
Essa mensagem passou de 4 partes e precisa ser reestruturada para até 4 partes.

REGRAS PARA DIVIDIR:
- Divida por pontuação: pontos finais (.), exclamações (!), interrogações (?).
- Divida por quebras de linha (\n).
- Para textos complexos, divida por padrões como URLs (http:// ou https://), emails (nome@dominio.com), valores monetários (R$ 123,45), ou outros elementos que podem ser separados.
- Evite dividir no meio de frases completas; priorize divisões naturais em pausas lógicas.

REGRAS PARA MANTER PARTES GRANDES JUNTAS:
- Use *** no início e no final de blocos de texto que devem ser enviados inteiros, como descrições de produtos, listas de imóveis, ou informações detalhadas.
- Mantenha links (www. ou http://) e emails juntos sem dividir.
- Mantenha valores monetários e números importantes em uma única parte.
- Não divida no meio de parênteses, citações ou elementos que precisam de contexto completo.

INSTRUÇÕES:
- Reformule a mensagem para que tenha partes pequenas onde pode ser dividida (ex: saudações, perguntas isoladas).
- Mantenha partes grandes onde as informações devem ficar juntas (ex: descrições completas de imóveis com ***).
- Não invente informações novas. Apenas reorganize e utilize as mesmas informações da mensagem original para se enquadrar nessas regras.
- Garanta que o resultado ainda transmita a mesma mensagem, mas de forma mais concisa e bem dividida.

Mensagem original:
"${message}"

Reformule a mensagem:
`;

  const services = [
    { name: 'GoogleChat', fn: async () => {
      const { mainGoogleChat } = await import('../service/googlechat.ts');
      return await mainGoogleChat({ currentMessageChat: reformulationPrompt, chatId, clearHistory: true, __dirname });
    }},
    { name: 'GoogleBG', fn: async () => {
      const { mainGoogleBG } = await import('../service/googleBG.ts');
      return await mainGoogleBG({ currentMessageBG: reformulationPrompt, chatId, clearHistory: true, __dirname });
    }},
    { name: 'Groq', fn: async () => {
      const { mainGroqSuporte } = await import('../service/groqSuporte.ts');
      return await mainGroqSuporte({ currentMessage: reformulationPrompt, chatId, clearHistory: true, __dirname });
    }},
    { name: 'Ollama', fn: async () => {
      const { mainOllamaService } = await import('../service/ollamaService.ts');
      return await mainOllamaService({ currentMessage: reformulationPrompt, chatId, clearHistory: true, __dirname });
    }}
  ];

  for (let attempt = 1; attempt <= services.length; attempt++) {
    try {
      logger.info(`[reformatMessageForSplitting] Tentativa ${attempt}/${services.length} para ${chatId} usando ${services[attempt - 1].name}`);

      const reformulatedMessage = await services[attempt - 1].fn();

      if (reformulatedMessage && reformulatedMessage.trim() !== '') {
        logger.info(`[reformatMessageForSplitting] Mensagem reformulada com sucesso para ${chatId} usando ${services[attempt - 1].name}`);
        return reformulatedMessage;
      } else {
        logger.warn(`[reformatMessageForSplitting] Reformulação falhou com ${services[attempt - 1].name} para ${chatId}`);
      }
    } catch (error) {
      logger.error(`[reformatMessageForSplitting] Erro na tentativa ${attempt} com ${services[attempt - 1].name}:`, error);
    }
  }

  // Se todas falharam, notifica BK_CHATID e tenta novamente indefinidamente
  try {
    const configPath = path.join(__dirname, './config/infoCliente.json');
    const config = JSON.parse(fsSync.readFileSync(configPath, 'utf-8'));
    const bkChatId = config.BK_CHATID || config.TARGET_CHAT_ID;

    if (bkChatId) {
      const notificationMessage = `🚨 *FALHA NA REFORMULAÇÃO DE MENSAGEM - ${chatId}*\n\nMensagem original que falhou na reformulação:\n"${message.substring(0, 500)}..."\n\nTodas as tentativas de reformulação falharam. Verifique o sistema.`;
      await client.sendText(bkChatId, notificationMessage);
      logger.info(`[reformatMessageForSplitting] Notificação enviada para ${bkChatId}`);
    }
  } catch (notifyError) {
    logger.error(`[reformatMessageForSplitting] Erro ao enviar notificação:`, notifyError);
  }

  logger.error(`[reformatMessageForSplitting] Todas as tentativas falharam para ${chatId}, usando mensagem original`);
  return message; // Fallback para mensagem original
}