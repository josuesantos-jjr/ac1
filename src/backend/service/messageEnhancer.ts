// Interface para contexto de melhoria de mensagem
export interface EnhancementContext {
  originalMessage: string;
  conversationHistory: string;
  clientName?: string;
  validationIssues: Array<{
    ruleId: string;
    ruleName: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  attemptNumber: number;
  chatId: string;
}

// Interface para resultado da melhoria
export interface EnhancementResult {
  enhancedMessage: string;
  improvementType: 'none' | 'rephrased' | 'alternative' | 'fallback';
  confidence: number;
  reasoning: string;
}

// Melhorador de mensagens baseado em validações
export class MessageEnhancer {
  private readonly maxEnhancementLength = 500; // caracteres

  // Melhora uma mensagem baseada no contexto de validação
  async enhanceMessage(context: EnhancementContext): Promise<EnhancementResult> {
    const { originalMessage, validationIssues, attemptNumber, chatId } = context;

    // Se não há problemas, retorna mensagem original
    if (validationIssues.length === 0) {
      return {
        enhancedMessage: originalMessage,
        improvementType: 'none',
        confidence: 1.0,
        reasoning: 'Nenhum problema detectado na mensagem'
      };
    }

    // Na terceira tentativa, tenta usar resposta sugerida mais simples
    if (attemptNumber >= 3) {
      const fallbackResponse = this.generateFallbackResponse(context);
      if (fallbackResponse) {
        return {
          enhancedMessage: fallbackResponse,
          improvementType: 'fallback',
          confidence: 0.8,
          reasoning: 'Usando resposta alternativa após múltiplas tentativas'
        };
      }
    }

    // Gera mensagem melhorada baseada no tipo de problema
    const primaryIssue = validationIssues[0]; // Pega o primeiro problema

    switch (primaryIssue.ruleId) {
      case 'repetitive_greeting':
        return await this.handleRepetitiveGreeting(context);

      case 'excessive_presentation':
        return this.handleExcessivePresentation(context);

      case 'keyphrase_repetition':
        return this.handleKeyphraseRepetition(context);

      default:
        return this.handleGenericImprovement(context);
    }
  }

  // Trata repetição de saudações
  private async handleRepetitiveGreeting(context: EnhancementContext): Promise<EnhancementResult> {
    const { originalMessage, clientName } = context;

    // Remove saudações repetitivas
    let improved = originalMessage
      .replace(/\b(olá|ola|oi|bom dia|boa tarde|boa noite)\s*\w*,?\s*/gi, '')
      .replace(/\b(olá|ola|oi|bom dia|boa tarde|boa noite)\s*/gi, '')
      .trim();

    // Se ficou muito curta, gera alternativa contextual
    if (improved.length < 20) {
      improved = this.generateContextualResponse(context, 'greeting_removed');
    }

    return {
      enhancedMessage: improved,
      improvementType: 'rephrased',
      confidence: 0.9,
      reasoning: 'Removida saudação repetitiva'
    };
  }

  // Trata apresentação excessiva
  private handleExcessivePresentation(context: EnhancementContext): Promise<EnhancementResult> {
    const { originalMessage } = context;

    // Remove apresentações repetitivas
    let improved = originalMessage
      .replace(/\b(sou (a )?mara|me chamo mara|prazer,?\s+\w+)\b/gi, '')
      .trim();

    if (improved.length < 20) {
      improved = this.generateContextualResponse(context, 'presentation_removed');
    }

    return Promise.resolve({
      enhancedMessage: improved,
      improvementType: 'rephrased',
      confidence: 0.9,
      reasoning: 'Removida apresentação repetitiva'
    });
  }

  // Trata repetição de frases-chave
  private handleKeyphraseRepetition(context: EnhancementContext): Promise<EnhancementResult> {
    const { originalMessage } = context;

    // Remove frases promocionais repetitivas
    let improved = originalMessage
      .replace(/\b(especialista em primeiro imóvel|entrada parcelada|documentação grátis|residencial barcelona)\b/gi, '')
      .trim();

    // Remove múltiplos espaços
    improved = improved.replace(/\s+/g, ' ');

    if (improved.length < 20) {
      improved = this.generateContextualResponse(context, 'keyphrases_removed');
    }

    return Promise.resolve({
      enhancedMessage: improved,
      improvementType: 'rephrased',
      confidence: 0.8,
      reasoning: 'Removidas frases promocionais repetitivas'
    });
  }

