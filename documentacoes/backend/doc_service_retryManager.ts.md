# Documentação do Arquivo: src/backend/service/retryManager.ts

## Nome do Arquivo
`src/backend/service/retryManager.ts`

## Propósito
Este arquivo implementa o `RetryManager`, um sistema de gerenciamento inteligente de tentativas de melhoria de mensagens. Controla o número de tentativas de aprimoramento de respostas por chat, implementa backoff exponencial para espera entre tentativas e gerencia respostas sugeridas como fallback. É usado pelo sistema de validação e melhoria de mensagens para otimizar recursos e evitar loops infinitos.

## Funcionamento
O serviço opera como um controlador de tentativas:

1. **Registro de Tentativas**: Conta quantas vezes uma mensagem foi melhorada por chatId.
2. **Decisão de Retry**: Determina se deve tentar novamente baseado no contador e limites.
3. **Backoff Exponencial**: Calcula tempo de espera crescente entre tentativas.
4. **Fallback Seguro**: Na última tentativa, usa resposta sugerida se disponível.
5. **Limpeza Automática**: Remove registros antigos para evitar vazamento de memória.
6. **Estatísticas**: Fornece métricas de tentativas para monitoramento.

O algoritmo usa um sistema de Map para armazenar estado por chat, com limite de 3 tentativas por padrão e backoff exponencial de 1-5 segundos.

## Entrada de Informações
- **chatId** (parâmetro `string`): Identificador único do chat.
- **needsSuggestedResponse** (parâmetro opcional `boolean`): Se deve usar resposta sugerida na última tentativa.
- **suggestedResponse** (parâmetro opcional `string`): Resposta sugerida para fallback.

As informações são recebidas de:
- Sistema de validação de mensagens (`responseValidatorManager.ts`).
- Sistema de melhoria de mensagens (`messageEnhancer.ts`).

## Processamento de Informações
- **Contagem**: Incrementa contador por chatId em cada tentativa.
- **Cálculo**: Backoff exponencial (base 1s, multiplicador 1.5, máximo 5s).
- **Decisão**: Compara tentativas atuais com limite máximo (3).
- **Limpeza**: Remove registros com mais de 1 hora de idade.
- **Filtros**: Não aplicável - sistema de controle.

## Saída de Informações
- **RetryResult**: Objeto com decisão de retry, número da tentativa, resposta sugerida e tempo de espera.

As saídas são destinadas a:
- Sistema de melhoria de mensagens (controle de tentativas).
- Sistema de monitoramento (estatísticas de uso).

## Dependências
- **Módulos Locais**: Nenhum específico.
- **Módulos Node.js**: Não aplicável diretamente.

## Exemplo de Uso
```typescript
import { RetryManager } from './retryManager.ts';

const retryManager = new RetryManager();

// Registrar primeira tentativa
retryManager.registerAttempt('123@c.us', false);

// Verificar se deve tentar novamente
const result = retryManager.shouldRetry('123@c.us');

if (result.shouldRetry) {
  // Aguardar tempo calculado
  await setTimeout(() => {}, result.waitTimeMs);
  // Tentar melhorar novamente
} else if (result.useSuggestedResponse) {
  // Usar resposta sugerida
  console.log(result.suggestedResponse);
}

// Resetar quando bem-sucedido
retryManager.resetAttempts('123@c.us');
```

## Notas Adicionais
- **Limitações**: Estado mantido apenas em memória (perdido em restart); limite fixo de tentativas; sem persistência.
- **Bugs Conhecidos**: Nenhum reportado; sistema simples e bem testado.
- **Melhorias Sugeridas**: Adicionar persistência com database; configurar limites por tipo de erro; implementar métricas mais detalhadas; adicionar callback de eventos.