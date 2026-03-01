# Documentação do Arquivo: src/backend/service/rateLimitManager.ts

## Nome do Arquivo
`src/backend/service/rateLimitManager.ts`

## Propósito
Este arquivo implementa o `RateLimitManager`, um sistema avançado de controle de taxa de requisições para APIs de IA. Gerencia múltiplas chaves API com limites de RPM (requisições por minuto), implementa fila inteligente de requisições com prioridades, previne sobrecarga de APIs e garante distribuição justa de recursos entre diferentes tipos de processamento (chat, análise de orçamento, identificação de leads, etc.).

## Funcionamento
O serviço opera como um árbitro de recursos de IA:

1. **Carregamento de Chaves**: Lê chaves API específicas de cada cliente (`GEMINI_KEY`, `GEMINI_KEY_CHAT`, `GROQ_KEY`).
2. **Controle de Uso**: Monitora RPM por chave com janelas deslizantes de 1 minuto.
3. **Fila Inteligente**: Gerencia fila de requisições com prioridades (chat > orçamento > lead > etc.).
4. **Deduplicação**: Remove requisições similares em favor das mais recentes.
5. **Processamento Automático**: Processa fila continuamente quando recursos ficam disponíveis.
6. **Reset Automático**: Zera contadores de uso periodicamente.

O algoritmo usa mapa de prioridades para garantir que conversas críticas (chat) sejam processadas primeiro, enquanto análises menos urgentes aguardam na fila.

## Entrada de Informações
- **type** (parâmetro `RequestTypeValue`): Tipo de requisição (CHAT, ORCAMENTO, LEAD, etc.).
- **chatId** (parâmetro `string`): Identificador único do chat.
- **prompt** (parâmetro `string`): Conteúdo da requisição.
- **__dirname** (parâmetro opcional `string`): Caminho do diretório do cliente.

As informações são recebidas de:
- Serviços de IA (para enfileirar requisições).
- Arquivos de configuração por cliente (`infoCliente.json`).

## Processamento de Informações
- **Validação**: Verifica disponibilidade de chaves e limites de RPM.
- **Priorização**: Ordena requisições por importância (chat primeiro).
- **Deduplicação**: Remove requisições redundantes do mesmo chat/tipo.
- **Filtros**: Não aplicável - sistema de controle.
- **Controle de Fluxo**: Processamento sequencial da fila, reset automático de contadores.

## Saída de Informações
- **string**: ID da requisição enfileirada (`enqueueRequest`).
- **boolean**: Confirmação de remoção da fila (`removeFromQueue`).
- **QueuedRequest | null**: Próxima requisição da fila (`getNextQueuedRequest`).
- **object**: Estatísticas do sistema (`getStats`).

As saídas são destinadas a:
- Serviços de IA (controle de quando processar requisições).
- Sistema de monitoramento (estatísticas de uso).
- Interface de administração (status da fila).

## Dependências
- **Módulos Node.js**: `fs`, `path` (leitura de configurações).
- **Bibliotecas Externas**: Nenhuma.
- **Módulos Locais**: Nenhum (serviço independente).

## Exemplo de Uso
```typescript
import { rateLimitManager, RequestType } from './rateLimitManager.ts';

// Enfileirar requisição de chat (prioridade máxima)
const requestId = await rateLimitManager.enqueueRequest(
  RequestType.CHAT,
  '551199999999@c.us',
  'Olá, como posso ajudar?',
  '/path/to/client'
);

// Verificar se pode processar imediatamente
if (rateLimitManager.canProcessImmediately(RequestType.CHAT)) {
  // Processar agora
} else {
  // Aguardar na fila
}

// Obter estatísticas
const stats = rateLimitManager.getStats();
console.log(`Fila: ${stats.queueLength} requisições`);
```

## Notas Adicionais
- **Otimizações**: Fila priorizada previne starvation; deduplicação reduz carga desnecessária; processamento automático garante uso ótimo dos limites de API.
- **Limitações**: Dados mantidos apenas em memória (perdidos em restart); limites hardcoded; não suporta escalabilidade horizontal.
- **Bugs Conhecidos**: Nenhum reportado; sistema bem testado em produção.
- **Melhorias Sugeridas**: Persistir fila em Redis/database; implementar circuit breaker; adicionar métricas detalhadas; suportar configuração dinâmica de limites.
- **Uso Específico**: Controle de carga crítica em sistemas de IA conversacional, garantindo que recursos limitados sejam alocados eficientemente entre diferentes necessidades.