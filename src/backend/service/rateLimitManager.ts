import fs from 'node:fs';
import path from 'node:path';

// Interface para definir tipos de requisição e suas prioridades
// Usando const object ao invés de enum para compatibilidade com Node.js strip-only mode
export const RequestType = {
  CHAT: 'chat',           // Prioridade MÁXIMA - resposta imediata
  ORCAMENTO: 'orcamento', // Segunda prioridade - análise de orçamento
  LEAD: 'lead',          // Terceira prioridade - identificação de lead
  RESUMO: 'resumo',      // Quarta prioridade - geração de resumo
  NOME: 'nome',          // Quinta prioridade - identificação de nome
  INTERESSE: 'interesse' // Sexta prioridade - análise de interesse
} as const;

export type RequestTypeValue = typeof RequestType[keyof typeof RequestType];

// Interface para controle de uso por chave API
interface APIUsage {
  key: string;
  currentUsage: number;
  lastResetTime: number;
  windowMs: number;
}

// Interface para fila de requisições
interface QueuedRequest {
  id: string;
  type: RequestTypeValue;
  chatId: string;
  prompt: string;
  timestamp: number;
  priority: number;
  __dirname?: string;
}

// Classe principal do gerenciador de rate limiting
export class RateLimitManager {
  private apiKeys: Map<string, APIUsage> = new Map();
  private requestQueue: QueuedRequest[] = [];
  private processingQueue = false;
  private readonly WINDOW_MS = 60000; // 1 minuto
  private readonly MAX_RPM_PRIMARY = 60; // Google Gemini
  private readonly MAX_RPM_BACKUP = 120; // Groq total (60 + 60)

  constructor(clientePath?: string) {
    this.loadAPIKeys(clientePath);
    this.startQueueProcessor();
    console.log('✅ RateLimitManager inicializado');
  }

