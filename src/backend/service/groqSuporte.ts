import { Groq } from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { mainOllamaService } from './ollamaService.ts';

// Função para converter histórico do formato Gemini (parts) para formato Groq/OpenAI (content)
function convertGeminiHistoryToGroq(history: any[]): any[] {
  if (!Array.isArray(history)) return [];
  
  return history.map(entry => {
    if (entry.role === 'user' || entry.role === 'assistant') {
      // Converte 'parts' para 'content' se existir
      let content = entry.content;
      
      if (entry.parts && Array.isArray(entry.parts) && entry.parts.length > 0) {
        // Junta todos os parts em uma string
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
        role: entry.role,
        content: content || ''
      };
    }
    return entry;
  }).filter(entry => entry.role === 'user' || entry.role === 'assistant');
}

/**
 * Função para detectar erros 503 do Google Gemini (modelo sobrecarregado)
 */
export function isGoogleGeminiOverloadedError(error: any): boolean {
  return error?.message?.includes('[503 Service Unavailable]') && 
         error?.message?.includes('model is overloaded');
}

/**
 * Função para extrair tempo de espera recomendado dos erros 503
 */
export function getRecommendedWaitTime(error: any): number {
  // Tenta encontrar um tempo de espera na mensagem de erro
  const match = error?.message?.match(/wait\s+(\d+)\s*(?:ms|seconds?|sec|s)/i);
  if (match) {
    const value = parseInt(match[1]);
    // Converte para milissegundos se necessário
    if (match[2]?.toLowerCase().includes('s')) {
      return value * 1000;
    }
    return value;
  }
  
  // Tempo padrão baseado no tipo de erro
  if (isGoogleGeminiOverloadedError(error)) {
    return 5000; // 5 segundos para modelo sobrecarregado
  }
  
  return 2000; // 2 segundos padrão
}

// Modelos disponíveis com seus limites de RPM
interface GroqModel {
  name: string;
  rpm: number;
  currentUsage: number;
  lastResetTime: number;
}

// Estado dos modelos Groq
const groqModels: GroqModel[] = [
  { name: 'qwen/qwen3-32b', rpm: 60, currentUsage: 0, lastResetTime: Date.now() },
  { name: 'moonshotai/kimi-k2-instruct-0905', rpm: 60, currentUsage: 0, lastResetTime: Date.now() }
];

// Classe para gerenciar o serviço Groq
class GroqService {
  private groq!: Groq; // Inicialização definitiva no construtor
  private models: GroqModel[];
  private clientePath: string;

  constructor(clientePath: string) {
    this.clientePath = clientePath;
    this.models = groqModels;
    this.initializeGroq();
  }

  private initializeGroq() {
    try {
      // Busca a chave do arquivo de configuração do cliente específico
      const configPath = path.join(this.clientePath, 'config/infoCliente.json');

      if (!fs.existsSync(configPath)) {
        throw new Error(`Arquivo infoCliente.json não encontrado em: ${configPath}`);
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      let groqKey = config.GROQ_KEY;
      const groqKeyReserva = config.GROQ_KEY_RESERVA;

      if (!groqKey) {
        throw new Error(`GROQ_KEY não encontrada no arquivo ${configPath}`);
      }

      this.groq = new Groq({
        apiKey: groqKey,
      });

      console.log(`✅ Serviço Groq inicializado para cliente: ${path.basename(this.clientePath)}`);
    } catch (error) {
      console.error(`❌ Erro ao inicializar serviço Groq para ${this.clientePath}:`, error);
      throw error;
    }
  }

  // Verifica se um modelo está disponível (não excedeu o limite de RPM)
  private isModelAvailable(modelName: string): boolean {
    const model = this.models.find(m => m.name === modelName);
    if (!model) return false;

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Reseta o contador se passou 1 minuto
    if (model.lastResetTime < oneMinuteAgo) {
      model.currentUsage = 0;
      model.lastResetTime = now;
    }

    return model.currentUsage < model.rpm;
  }

  // Obtém o próximo modelo disponível
  private getNextAvailableModel(): string {
    const now = Date.now();

    // Primeiro tenta o modelo primário se disponível
    if (this.isModelAvailable('qwen/qwen3-32b')) {
      return 'qwen/qwen3-32b';
    }

    // Se não disponível, tenta o modelo secundário
    if (this.isModelAvailable('moonshotai/kimi-k2-instruct-0905')) {
      return 'moonshotai/kimi-k2-instruct-0905';
    }

    // Se ambos atingiram o limite, retorna o modelo primário (será tratado pelo rate limiting externo)
    return 'qwen/qwen3-32b';
  }

  // Registra o uso de um modelo
  private recordModelUsage(modelName: string) {
    const model = this.models.find(m => m.name === modelName);
    if (model) {
      model.currentUsage++;
      console.log(`📊 Modelo ${modelName}: ${model.currentUsage}/${model.rpm} RPM usado`);
    }
  }

  // Método principal para gerar resposta usando Groq
  async generateResponse(prompt: string, chatId?: string, history?: any[]): Promise<string> {
    const startTime = Date.now();
    const modelName = this.getNextAvailableModel();

    console.log(`🚀 Groq usando modelo: ${modelName} para chatId: ${chatId || 'N/A'}`);

    try {
      // Ponto de verificação: Verifica se a instância do Groq está válida
      if (!this.groq) {
        throw new Error('Instância do Groq não inicializada');
      }

      // Converte o histórico do formato Gemini para formato Groq se necessário
      const convertedHistory = convertGeminiHistoryToGroq(history || []);

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          ...(convertedHistory || []), // Usa o histórico convertido
          {
            role: "user",
            content: prompt
          }
        ],
        model: modelName,
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 0.95,
        stream: false, // Não usar streaming para compatibilidade
        reasoning_effort: "low",
        stop: null
      });

