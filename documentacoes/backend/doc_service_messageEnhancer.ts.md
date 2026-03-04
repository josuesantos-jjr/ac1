# Documentação do Arquivo: src/backend/service/messageEnhancer.ts

## Nome do Arquivo
`src/backend/service/messageEnhancer.ts`

## Propósito
Este arquivo implementa o `MessageEnhancer`, um serviço inteligente para melhoria automática de mensagens de chat baseado em regras de validação. Corrige problemas comuns em conversas automatizadas como repetições de saudações, apresentações excessivas e frases promocionais repetitivas. Atua como um pós-processador que garante qualidade conversacional, gerando alternativas contextuais quando necessário e usando IA para melhorias complexas.

## Funcionamento
O serviço opera como um corretor inteligente de mensagens:

1. **Análise de Problemas**: Recebe lista de problemas identificados por validação (saudações repetitivas, apresentações excessivas, etc.).
2. **Seleção de Estratégia**: Escolhe método de correção baseado no tipo de problema principal.
3. **Correção Direta**: Para problemas simples, aplica correções baseadas em regex (remoção de saudações, apresentações).
4. **Geração Contextual**: Para mensagens muito curtas após correção, gera respostas alternativas baseadas no histórico.
5. **Melhoria por IA**: Para problemas complexos, usa GoogleBG para reescrever mensagens inteiras.
6. **Fallback Seguro**: Após múltiplas tentativas, usa respostas simples e diretas.
7. **Validação de Diferença**: Verifica se a mensagem melhorada é significativamente diferente da original.

O algoritmo prioriza correções diretas para performance, recorrendo à IA apenas quando necessário, com fallbacks seguros.

## Entrada de Informações
- **context** (parâmetro `EnhancementContext`): Objeto contendo:
  - `originalMessage`: Mensagem original a ser melhorada.
  - `conversationHistory`: Histórico da conversa para contexto.
  - `clientName`: Nome do cliente (opcional).
  - `validationIssues`: Array de problemas identificados com severidade.
  - `attemptNumber`: Número da tentativa atual.
  - `chatId`: ID do chat para contexto.

As informações são recebidas de:
- Sistemas de validação de mensagens (como `googlechat.ts`).
- Histórico de conversas armazenado.
- Contadores de tentativas de melhoria.

## Processamento de Informações
- **Validação**: Verifica se há problemas para corrigir, conta tentativas.
- **Transformação**: Aplica regex para remover elementos repetitivos, reestrutura frases.
- **Cálculos**: Mede diferença significativa usando similaridade de Jaccard e diferença de tamanho.
- **Filtros**: Remove saudações, apresentações, frases-chave repetitivas usando padrões regex.
- **Controle de Fluxo**: Escolhe estratégia baseada no tipo de problema e número de tentativas.

## Saída de Informações
- **EnhancementResult**: Objeto contendo:
  - `enhancedMessage`: Mensagem melhorada.
  - `improvementType`: Tipo de melhoria ('none', 'rephrased', 'alternative', 'fallback').
  - `confidence`: Nível de confiança na melhoria (0.0-1.0).
  - `reasoning`: Explicação da melhoria aplicada.

As saídas são destinadas a:
- Sistemas de chat (mensagens melhoradas para envio).
- Sistema de validação (feedback sobre qualidade).
- Logs de auditoria (rastreamento de melhorias).

## Dependências
- **Módulos Locais**: `googleBG.ts` (para melhorias por IA).
- **Módulos Node.js**: Não aplicável diretamente.
- **Variáveis**: `process.cwd()` (para caminhos de cliente).

## Exemplo de Uso
```typescript
import { MessageEnhancer } from './messageEnhancer.ts';

const enhancer = new MessageEnhancer();

const result = await enhancer.enhanceMessage({
  originalMessage: 'Olá João, sou Mara, especialista em primeiro imóvel, entrada parcelada, documentação grátis',
  conversationHistory: 'Cliente perguntou sobre valores...',
  clientName: 'João',
  validationIssues: [{
    ruleId: 'repetitive_greeting',
    ruleName: 'Saudação Repetitiva',
    description: 'Mensagem contém saudação desnecessária',
    severity: 'medium'
  }],
  attemptNumber: 1,
  chatId: '123@c.us'
});

// Resultado: mensagem sem saudação repetitiva
```

## Notas Adicionais
- **Otimizações**: Correções diretas por regex para performance; IA apenas quando necessário; respostas contextuais baseadas no histórico.
- **Limitações**: Dependente da qualidade dos problemas identificados; melhoria por IA pode falhar; limitado a tipos de problemas pré-definidos.
- **Bugs Conhecidos**: Sistema de validação de diferença pode ser muito permissivo; dependente da disponibilidade do GoogleBG.
- **Melhorias Sugeridas**: Adicionar mais tipos de problemas; implementar cache de melhorias; adicionar métricas de sucesso; suportar idiomas múltiplos.
- **Uso Específico**: Pós-processamento de mensagens em sistemas de chat automatizado, garantindo qualidade conversacional e evitando repetições irritantes.