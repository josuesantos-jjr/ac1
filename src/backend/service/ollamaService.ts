import * as fs from 'fs';
import * as path from 'path';
import { rateLimitManager, RequestType } from './rateLimitManager.ts';
import { smartCache } from './smartCache.ts';
import { monitoringService } from './monitoringService.ts';

interface OllamaConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface Message {
  role: string;
  content: string;
}

interface OllamaRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OllamaResponse {
  message: {
    content: string;
  };
  done: boolean;
}

// Interface para controle de tentativas por chat
interface OllamaRetryAttempt {
  chatId: string;
  attemptCount: number;
  lastAttemptTime: number;
}

class OllamaService {
  private config: OllamaConfig;
  private clientePath: string;
  private retryAttempts: Map<string, OllamaRetryAttempt> = new Map();
  private readonly maxAttempts = 3;
  private readonly baseWaitTime = 2000; // 2 segundos para Ollama

  constructor(clientePath: string) {
    this.clientePath = clientePath;
    this.config = this.loadConfig();
  }

  /**
   * Carrega a configuração do Ollama a partir do arquivo ollama.txt
   * ou do infoCliente.json como fallback
   */
  private loadConfig(): OllamaConfig {
    try {
      // Primeiro tenta ler do arquivo ollama.txt
      const ollamaFilePath = path.join(this.clientePath, 'ollama.txt');
      
      if (fs.existsSync(ollamaFilePath)) {
        const content = fs.readFileSync(ollamaFilePath, 'utf-8');
        const config = this.parseOllamaFile(content);
        
        if (config.apiKey && config.baseUrl && config.model) {
          console.log(`✅ Configuração Ollama carregada do arquivo: ${ollamaFilePath}`);
          return config;
        }
      }

      // Fallback para infoCliente.json
      const configPath = path.join(this.clientePath, 'config', 'infoCliente.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        
        const ollamaConfig: OllamaConfig = {
          apiKey: config.OLLAMA_API_KEY || config.GEMINI_KEY, // Usa GEMINI_KEY como fallback
          baseUrl: config.OLLAMA_BASE_URL || 'https://ia.aceleracaocomercial.com/api',
          model: config.OLLAMA_MODEL || 'cogito:3b'
        };

        if (ollamaConfig.apiKey && ollamaConfig.baseUrl && ollamaConfig.model) {
          console.log(`✅ Configuração Ollama carregada do infoCliente.json`);
          return ollamaConfig;
        }
      }

      throw new Error('Configuração Ollama não encontrada em nenhum dos arquivos');

    } catch (error) {
      console.error('❌ Erro ao carregar configuração Ollama:', error);
      throw new Error('Falha ao carregar configuração Ollama');
    }
  }

