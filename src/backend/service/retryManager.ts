// Interface para controle de tentativas por chat
interface RetryAttempt {
  chatId: string;
  attemptCount: number;
  lastAttemptTime: number;
  needsSuggestedResponse: boolean;
  suggestedResponse?: string;
}

// Interface para resultado do retry
export interface RetryResult {
  shouldRetry: boolean;
  attemptNumber: number;
  useSuggestedResponse: boolean;
  suggestedResponse?: string;
  waitTimeMs: number;
}

// Gerenciador de tentativas inteligente
export class RetryManager {
  private retryAttempts: Map<string, RetryAttempt> = new Map();
  private readonly maxAttempts = 3;
  private readonly baseWaitTime = 1000; // 1 segundo
  private readonly maxWaitTime = 5000; // 5 segundos

  // Registra uma tentativa de melhoria
  registerAttempt(
    chatId: string,
    needsSuggestedResponse: boolean = false,
    suggestedResponse?: string
  ): void {
    const existing = this.retryAttempts.get(chatId);
    const now = Date.now();

    if (existing) {
      existing.attemptCount++;
      existing.lastAttemptTime = now;
      existing.needsSuggestedResponse = needsSuggestedResponse;
      existing.suggestedResponse = suggestedResponse;
    } else {
      this.retryAttempts.set(chatId, {
        chatId,
        attemptCount: 1,
        lastAttemptTime: now,
        needsSuggestedResponse,
        suggestedResponse
      });
    }
  }

  // Determina se deve tentar novamente e como proceder
  shouldRetry(chatId: string): RetryResult {
    const attempt = this.retryAttempts.get(chatId);

    if (!attempt) {
      // Primeira tentativa
      return {
        shouldRetry: false,
        attemptNumber: 0,
        useSuggestedResponse: false,
        waitTimeMs: 0
      };
    }

    const currentAttempt = attempt.attemptCount;

    if (currentAttempt >= this.maxAttempts) {
      // Última tentativa - usar resposta sugerida se disponível
      return {
        shouldRetry: false,
        attemptNumber: currentAttempt,
        useSuggestedResponse: attempt.needsSuggestedResponse,
        suggestedResponse: attempt.suggestedResponse,
        waitTimeMs: 0
      };
    }

    // Próxima tentativa
    const waitTime = Math.min(
      this.baseWaitTime * Math.pow(1.5, currentAttempt - 1),
      this.maxWaitTime
    );

    return {
      shouldRetry: true,
      attemptNumber: currentAttempt + 1,
      useSuggestedResponse: false,
      waitTimeMs: waitTime
    };
  }

  // Reseta contador para um chat (quando bem-sucedido)
  resetAttempts(chatId: string): void {
    this.retryAttempts.delete(chatId);
  }

  // Obtém estatísticas de tentativas para monitoramento
  getStats(chatId?: string): {
    totalAttempts: number;
    attemptsByChat: Record<string, number>;
    successRate: number;
  } {
    if (chatId) {
      const attempt = this.retryAttempts.get(chatId);
      return {
        totalAttempts: attempt?.attemptCount || 0,
        attemptsByChat: { [chatId]: attempt?.attemptCount || 0 },
        successRate: attempt?.attemptCount ? (attempt.attemptCount < this.maxAttempts ? 1 : 0) : 1
      };
    }

    const attemptsByChat: Record<string, number> = {};
    let totalAttempts = 0;

    for (const [id, attempt] of this.retryAttempts) {
      attemptsByChat[id] = attempt.attemptCount;
      totalAttempts += attempt.attemptCount;
    }

    return {
      totalAttempts,
      attemptsByChat,
      successRate: totalAttempts > 0 ? (Object.values(attemptsByChat).filter(count => count < this.maxAttempts).length / Object.keys(attemptsByChat).length) : 1
    };
  }

  // Limpa tentativas antigas (útil para limpeza de memória)
  cleanupOldAttempts(maxAgeMs: number = 3600000): number { // 1 hora por padrão
    const now = Date.now();
    let cleanedCount = 0;

    for (const [chatId, attempt] of this.retryAttempts) {
      if (now - attempt.lastAttemptTime > maxAgeMs) {
        this.retryAttempts.delete(chatId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Obtém tentativa atual para um chat
  getCurrentAttempt(chatId: string): RetryAttempt | null {
    return this.retryAttempts.get(chatId) || null;
  }

  // Força reset para um chat específico (útil para testes)
  forceReset(chatId: string): void {
    this.retryAttempts.delete(chatId);
  }
}