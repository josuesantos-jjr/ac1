# Documentação: MessageManager.ts

## Nome do Arquivo
`src/backend/util/storage/MessageManager.ts`

## Propósito
Gerenciador escalável de mensagens que coordena múltiplos controladores de cliente usando padrão Singleton, facilitando controle centralizado de operações de envio de mensagens WhatsApp com isolamento por cliente.

## Funcionamento
O `ScalableMessageManager` implementa padrão Singleton para gerenciar controladores de mensagem por cliente. Começa com LocalStorage mas permite migração futura para Redis. Fornece interface global para controle de mensagens e compatibilidade com código legado.

### Algoritmos Principais
- **Singleton Pattern**: Uma única instância global da aplicação
- **Lazy Loading**: Controladores criados sob demanda por cliente
- **Coordenação Paralela**: Operações assíncronas em múltiplos controladores simultaneamente
- **Migração Planejada**: Estrutura preparada para escalabilidade (Local → Redis)

### Estruturas de Dados
- **Map<string, ClienteMessageController>**: Cache de controladores por clienteId
- **StateStorage**: Interface abstrata para armazenamento (atualmente LocalStorage)

### Lógica de Controle
1. **Instanciação**: Singleton garante uma instância global
2. **Cache de Controllers**: Controladores criados e cacheados por cliente
3. **Coordenação Global**: Operações em todos os controladores ativos
4. **Compatibilidade**: Função global para acesso simplificado

## Entrada de Informações
- **clienteId**: String identificadora do cliente para isolamento

## Processamento de Informações
- **Instanciação Lazy**: Controllers criados apenas quando solicitados
- **Coordenação Paralela**: Promise.all para operações em múltiplos controllers
- **Estado Global**: Verificação de atividade em todos os clientes

## Saída de Informações
- **ClienteMessageController**: Instância específica do cliente solicitado
- **boolean**: Estado de envio global (qualquer cliente enviando)
- **void**: Confirmação de operações de cancelamento

## Dependências
- **LocalStorage**: Implementação atual do StateStorage
- **ClienteMessageController**: Controller individual por cliente
- **Promise.all()**: Coordenação de operações assíncronas paralelas
- **Map**: Cache de controllers por clienteId

## Exemplo de Uso
```typescript
// Obter controller específico do cliente
const controller = ScalableMessageManager.getGlobalInstance().getClienteController('cliente001');

// Ou usar função global simplificada
const controller = getClienteMessageController('cliente001');

// Verificar se há envios ativos globalmente
const isSending = await ScalableMessageManager.getGlobalInstance().isSendingGlobally();

// Cancelar todos os envios de todos os clientes
await ScalableMessageManager.getGlobalInstance().cancelAllCurrentSending();

// Uso típico com controller
await controller.iniciarDisparo('5511999999999@c.us');
const isActive = await controller.isSendingAny();
```

## Notas Adicionais
- **Padrão Singleton**: Uma instância global por processo da aplicação
- **Escalabilidade Planejada**: Estrutura preparada para migração Local→Redis
- **Isolamento por Cliente**: Cada cliente tem seu próprio controller independente
- **Workaround Temporário**: Interfaces duplicadas devido a problemas de módulos ES
- **Compatibilidade Legado**: Função global `getClienteMessageController` para código antigo
- **Coordenação Global**: Capacidade de cancelar operações em todos os clientes simultaneamente