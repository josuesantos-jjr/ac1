# Documentação: LocalStorage.ts

## Nome do Arquivo
`src/backend/util/storage/LocalStorage.ts`

## Propósito
Implementação em memória do StateStorage para gerenciamento de estados de chat ativos, usando Map do JavaScript como estrutura de dados principal com limpeza automática de estados expirados.

## Funcionamento
O `LocalStorage` implementa a interface `StateStorage` usando uma estrutura Map em memória para armazenar estados de chat. Implementa limpeza automática baseada em timestamp (60 segundos) e fornece métricas de uso de memória.

### Algoritmos Principais
- **TTL (Time To Live)**: Estados expirados automaticamente após 60 segundos
- **Chave Composta**: Formato `${clienteId}:${chatId}` para isolamento por cliente/chat
- **Cleanup Iterativo**: Remoção de estados expirados em operações de leitura
- **Filtragem por Cliente**: Busca otimizada de estados por prefixo de cliente

### Estruturas de Dados
- **Map<string, ActiveChatState>**: Armazenamento chave-valor em memória
- **ActiveChatState**: Interface com campos clienteId, chatId, estado, enviandoMensagem, timestamp, abortController

### Lógica de Controle
1. **Armazenamento**: Estados salvos com timestamp atualizado
2. **Recuperação**: Verificação de expiração automática na leitura
3. **Limpeza**: Remoção periódica de estados com TTL excedido
4. **Métricas**: Cálculo estimado de uso de memória

## Entrada de Informações
- **clienteId**: String identificadora do cliente
- **chatId**: ID do chat WhatsApp
- **state**: Objeto ActiveChatState completo

## Processamento de Informações
- **Timestamp**: Controle automático de tempo de vida dos estados
- **Filtragem**: Busca por prefixo de cliente para isolamento
- **Limpeza Automática**: Remoção de dados expirados em operações get/cleanup
- **Cálculo de Memória**: Estimativa baseada no número de estados (240 bytes por estado)

## Saída de Informações
- **ActiveChatState | null**: Estado recuperado ou null se expirado/não encontrado
- **ActiveChatState[]**: Array de estados ativos para um cliente
- **void**: Confirmação de operações de set/delete/cleanup
- **Object**: Métricas com tipo de storage, total de estados e memória estimada

## Dependências
- **Map**: Estrutura de dados nativa do JavaScript
- **Date.now()**: API nativa para timestamps
- **Array.from()**: Para iteração sobre Map entries

## Exemplo de Uso
```typescript
const storage = new LocalStorage();

// Salvar estado
await storage.set('cliente001', '5511999999999@c.us', {
  clienteId: 'cliente001',
  chatId: '5511999999999@c.us',
  estado: 'disparo',
  enviandoMensagem: true,
  timestamp: Date.now(),
  abortController: new AbortController()
});

// Recuperar estado
const state = await storage.get('cliente001', '5511999999999@c.us');

// Listar todos os estados do cliente
const allStates = await storage.getAllStatesForClient('cliente001');

// Limpeza manual
await storage.cleanup();

// Ver métricas
const metrics = await storage.getMetrics();
// { storageType: 'local', totalEstados: 1, memoriaEstimada: '1KB' }
```

## Notas Adicionais
- **Armazenamento Volátil**: Dados perdidos ao reiniciar a aplicação
- **TTL Fixo**: 60 segundos de expiração para todos os estados
- **Thread-Safe**: Não implementa sincronização para ambientes multi-threaded
- **Workaround Temporário**: Interfaces duplicadas devido a problemas de módulos ES
- **Limitações**: Dependente de memória RAM disponível, sem persistência em disco