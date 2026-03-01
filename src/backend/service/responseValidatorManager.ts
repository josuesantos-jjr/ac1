// Interface para estrutura de validação
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  prompt: string;
  suggestedResponses: string[];
  severity: 'low' | 'medium' | 'high';
}

import { syncManager } from '../../database/sync.ts';

// Interface para resultado da análise
export interface ValidationResult {
  needsImprovement: boolean;
  issues: Array<{
    ruleId: string;
    ruleName: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  suggestedResponse?: string;
  confidence: number;
}

// Gerenciador de validações de resposta
export class ResponseValidatorManager {
  private validationRules: ValidationRule[] = [];
  private configPath: string;

  constructor(configPath: string) {
    this.configPath = configPath;
    this.loadValidationRules();
  }

  // Carrega regras de validação da configuração
  private loadValidationRules(): void {
    try {
      const fs = require('fs');
      const path = require('path');

      const configFile = path.join(this.configPath, 'config', 'responseValidators.json');

      if (fs.existsSync(configFile)) {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        this.validationRules = config.rules || [];
      } else {
        // Cria configuração padrão se não existir
        this.createDefaultConfig();
      }
    } catch (error) {
      console.error('Erro ao carregar regras de validação:', error);
      this.createDefaultConfig();
    }
  }

  // Cria configuração padrão
  private createDefaultConfig(): void {
    const fs = require('fs');
    const path = require('path');

    const defaultConfig = {
      rules: [
        {
          id: 'repetitive_greeting',
          name: 'Saudação Repetitiva',
          description: 'Detecta quando a IA repete saudações excessivamente',
          isActive: true,
          prompt: `Analise a seguinte conversa e determine se há repetição de saudações. Responda APENAS com JSON no formato especificado.

Histórico da conversa:
{history}

Mensagem atual da IA:
{current_response}

Responda com JSON:
{
  "repetitive_greeting": true/false,
  "confidence": 0.0-1.0,
  "description": "explicação breve se verdadeiro"
}`,
          suggestedResponses: [
            'Entendi sua dúvida! Vamos direto ao assunto.',
            'Ótimo, vamos prosseguir com sua consulta.',
            'Perfeito! Que tal continuarmos?'
          ],
          severity: 'medium' as const
        },
        {
          id: 'excessive_presentation',
          name: 'Apresentação Excessiva',
          description: 'Detecta quando a IA se apresenta repetidamente',
          isActive: true,
          prompt: `Analise se a IA está se apresentando repetidamente na conversa. Responda APENAS com JSON.

Histórico da conversa:
{history}

Mensagem atual da IA:
{current_response}

Responda com JSON:
{
  "excessive_presentation": true/false,
  "confidence": 0.0-1.0,
  "description": "explicação breve se verdadeiro"
}`,
          suggestedResponses: [
            'Já nos conhecemos, vamos ao que interessa.',
            'Podemos pular as apresentações formais desta vez.',
            'Vamos direto ao ponto da sua dúvida.'
          ],
          severity: 'low' as const
        },
        {
          id: 'keyphrase_repetition',
          name: 'Repetição de Frases-Chave',
          description: 'Detecta repetição excessiva de frases promocionais',
          isActive: true,
          prompt: `Verifique se há repetição de frases-chave como "especialista em primeiro imóvel", "entrada parcelada", etc. Responda APENAS com JSON.

Histórico da conversa:
{history}

Mensagem atual da IA:
{current_response}

Responda com JSON:
{
  "keyphrase_repetition": true/false,
  "confidence": 0.0-1.0,
  "description": "explicação breve se verdadeiro"
}`,
          suggestedResponses: [
            'Você já conhece nossos diferenciais.',
            'Vamos focar na sua necessidade específica.',
            'O que você gostaria de saber sobre seu imóvel?'
          ],
          severity: 'high' as const
        }
      ]
    };

    try {
      const configFile = path.join(this.configPath, 'config', 'responseValidators.json');
      const configDir = path.dirname(configFile);

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
      this.validationRules = defaultConfig.rules as ValidationRule[];
    } catch (error) {
      console.error('Erro ao criar configuração padrão:', error);
    }
  }

  // Valida uma resposta usando todas as regras ativas
  async validateResponse(
    currentResponse: string,
    conversationHistory: string,
    chatId: string
  ): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    let maxConfidence = 0;

    // Verifica cada regra ativa
    for (const rule of this.validationRules.filter(r => r.isActive)) {
      try {
        const analysis = await this.analyzeWithRule(rule, currentResponse, conversationHistory);

        if (analysis.needsImprovement) {
          issues.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            description: analysis.description
          });

          if (analysis.confidence > maxConfidence) {
            maxConfidence = analysis.confidence;
          }
        }
      } catch (error) {
        console.error(`Erro ao validar regra ${rule.id}:`, error);
      }
    }

    return {
      needsImprovement: issues.length > 0,
      issues,
      confidence: maxConfidence
    };
  }

  // Analisa usando uma regra específica
  private async analyzeWithRule(
    rule: ValidationRule,
    currentResponse: string,
    conversationHistory: string
  ): Promise<{ needsImprovement: boolean; confidence: number; description: string }> {
    try {
      const { mainGoogleBG } = await import('./googleBG.ts');

      // Prepara o prompt substituindo as variáveis
      const prompt = rule.prompt
        .replace('{current_response}', currentResponse)
        .replace('{history}', conversationHistory);

      const response = await mainGoogleBG({
        currentMessageBG: prompt,
        chatId: 'validator_' + rule.id,
        clearHistory: true,
        __dirname: process.cwd()
      });

      // Interpreta a resposta JSON da IA
      const cleanedResponse = response.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(cleanedResponse);

      // Verifica se a regra específica foi violada
      const needsImprovement = this.checkRuleViolation(rule.id, analysis);

      return {
        needsImprovement,
        confidence: analysis.confidence || 0.5,
        description: analysis.description || 'Problema detectado'
      };

    } catch (error) {
      console.error(`Erro na análise da regra ${rule.id}:`, error);
      return {
        needsImprovement: false,
        confidence: 0,
        description: ''
      };
    }
  }

  // Verifica se uma regra específica foi violada
  private checkRuleViolation(ruleId: string, analysis: any): boolean {
    switch (ruleId) {
      case 'repetitive_greeting':
        return analysis.repetitive_greeting === true;
      case 'excessive_presentation':
        return analysis.excessive_presentation === true;
      case 'keyphrase_repetition':
        return analysis.keyphrase_repetition === true;
      default:
        return false;
    }
  }

  // Obtém resposta sugerida baseada nas regras violadas
  getSuggestedResponse(validationResult: ValidationResult): string | null {
    if (!validationResult.needsImprovement || validationResult.issues.length === 0) {
      return null;
    }

    // Pega a primeira regra violada e retorna uma resposta sugerida
    const firstIssue = validationResult.issues[0];
    const rule = this.validationRules.find(r => r.id === firstIssue.ruleId);

    if (rule && rule.suggestedResponses.length > 0) {
      const randomIndex = Math.floor(Math.random() * rule.suggestedResponses.length);
      return rule.suggestedResponses[randomIndex];
    }

    return null;
  }

  // Recarrega configurações (útil para hot reload)
  reloadConfig(): void {
    this.loadValidationRules();
  }
}