  /**
   * Faz o parsing do arquivo ollama.txt
   */
  private parseOllamaFile(content: string): OllamaConfig {
    const lines = content.split('\n').map(line => line.trim());
    const config: Partial<OllamaConfig> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line === 'api' && i + 1 < lines.length) {
        config.apiKey = lines[i + 1];
      } else if (line === 'url base' && i + 1 < lines.length) {
        config.baseUrl = lines[i + 1];
      } else if (line === 'model' && i + 1 < lines.length) {
        config.model = lines[i + 1];
      }
    }

    return config as OllamaConfig;
  }

  /**
   * Converte histórico do formato Gemini para formato Ollama
   */
  private convertHistoryToOllama(history: any[]): Message[] {
    if (!Array.isArray(history)) return [];
    
    return history.map(entry => {
      let content = entry.content || '';
      
      // Converte 'parts' para 'content' se existir (formato Gemini)
      if (entry.parts && Array.isArray(entry.parts) && entry.parts.length > 0) {
        content = entry.parts
          .map((part: any) => {
            if (part.text) return part.text;
            if (part.inlineData) return '[Dados inline não suportados]';
            if (part.fileData) return '[Arquivo não suportado]';
            return '';
          })
          .join('\n')
          .trim();
      }
      
      return {
        role: entry.role === 'model' ? 'assistant' : entry.role,
        content: content || ''
      };
    }).filter(entry => entry.role === 'user' || entry.role === 'assistant');
  }

  /**
   * Faz a chamada HTTP para a API Ollama
   */
  private async makeOllamaRequest(request: OllamaRequest): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Verifica conectividade antes de tentar
      await this.checkConnectivity();

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: request.messages,
          temperature: request.temperature || 0.6,
          max_tokens: request.max_tokens || 4096,
          stream: false
        })
      });

      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.status} - ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      
      if (!data.message?.content) {
        throw new Error('Resposta inválida da API Ollama');
      }

      // Registra métricas de sucesso
      rateLimitManager.recordSuccessfulUsage('OLLAMA');
      monitoringService.recordAPICall('ollama', duration, true, undefined, request.messages[request.messages.length - 1]?.content || '', 'ollama');

      console.log(`✅ Ollama respondeu em ${duration}ms: ${data.message.content.substring(0, 100)}...`);
      return data.message.content;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Erro na chamada Ollama (${duration}ms):`, error.message);
      
      // Registra métricas de falha
      monitoringService.recordAPICall('ollama', duration, false, error.message, request.messages[request.messages.length - 1]?.content || '', 'ollama');
      
      throw error;
    }
  }

  /**
   * Verifica conectividade com o endpoint Ollama
   */
  private async checkConnectivity(): Promise<void> {
    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Conectividade falhou: ${response.status}`);
      }
    } catch (error) {
      throw new Error('Sem conectividade com o endpoint Ollama');
    }
  }

  /**
   * Registra tentativa de retry
   */
  private registerRetryAttempt(chatId: string): void {
    const existing = this.retryAttempts.get(chatId);
    const now = Date.now();

    if (existing) {
      existing.attemptCount++;
      existing.lastAttemptTime = now;
    } else {
      this.retryAttempts.set(chatId, {
        chatId,
        attemptCount: 1,
        lastAttemptTime: now
      });
    }
  }

  /**
   * Reseta tentativas para um chat
   */
  private resetRetryAttempts(chatId: string): void {
    this.retryAttempts.delete(chatId);
  }

  /**
   * Obtém tentativa atual
   */
  private getCurrentAttempt(chatId: string): number {
    const attempt = this.retryAttempts.get(chatId);
    return attempt ? attempt.attemptCount : 0;
  }

  /**
   * Função principal para gerar resposta usando Ollama
   */
  async generateResponse(
    prompt: string, 
    chatId?: string, 
    history?: any[]
  ): Promise<string> {
    const startTime = Date.now();
    let retries = 0;

    // Ponto de verificação: Validação de entrada
    if (!prompt || prompt.trim() === '') {
      console.warn('⚠️ Mensagem vazia fornecida ao Ollama');
      return 'Mensagem vazia fornecida';
    }

    // Verifica cache primeiro
    const cachedResponse = smartCache.getCachedResponse(prompt, chatId || '', 'ollama');
    if (cachedResponse) {
      monitoringService.recordAPICall('ollama', Date.now() - startTime, true, undefined, chatId || '', 'ollama', 'cache');
      return cachedResponse;
    }

    // Verifica rate limiting
    try {
      await rateLimitManager.enqueueRequest(
        RequestType.CHAT,
        chatId || '',
        prompt,
        this.clientePath
      );
    } catch (error) {
      console.warn('⚠️ Rate limit atingido para Ollama');
      throw new Error('Rate limit atingido para Ollama');
    }

    while (retries < this.maxAttempts) {
      try {
        retries++;
        this.registerRetryAttempt(chatId || '');

        // Converte histórico do formato Gemini para formato Ollama
        const convertedHistory = this.convertHistoryToOllama(history || []);

        const request: OllamaRequest = {
          model: this.config.model,
          messages: [
            ...convertedHistory,
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.6,
          max_tokens: 4096,
          stream: false
        };

        const response = await this.makeOllamaRequest(request);

        // Salva no cache para futuras consultas
        smartCache.setCachedResponse(prompt, chatId || '', 'ollama', response);

        // Reseta tentativas após sucesso
        this.resetRetryAttempts(chatId || '');

        return response;

      } catch (error: any) {
        const attempt = this.getCurrentAttempt(chatId || '');
        console.error(`❌ Tentativa ${attempt}/${this.maxAttempts} falhou no Ollama:`, error.message);

        // Tipos de erro específicos do Ollama
        const isNetworkError = error.message.includes('fetch failed') ||
                              error.message.includes('network') ||
                              error.message.includes('ECONNRESET') ||
                              error.message.includes('ENOTFOUND') ||
                              error.message.includes('timeout');

        const isAuthError = error.message.includes('Invalid API key') ||
                           error.message.includes('unauthorized') ||
                           error.message.includes('403');

        const isServerError = error.message.includes('500') ||
                             error.message.includes('502') ||
                             error.message.includes('503') ||
                             error.message.includes('504');

        // Se erro de autenticação, não tenta novamente
        if (isAuthError) {
          console.error('🚫 Erro de autenticação no Ollama - chave da API inválida');
          return 'Erro de autenticação na API Ollama. Verifique a chave da API.';
        }

        // Calcula tempo de espera baseado no tipo de erro
        let backoffTime;
        if (isNetworkError) {
          backoffTime = Math.min(5000 * Math.pow(1.8, attempt), 20000); // Mais tempo para erro de rede
        } else if (isServerError) {
          backoffTime = Math.min(3000 * Math.pow(2, attempt), 15000); // Mais tempo para erro de servidor
        } else {
          backoffTime = Math.min(this.baseWaitTime * Math.pow(1.5, attempt), 10000); // Backoff padrão
        }

        console.log(`⏳ Aguardando ${backoffTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const totalTime = Date.now() - startTime;
    console.error(`💀 Falha definitiva no Ollama após ${totalTime}ms`);
    return 'Erro: Serviço Ollama temporariamente indisponível após múltiplas tentativas';
  }
}

// Factory function para criar instância do serviço Ollama por cliente
export const createOllamaService = (clientePath: string) => {
  return new OllamaService(clientePath);
};

// Função principal compatível com a interface existente
export const mainOllamaService = async ({
  currentMessage,
  chatId,
  clearHistory = true,
  maxRetries = 3,
  __dirname,
  history
}: {
  currentMessage: string;
  chatId?: string;
  clearHistory?: boolean;
  maxRetries?: number;
  __dirname: string;
  history?: any[];
}): Promise<string> => {
  try {
    // Cria instância específica do cliente
    const ollamaService = createOllamaService(__dirname);
    return await ollamaService.generateResponse(currentMessage, chatId, history);
  } catch (error: any) {
    console.error('❌ Erro no mainOllamaService:', error.message);
    return 'Erro: Serviço Ollama temporariamente indisponível';
  }
};