# Documentação do Arquivo: src/backend/service/responseValidatorManager.ts

## Nome do Arquivo
`src/backend/service/responseValidatorManager.ts`

## Propósito
Este arquivo implementa o `ResponseValidatorManager`, um sistema de validação inteligente de respostas de IA baseado em regras configuráveis. Analisa mensagens geradas por assistentes virtuais para detectar problemas comuns como saudações repetitivas, apresentações excessivas e repetição de frases promocionais, sugerindo melhorias para manter conversas naturais e contextuais.

## Funcionamento
O serviço opera como um validador pós-processamento:

1. **Carregamento de Regras**: Lê regras de validação de arquivo JSON específico do cliente (`responseValidators.json`).
2. **Análise Contextual**: Usa IA para analisar cada resposta contra regras específicas, considerando histórico da conversa.
3. **Detecção de Problemas**: Identifica violações como saudações repetitivas, apresentações excessivas, repetições de frases-chave.
4. **Geração de Sugestões**: Fornece respostas alternativas para melhorar a qualidade conversacional.
5. **Configuração Dinâmica**: Permite adicionar/remover regras sem modificar código.

O algoritmo usa prompts especializados para cada tipo de validação, analisando contexto conversacional para decisões precisas.

## Entrada de Informações
- **currentResponse** (parâmetro `string`): Mensagem da IA a ser validada.
- **conversationHistory** (parâmetro `string`): Histórico da conversa para contexto.
- **chatId** (parâmetro `string`): ID do chat para rastreamento.

As informações são recebidas de:
- Serviços de geração de respostas de IA.
- Arquivos de configuração do cliente (`config/responseValidators.json`).

## Processamento de Informações
- **Validação**: Carrega regras específicas por cliente, analisa cada resposta contra múltiplas regras.
- **Transformação**: Converte problemas detectados em sugestões acionáveis.
- **Cálculos**: Computa confiança baseada na análise da IA, prioriza problemas por severidade.
- **Filtros**: Remove regras inativas, filtra problemas por tipo.
- **Controle de Fluxo**: Análise sequencial de regras, tratamento de erros por regra.

## Saída de Informações
- **ValidationResult**: Objeto detalhado com:
  - `needsImprovement`: Se há problemas a corrigir.
  - `issues`: Array de problemas detectados com severidade.
  - `confidence`: Nível de confiança na análise.

- **string | null**: Resposta sugerida (`getSuggestedResponse`).

As saídas são destinadas a:
- Serviços de melhoria de mensagens (`messageEnhancer.ts`).
- Sistema de monitoramento (métricas de qualidade).
- Interface de administração (feedback sobre qualidade de respostas).

## Dependências
- **Módulos Locais**: `googleBG.ts` (para análise por IA).
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).
- **Arquivos Locais**: `config/responseValidators.json` (regras de validação).

## Exemplo de Uso
```typescript
import { ResponseValidatorManager } from './responseValidatorManager.ts';

const validator = new ResponseValidatorManager('/path/to/client');

const result = await validator.validateResponse(
  'Olá João, sou Mara, especialista em primeiro imóvel, entrada parcelada',
  'Cliente disse: Olá Mara, obrigado pela ajuda anterior',
  '123@c.us'
);

// result.needsImprovement = true, com issues sobre repetição
const suggestion = validator.getSuggestedResponse(result);
```

## Notas Adicionais
- **Limitações**: Dependente de disponibilidade da API GoogleBG; análise limitada às regras configuradas; custo adicional por validação.
- **Bugs Conhecidos**: Nenhum reportado; sistema bem integrado com o ecossistema.
- **Melhorias Sugeridas**: Adicionar validações offline; implementar cache de validações; criar mais tipos de regras; adicionar métricas de acurácia.
- **Uso Específico**: Pós-processamento crítico em sistemas de chat automatizado, garantindo qualidade conversacional e evitando irritação do usuário.