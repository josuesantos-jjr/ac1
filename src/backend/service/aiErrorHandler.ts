/**
 * Utilitários para tratamento de erros de serviços de IA
 * Google Gemini, Groq, OpenAI, etc.
 */

/**
 * Detecta se um erro é do Google Gemini indicando modelo sobrecarregado (503)
 */
export function isGeminiOverloadedError(error: any): boolean {
  return error?.message?.includes('[503 Service Unavailable]') && 
         error?.message?.includes('model is overloaded');
}

/**
 * Detecta se um erro é do Groq indicando formato de mensagem incompatível
 */
export function isGroqIncompatibleFormatError(error: any): boolean {
  return error?.message?.includes('property \'parts\' is unsupported') ||
         error?.message?.includes('messages.0') && error?.message?.includes('role:user');
}

/**
 * Extrai o tempo de espera recomendado baseado no tipo de erro
 */
export function getRecommendedWaitTime(error: any, retries: number): number {
  // Erros específicos com tempos otimizados
  if (isGeminiOverloadedError(error)) {
    // Google Gemini sobrecarregado: espera progressivamente maior
    const baseTime = 3000; // 3 segundos base
    const multiplier = Math.min(retries + 1, 5); // Máximo 5x
    return baseTime * multiplier;
  }
  
  if (isGroqIncompatibleFormatError(error)) {
    // Erro de formato: retry rápido
    return 1000; // 1 segundo
  }
  
  // Fallback: tempo progressivo baseado no número de tentativas
  const baseTime = 2000; // 2 segundos
  const exponentialBackoff = Math.min(1000 * Math.pow(2, retries), 15000); // Máximo 15 segundos
  return Math.max(baseTime, exponentialBackoff);
}

/**
 * Determina se um erro é recuperável (pode tentar novamente)
 */
export function isRecoverableError(error: any): boolean {
  // Erros recuperáveis
  const recoverablePatterns = [
    '503 Service Unavailable',
    'model is overloaded',
    'rate limit',
    '429',
    'timeout',
    'connection',
    'network',
    'temporarily unavailable'
  ];
  
  const errorMessage = error?.message?.toLowerCase() || '';
  
  return recoverablePatterns.some(pattern => 
    errorMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Determina se um erro é crítico (não deve tentar novamente)
 */
export function isCriticalError(error: any): boolean {
  // Erros críticos
  const criticalPatterns = [
    'invalid api key',
    'unauthorized',
    'forbidden',
    'quota exceeded',
    'billing',
    'payment required'
  ];
  
  const errorMessage = error?.message?.toLowerCase() || '';
  
  return criticalPatterns.some(pattern => 
    errorMessage.includes(pattern)
  );
}

/**
 * Função de retry inteligente com diferentes estratégias por tipo de erro
 */
export async function intelligentRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  operationName: string = 'operação'
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Tentativa ${attempt}/${maxRetries} falhou em ${operationName}:`, errorMessage);
      
      // Se é erro crítico, não tenta novamente
      if (isCriticalError(error)) {
        console.error(`🚫 Erro crítico detectado em ${operationName}, abortando retry`);
        break;
      }
      
      // Se é a última tentativa, para
      if (attempt === maxRetries) {
        break;
      }
      
      // Se não é erro recuperável, para
      if (!isRecoverableError(error)) {
        console.warn(`⚠️ Erro não recuperável em ${operationName}, abortando retry`);
        break;
      }
      
      // Calcula tempo de espera inteligente
      const waitTime = getRecommendedWaitTime(error, attempt - 1);
      
      console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa (${operationName})...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error(`💀 Todas as tentativas falharam para ${operationName}`);
  throw lastError;
}

/**
 * Estrutura padrão para resposta de erro de IA
 */
export interface AIErrorResponse {
  success: false;
  error: string;
  errorType: 'critical' | 'recoverable' | 'unknown';
  canRetry: boolean;
  recommendedWaitTime?: number;
  attemptCount?: number;
  fallbackUsed?: boolean;
}

/**
 * Cria uma resposta de erro padronizada
 */
export function createAIErrorResponse(
  error: any,
  canRetry: boolean = false,
  recommendedWaitTime?: number,
  attemptCount: number = 1
): AIErrorResponse {
  return {
    success: false,
    error: error.message || 'Erro desconhecido',
    errorType: isCriticalError(error) ? 'critical' : (isRecoverableError(error) ? 'recoverable' : 'unknown'),
    canRetry: canRetry && !isCriticalError(error),
    recommendedWaitTime,
    attemptCount,
    fallbackUsed: false
  };
}

/**
 * Função para converter histórico entre formatos de diferentes APIs
 */
export function convertHistoryForAPI(history: any[], targetAPI: 'groq' | 'openai' | 'gemini'): any[] {
  if (!Array.isArray(history)) return [];
  
  return history.map(entry => {
    // Converte para formato padrão primeiro
    let content = entry.content;
    
    if (entry.parts && Array.isArray(entry.parts)) {
      content = entry.parts
        .map((part: any) => part.text || '')
        .join('\n')
        .trim();
    }
    
    // Converte para formato do API alvo
    switch (targetAPI) {
      case 'groq':
      case 'openai':
        return {
          role: entry.role,
          content: content || ''
        };
      case 'gemini':
        return {
          role: entry.role,
          parts: [{ text: content || '' }]
        };
      default:
        return entry;
    }
  });
}