  // Trata melhoria genérica
  private async handleGenericImprovement(context: EnhancementContext): Promise<EnhancementResult> {
    // Usa IA para gerar melhoria genérica
    try {
      const { mainGoogleBG } = await import('./googleBG.ts');

      const prompt = `Melhore a seguinte mensagem removendo repetições e tornando-a mais natural e direta:

Mensagem original: "${context.originalMessage}"

Histórico da conversa: "${context.conversationHistory}"

Problemas identificados: ${context.validationIssues.map(i => i.description).join(', ')}

Gere uma versão melhorada que:
1. Seja mais concisa e direta
2. Evite repetições
3. Mantenha o tom profissional
4. Foque no objetivo principal

Responda apenas com a mensagem melhorada.`;

      const improvedResponse = await mainGoogleBG({
        currentMessageBG: prompt,
        chatId: 'enhancer_' + context.chatId,
        clearHistory: true,
        __dirname: process.cwd()
      });

      return {
        enhancedMessage: improvedResponse.trim(),
        improvementType: 'rephrased',
        confidence: 0.7,
        reasoning: 'Melhoria genérica usando IA'
      };

    } catch (error) {
      console.error('Erro ao melhorar mensagem:', error);
      return {
        enhancedMessage: context.originalMessage,
        improvementType: 'none',
        confidence: 0.5,
        reasoning: 'Erro na melhoria, mantendo original'
      };
    }
  }

  // Gera resposta alternativa baseada no contexto
  private generateContextualResponse(context: EnhancementContext, issueType: string): string {
    const { clientName, conversationHistory } = context;
    const namePart = clientName ? `, ${clientName}` : '';

    // Analisa o histórico para gerar resposta contextual
    const lowerHistory = conversationHistory.toLowerCase();

    if (lowerHistory.includes('quanto custa') || lowerHistory.includes('valor')) {
      return `Entendi sua pergunta sobre valores${namePart}! Para te dar uma informação precisa, preciso de mais alguns detalhes.`;
    }

    if (lowerHistory.includes('fgts') || lowerHistory.includes('entrada')) {
      return `Ótimo${namePart}! Com FGTS ou entrada, suas condições ficam ainda melhores. Posso te explicar como funciona?`;
    }

    if (lowerHistory.includes('cidade') || lowerHistory.includes('localização')) {
      return `Perfeito${namePart}! Em qual cidade você está buscando seu imóvel?`;
    }

    if (lowerHistory.includes('renda') || lowerHistory.includes('salário')) {
      return `Compreendi${namePart}! Qual seria a sua renda familiar mensal aproximada?`;
    }

    // Resposta padrão
    return `Certo${namePart}! Podemos continuar? O que gostaria de saber sobre seu imóvel?`;
  }

  // Gera resposta de fallback para múltiplas tentativas
  private generateFallbackResponse(context: EnhancementContext): string | null {
    const { clientName, conversationHistory } = context;
    const namePart = clientName ? `, ${clientName}` : '';

    // Respostas simples e diretas para quando tudo falha
    const fallbackResponses = [
      `Olá${namePart}! Em que posso ajudar?`,
      `Pois não${namePart}?`,
      `Diga-me${namePart}, como posso auxiliar?`,
      `Estou aqui para ajudar${namePart}. O que precisa?`,
      `Olá${namePart}! Pronto para atendê-lo.`
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  // Valida se a mensagem melhorada é significativamente diferente
  isSignificantlyDifferent(original: string, enhanced: string): boolean {
    const originalNormalized = original.toLowerCase().trim();
    const enhancedNormalized = enhanced.toLowerCase().trim();

    // Verifica se o tamanho mudou significativamente
    const lengthDiff = Math.abs(original.length - enhanced.length);
    const lengthRatio = lengthDiff / Math.max(original.length, enhanced.length);

    // Verifica se o conteúdo mudou significativamente
    const wordsOriginal = new Set(originalNormalized.split(/\s+/));
    const wordsEnhanced = new Set(enhancedNormalized.split(/\s+/));
    const intersection = new Set([...wordsOriginal].filter(x => wordsEnhanced.has(x)));
    const union = new Set([...wordsOriginal, ...wordsEnhanced]);
    const jaccardSimilarity = intersection.size / union.size;

    // Considera significativamente diferente se:
    // - Razão de tamanho > 20%, OU
    // - Similaridade de Jaccard < 0.7
    return lengthRatio > 0.2 || jaccardSimilarity < 0.7;
  }
}