      // Ponto de verificação: Verifica se a resposta é válida
      if (!chatCompletion?.choices?.[0]?.message?.content) {
        throw new Error('Resposta inválida do Groq');
      }

      const response = chatCompletion.choices[0].message.content;

      // Registra o uso do modelo
      this.recordModelUsage(modelName);

      const duration = Date.now() - startTime;
      console.log(`✅ Groq respondeu em ${duration}ms usando ${modelName}: ${response.substring(0, 100)}...`);

      return response;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Erro no Groq (${duration}ms):`, error.message);

      // Ponto de verificação: Tenta identificar o tipo de erro
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        console.warn(`⚠️ Rate limit atingido no modelo ${modelName}, tentando próximo modelo...`);
        // Em caso de rate limit, registra o uso mesmo assim para evitar loop infinito
        this.recordModelUsage(modelName);
      }

      // Ponto de verificação: Erro específico para formato de mensagem incompatível
      if (error.message?.includes('property \'parts\' is unsupported')) {
        console.error(`❌ Formato de histórico incompatível detectado. Tente novamente...`);
      }

      throw error;
    }
  }

  // Método para verificar status dos modelos
  getModelsStatus(): any {
    return this.models.map(model => ({
      name: model.name,
      rpm: model.rpm,
      currentUsage: model.currentUsage,
      available: model.currentUsage < model.rpm,
      utilizationPercentage: (model.currentUsage / model.rpm) * 100
    }));
  }
}

// Factory function para criar instância do serviço Groq por cliente
export const createGroqService = (clientePath: string) => {
  return new GroqService(clientePath);
};

// Função principal compatível com a interface existente
export const mainGroqSuporte = async ({
  currentMessage,
  chatId,
  clearHistory = true,
  maxRetries = 3,
  __dirname,
  history // Adiciona o histórico aqui
}: {
  currentMessage: string;
  chatId?: string;
  clearHistory?: boolean;
  maxRetries?: number;
  __dirname: string;
  history?: any[]; // Adiciona o tipo para o histórico
}): Promise<string> => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Ponto de verificação: Verifica se a mensagem não está vazia
      if (!currentMessage || currentMessage.trim() === '') {
        console.warn('⚠️ Mensagem vazia fornecida ao Groq');
        return 'Mensagem vazia fornecida';
      }

      // Cria instância específica do cliente
      const groqService = createGroqService(__dirname);
      return await groqService.generateResponse(currentMessage, chatId, history);

    } catch (error: any) {
      retries++;
      console.error(`❌ Tentativa ${retries}/${maxRetries} falhou no Groq:`, error.message);

      // Ponto de verificação: Se é erro de autenticação, não tenta novamente
      if (error.message?.includes('Invalid API key') || error.message?.includes('unauthorized')) {
        console.error('🚫 Erro de autenticação no Groq, chave inválida');
        return 'Erro de autenticação na API Groq';
      }

      // Se ainda há tentativas, espera antes de tentar novamente
      if (retries < maxRetries) {
        const backoffTime = Math.min(1000 * Math.pow(2, retries), 10000); // Máximo 10 segundos
        console.log(`⏳ Aguardando ${backoffTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }

  // Se todas as tentativas falharam, tenta fallback para Ollama
  console.log('🔄 Todas as tentativas no Groq falharam, tentando Ollama...');
  try {
    const ollamaResponse = await mainOllamaService({
      currentMessage,
      chatId,
      clearHistory,
      maxRetries: 2, // Menos tentativas no fallback
      __dirname,
      history
    });

    console.log(`✅ Fallback Ollama funcionou`);
    return ollamaResponse;

  } catch (ollamaError: any) {
    console.error('💀 Falha completa: Groq e Ollama falharam');
    console.error('Erro do Ollama:', ollamaError.message);
    return 'Erro: Todos os serviços de IA temporariamente indisponíveis';
  }
};