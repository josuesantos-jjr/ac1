import { type ChatSession, GoogleGenerativeAI, type Content, type Part } from '@google/generative-ai';
import * as http from 'http';
import * as https from 'https';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { rateLimitManager, RequestType } from './rateLimitManager.ts';
import { smartCache } from './smartCache.ts';
import { monitoringService } from './monitoringService.ts';
import { mainGroqSuporte } from './groqSuporte.ts';
import { mainOllamaService } from './ollamaService.ts';
import { cleanChatId } from '../util/chatDataUtils.ts';

const activeChats = new Map();




const getOrCreateChatSession = (
  chatId: string,
  __dirname: string
): ChatSession => {
  const configPath = path.join(__dirname, './config/infoCliente.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const intervalo_aleatorio = Math.random() * (20 - 15) + 5;
  const genAI = new GoogleGenerativeAI(config.GEMINI_KEY_CHAT);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const generationConfig = {
    temperature: 0.5,
    topP: 0.8,
    topK: 64,
    maxOutputTokens: 819200,
    responseMimeType: 'text/plain',
  };

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
            ? config.GEMINI_PROMPT.map((item: any) => {
                // Concatena todos os valores de cada objeto em uma string
                return Object.keys(item).map(key => item[key]).join('\n');
              }).join('\n\n') // Junta os prompts de cada objeto com duas quebras de linha
            : (config.GEMINI_PROMPT ?? 'oi') + '\nEvite repetir o nome do usuário em cada mensagem.', // Adiciona instrução para evitar repetição do nome
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

export const mainGoogleBG = async ({
  currentMessageBG,
  chatId,
  clearHistory,
  maxRetries = 3, // Reduzido para 3 tentativas
  __dirname,
}: {
  currentMessageBG: string;
  chatId: string;
  clearHistory: boolean;
  maxRetries?: number;
  __dirname: string;
}): Promise<string> => {
  const startTime = Date.now();
  let retries = 0;

  // Ponto de verificação: Validação de entrada
  if (!currentMessageBG || currentMessageBG.trim() === '') {
    console.warn('⚠️ Mensagem vazia fornecida ao GoogleBG');
    // monitoringService.recordAPICall('googleBG', Date.now() - startTime, false, 'Mensagem vazia', chatId);
    return 'Mensagem vazia fornecida';
  }

  // Verifica cache primeiro (exceto para chat que deve ser sempre único)
  const cachedResponse = smartCache.getCachedResponse(currentMessageBG, chatId, 'bg');
  if (cachedResponse) {
    // monitoringService.recordAPICall('googleBG', Date.now() - startTime, true, undefined, chatId, 'bg', 'cache');
    return cachedResponse;
  }

  while (retries < maxRetries) {
    try {
      // Verificação básica de conectividade antes de tentar a API
      try {
        // Testa conectividade com um endpoint público (Google DNS)
        await new Promise((resolve, reject) => {
         const testRequest = https.get('https://www.google.com', (res: any) => {
           resolve(res);
          });
          testRequest.on('error', reject);
          testRequest.setTimeout(5000, () => {
            testRequest.destroy();
            reject(new Error('Timeout na verificação de conectividade'));
          });
        });
      } catch (connectivityError) {
        console.warn('⚠️ Problema de conectividade detectado:', connectivityError);
        throw new Error('Sem conectividade com a internet');
      }

      // Verifica rate limiting
      const requestId = await rateLimitManager.enqueueRequest(
        RequestType.NOME, // Tipo genérico para BG
        chatId,
        currentMessageBG,
        __dirname
      );

      // Se não pode processar imediatamente, simula espera
      if (!rateLimitManager.canProcessImmediately(RequestType.NOME)) {
        console.log(`⏳ Rate limit atingido, aguardando para ${chatId}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const chat = getOrCreateChatSession(chatId, __dirname);
      const promptParts: Part[] = [{ text: currentMessageBG }];
      const result = await chat.sendMessage(promptParts);

      // Ponto de verificação: Verifica resposta válida
      if (!result || !result.response) {
        throw new Error('Resposta inválida da API Gemini');
      }

      const response = result.response;
      let text = response.text();

      // Verifica se a resposta contém erros conhecidos
      if (
        text.includes('429 Too Many Requests') ||
        text.includes('503 Service Unavailable') ||
        text.includes('[500 Internal Server Error]')
      ) {
        throw new Error(`Erro de API: ${text}`);
      }

      // Verifica se a resposta é repetida (evita respostas idênticas)
      const lastMessage = await getLastMessageFromIA(chatId, __dirname);
      if (text === lastMessage && lastMessage) {
        console.log('🔄 Resposta repetida detectada, tentando variar...');
        const variationPrompt = `${currentMessageBG}. Gere uma resposta diferente, utilize outras palavras mas mantenha o mesmo significado.`;
        const variationResult = await chat.sendMessage([{ text: variationPrompt }]);
        text = variationResult.response.text();
      }

      // Se clearHistory for true, remove o histórico ANTES de criar a sessão de chat
      if (clearHistory) {
        activeChats.delete(chatId);
      }
      // Atualiza histórico se necessário (apenas se clearHistory for false)
      if (!clearHistory) {
        activeChats.set(chatId, [
          ...activeChats.get(chatId),
          {
            role: 'user',
            parts: [{ text: currentMessageBG }],
          },
          {
            role: 'model',
            parts: [{ text: text }],
          },
        ]);
      }

      // Salva no cache para futuras consultas
      smartCache.setCachedResponse(currentMessageBG, chatId, 'bg', text);

      // Registra métricas de sucesso
      rateLimitManager.recordSuccessfulUsage('GEMINI_KEY');
      // monitoringService.recordAPICall('googleBG', Date.now() - startTime, true, undefined, chatId, 'bg', 'gemini');

      console.log(`✅ GoogleBG respondeu em ${Date.now() - startTime}ms: ${text.substring(0, 100)}...`);
      return text;

    } catch (error: any) {
      retries++;
      const errorType = error.message || 'Erro desconhecido';

      console.error(`❌ Tentativa ${retries}/${maxRetries} falhou no GoogleBG:`, errorType);

      // Classifica o tipo de erro para melhor tratamento
      const isNetworkError = errorType.includes('fetch failed') ||
                            errorType.includes('network') ||
                            errorType.includes('ECONNRESET') ||
                            errorType.includes('ENOTFOUND') ||
                            errorType.includes('timeout');

      const isAuthError = errorType.includes('Invalid API key') ||
                         errorType.includes('unauthorized') ||
                         errorType.includes('403');

      const isRateLimitError = errorType.includes('429') ||
                              errorType.includes('rate limit') ||
                              errorType.includes('quota');

      const isServerError = errorType.includes('500') ||
                           errorType.includes('502') ||
                           errorType.includes('503') ||
                           errorType.includes('504');

      // Log detalhado do tipo de erro
      if (isNetworkError) {
        console.log(`🌐 Erro de conectividade detectado`);
      } else if (isAuthError) {
        console.log(`🔐 Erro de autenticação detectado`);
      } else if (isRateLimitError) {
        console.log(`⚡ Erro de rate limit detectado`);
      } else if (isServerError) {
        console.log(`🖥️ Erro do servidor detectado`);
      }

      // Se erro de autenticação, não tenta novamente
      if (isAuthError) {
        console.error('🚫 Erro de autenticação no GoogleBG - chave da API inválida');
        return 'Erro de autenticação na API Gemini. Verifique a chave da API.';
      }

      // Tenta failover para Groq se Google falhar
      if (retries >= maxRetries) {
        console.log('🔄 Todas as tentativas no Google falharam, tentando Groq...');
        try {
          const groqResponse = await mainGroqSuporte({
            currentMessage: currentMessageBG,
            chatId,
            clearHistory,
            maxRetries: 2, // Menos tentativas no fallback
            __dirname,
            history: activeChats.get(chatId) // Passa o histórico da conversa
          });

          console.log(`✅ Fallback Groq funcionou em ${Date.now() - startTime}ms`);
          return groqResponse;

        } catch (groqError: any) {
          console.error('💀 Falha completa: Google e Groq falharam');
          console.error('Erro do Groq:', groqError.message);
          return 'Erro: Todos os serviços de IA temporariamente indisponíveis';
        }
      }

      // Calcula tempo de espera baseado no tipo de erro
      let backoffTime;
      if (isNetworkError) {
        backoffTime = Math.min(3000 * Math.pow(1.8, retries), 15000); // Mais tempo para erro de rede
      } else if (isRateLimitError) {
        backoffTime = Math.min(5000 * Math.pow(2, retries), 30000); // Mais tempo para rate limit
      } else {
        backoffTime = Math.min(2000 * Math.pow(1.5, retries), 10000); // Backoff padrão
      }

      console.log(`⏳ Aguardando ${backoffTime}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }

  // Se chegou aqui, todas as tentativas falharam completamente
  const totalTime = Date.now() - startTime;
  console.error(`💀 Falha definitiva no GoogleBG após ${totalTime}ms`);
  return 'Erro: Serviço temporariamente indisponível após múltiplas tentativas';
};

// Função para obter a última mensagem enviada pela IA no chat
async function getLastMessageFromIA(
  chatId: string,
  __dirname: string
): Promise<string | null> {
  try {
    const cleanId = cleanChatId(chatId);
    const filePath = path.join(
      __dirname,
      'Chats',
      'Historico',
      `${cleanId}`,
      `${cleanId}.json`
    );
    const data = await fs.promises.readFile(filePath, 'utf-8');
    const messages = JSON.parse(data);

    // Encontra a última mensagem enviada pela IA
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'IA') {
        return messages[i].message;
      }
    }
    console.log(`ultima mensagem: ${messages[messages.length - 1].message}`);

    // Se não encontrar nenhuma mensagem da IA, retorna null
    return null;
  } catch (error) {
    console.error('Erro ao ler o arquivo de mensagens:', error);
    return null;
  }
}