  // Carrega as chaves API do arquivo de configuração
  private loadAPIKeys(clientePath?: string) {
    try {
      // Se clientePath foi fornecido, extrai clientId e clientName
      let clientId = 'CMW';
      let clientName = 'CMW';

      if (clientePath) {
        // Converte caminho para clientId (ex: /caminho/clientes/CMW -> CMW)
        const normalizedPath = path.normalize(clientePath);
        const pathParts = normalizedPath.split(path.sep);
        const clientesIndex = pathParts.indexOf('clientes');

        if (clientesIndex !== -1 && pathParts.length > clientesIndex + 1) {
          clientId = pathParts[clientesIndex + 1];
          clientName = pathParts[clientesIndex + 1];
        }
      }

      const configPath = path.join(process.cwd(), 'clientes', clientId, 'config/infoCliente.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Chaves do Google Gemini
      if (config.GEMINI_KEY) {
        this.apiKeys.set('GEMINI_KEY', {
          key: config.GEMINI_KEY,
          currentUsage: 0,
          lastResetTime: Date.now(),
          windowMs: this.WINDOW_MS
        });
      }

      if (config.GEMINI_KEY_CHAT) {
        this.apiKeys.set('GEMINI_KEY_CHAT', {
          key: config.GEMINI_KEY_CHAT,
          currentUsage: 0,
          lastResetTime: Date.now(),
          windowMs: this.WINDOW_MS
        });
      }

      // Chave do Groq
      if (config.GROQ_KEY) {
        this.apiKeys.set('GROQ_KEY', {
          key: config.GROQ_KEY,
          currentUsage: 0,
          lastResetTime: Date.now(),
          windowMs: this.WINDOW_MS
        });
      }

      console.log(`🔑 Chaves API carregadas: ${this.apiKeys.size}`);
    } catch (error) {
      console.error('❌ Erro ao carregar chaves API:', error);
    }
  }

  // Verifica se uma chave pode fazer uma requisição
  private canMakeRequest(keyType: string): boolean {
    const apiUsage = this.apiKeys.get(keyType);
    if (!apiUsage) return false;

    const now = Date.now();
    const windowStart = now - apiUsage.windowMs;

    // Reseta contador se passou o tempo da janela
    if (apiUsage.lastResetTime < windowStart) {
      apiUsage.currentUsage = 0;
      apiUsage.lastResetTime = now;
    }

    // Verifica limites específicos
    const maxRequests = keyType.includes('GROQ') ? this.MAX_RPM_BACKUP : this.MAX_RPM_PRIMARY;
    return apiUsage.currentUsage < maxRequests;
  }

  // Registra o uso de uma chave API
  private recordAPIUsage(keyType: string) {
    const apiUsage = this.apiKeys.get(keyType);
    if (apiUsage) {
      apiUsage.currentUsage++;
      console.log(`📊 ${keyType}: ${apiUsage.currentUsage}/${apiUsage.currentUsage === this.MAX_RPM_BACKUP ? this.MAX_RPM_BACKUP : this.MAX_RPM_PRIMARY} RPM`);
    }
  }

  // Define prioridades para diferentes tipos de requisição
  private getRequestPriority(type: RequestTypeValue): number {
    const priorities = {
      [RequestType.CHAT]: 100,        // Máxima prioridade
      [RequestType.ORCAMENTO]: 80,    // Segunda prioridade
      [RequestType.LEAD]: 70,         // Terceira prioridade
      [RequestType.RESUMO]: 60,       // Quarta prioridade
      [RequestType.NOME]: 40,         // Quinta prioridade
      [RequestType.INTERESSE]: 30     // Sexta prioridade
    } as const;
    return priorities[type] || 20;
  }

  // Adiciona uma requisição à fila ou processa imediatamente
  async enqueueRequest(
    type: RequestTypeValue,
    chatId: string,
    prompt: string,
    __dirname?: string
  ): Promise<string> {
    const requestId = `${type}_${chatId}_${Date.now()}`;

    // Ponto de verificação: Requisicoes de chat são sempre imediatas
    if (type === RequestType.CHAT) {
      return requestId; // Retorna ID para processamento imediato
    }

    // Verifica se pode processar imediatamente
    const canProcessNow = this.canMakeRequest('GEMINI_KEY') || this.canMakeRequest('GEMINI_KEY_CHAT');

    if (canProcessNow) {
      return requestId; // Retorna ID para processamento imediato
    }

    // Adiciona à fila inteligente
    const queuedRequest: QueuedRequest = {
      id: requestId,
      type,
      chatId,
      prompt,
      timestamp: Date.now(),
      priority: this.getRequestPriority(type),
      __dirname
    };

    // Verifica se já existe requisição similar na fila (deduplicação)
    const existingIndex = this.requestQueue.findIndex(
      req => req.chatId === chatId && req.type === type
    );

    if (existingIndex >= 0) {
      // Remove a requisição antiga e adiciona a nova
      this.requestQueue.splice(existingIndex, 1);
      console.log(`🔄 Deduplicação: removida requisição antiga ${existingIndex} para ${chatId} + ${type}`);
    }

    // Insere na posição correta baseada na prioridade
    const insertIndex = this.requestQueue.findIndex(req => req.priority < queuedRequest.priority);
    if (insertIndex === -1) {
      this.requestQueue.push(queuedRequest);
    } else {
      this.requestQueue.splice(insertIndex, 0, queuedRequest);
    }

    console.log(`📋 Fila: adicionada requisição ${requestId} (${this.requestQueue.length} na fila)`);
    return requestId;
  }

  // Processa a fila de requisições
  private async processQueue() {
    if (this.processingQueue || this.requestQueue.length === 0) return;

    this.processingQueue = true;

    try {
      // Verifica se pode processar alguma requisição da fila
      const canProcessGemini = this.canMakeRequest('GEMINI_KEY') || this.canMakeRequest('GEMINI_KEY_CHAT');
      const canProcessGroq = this.canMakeRequest('GROQ_KEY');

      if (!canProcessGemini && !canProcessGroq) {
        this.processingQueue = false;
        return;
      }

      // Pega a próxima requisição da fila
      const request = this.requestQueue.shift();
      if (!request) {
        this.processingQueue = false;
        return;
      }

      console.log(`🚀 Processando da fila: ${request.id} (${request.type})`);

      // Retorna a requisição para processamento externo
      // O processamento real será feito pelo serviço chamador

    } catch (error) {
      console.error('❌ Erro ao processar fila:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  // Inicia o processador da fila
  private startQueueProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 1000); // Verifica a fila a cada segundo

    // Também processa quando há mudanças nas capacidades
    setInterval(() => {
      this.resetUsageCounters();
    }, this.WINDOW_MS);
  }

  // Reseta contadores de uso
  private resetUsageCounters() {
    const now = Date.now();
    this.apiKeys.forEach((usage, keyType) => {
      if (now - usage.lastResetTime >= usage.windowMs) {
        usage.currentUsage = 0;
        usage.lastResetTime = now;
        console.log(`🔄 Reset contador: ${keyType}`);
      }
    });
  }

  // Obtém próxima requisição da fila (para processamento externo)
  getNextQueuedRequest(): QueuedRequest | null {
    return this.requestQueue.length > 0 ? this.requestQueue[0] : null;
  }

  // Remove uma requisição específica da fila
  removeFromQueue(requestId: string): boolean {
    const index = this.requestQueue.findIndex(req => req.id === requestId);
    if (index >= 0) {
      this.requestQueue.splice(index, 1);
      console.log(`🗑️ Removida da fila: ${requestId}`);
      return true;
    }
    return false;
  }

  // Registra uso bem-sucedido de uma chave
  recordSuccessfulUsage(keyType: string) {
    this.recordAPIUsage(keyType);
  }

  // Verifica se pode fazer requisição imediata
  canProcessImmediately(type: RequestTypeValue): boolean {
    if (type === RequestType.CHAT) {
      return true; // Chat sempre pode ser imediato
    }

    return this.canMakeRequest('GEMINI_KEY') ||
           this.canMakeRequest('GEMINI_KEY_CHAT') ||
           this.canMakeRequest('GROQ_KEY');
  }

  // Obtém estatísticas do sistema
  getStats(): any {
    return {
      queueLength: this.requestQueue.length,
      apiKeys: Array.from(this.apiKeys.entries()).map(([key, usage]) => ({
        key: key.replace(/(.{4}).*(.{4})/, '$1****$2'), // Mascara chave
        currentUsage: usage.currentUsage,
        maxUsage: key.includes('GROQ') ? this.MAX_RPM_BACKUP : this.MAX_RPM_PRIMARY,
        utilizationPercentage: (usage.currentUsage / (key.includes('GROQ') ? this.MAX_RPM_BACKUP : this.MAX_RPM_PRIMARY)) * 100
      })),
      queueByPriority: this.requestQueue.reduce((acc, req) => {
        acc[req.type] = (acc[req.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

// Exporta instância única
export const rateLimitManager = new RateLimitManager();