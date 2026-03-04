# Documentação: ClienteController.ts

## Nome do Arquivo
`src/backend/util/storage/ClienteController.ts`

## Propósito
Controlador específico por cliente para gerenciamento de estados de mensagens ativas no WhatsApp, implementando controle de concorrência e cancelamento de operações através de AbortController.

## Funcionamento
O `ClienteMessageController` gerencia estados de mensagens ativas por cliente individualmente, usando uma instância de `StateStorage` para persistência. Implementa controle de concorrência através de estados (`index` e `disparo`) e permite cancelamento de operações via AbortController.

### Algoritmos Principais
- **Controle de Estados**: Estados 'index' (processamento inicial) e 'disparo' (envio ativo)
- **Cleanup Automático**: Timer de 30 segundos para limpeza de estados expirados
- **Controle de Concorrência**: Prevenção de múltiplas operações simultâneas por chat
- **Cancelamento Seguro**: Uso de AbortController para interrupção graciosa de operações

### Estruturas de Dados
- `ActiveChatState`: Interface com campos clienteId, chatId, estado, enviandoMensagem, timestamp, abortController
- `StateStorage`: Interface abstrata para operações CRUD de estados

### Lógica de Controle
1. **Inicialização**: Timer de cleanup automático
2. **Estado Ativo**: Verificação se há operações em andamento (`isSendingAny`)
3. **Cancelamento**: Abort de operações específicas ou todas (`cancelAll`)
4. **Finalização**: Remoção de estados após conclusão

## Entrada de Informações
- **clienteId**: String identificadora do cliente
- **chatId**: ID do chat WhatsApp (formato `numero@c.us`)
- **storage**: Instância de StateStorage para persistência

## Processamento de Informações
- **Validação de Estado**: Verificação se operação pode ser cancelada
- **Timestamp**: Controle temporal para limpeza automática
- **AbortController**: Gerenciamento de cancelamento assíncrono
- **Filtragem de Estados**: Busca de estados ativos por cliente

## Saída de Informações
- **AbortController**: Retornado em `iniciarDisparo` para controle externo
- **Boolean**: Estados de sucesso em operações de cancelamento
- **Void**: Confirmação de operações assíncronas

## Dependências
- **StateStorage**: Interface abstrata para armazenamento (local ou StateStorage.ts)
- **AbortController**: API nativa do Node.js para cancelamento
- **setInterval**: Timer para cleanup automático

## Exemplo de Uso
```typescript
const controller = new ClienteMessageController('cliente001', storage);

// Iniciar processamento
await controller.iniciarProcessamento('5511999999999@c.us');

// Iniciar disparo com controle de cancelamento
const abortController = await controller.iniciarDisparo('5511999999999@c.us');

// Verificar se pode cancelar
if (await controller.podeCancelar('5511999999999@c.us')) {
  await controller.cancelar('5511999999999@c.us');
}

// Cancelar todas as operações do cliente
await controller.cancelAll();

// Verificar se há envios ativos
const isActive = await controller.isSendingAny();
```

## Notas Adicionais
- **Workaround Temporário**: Interfaces locais duplicadas devido a problemas de módulos ES
- **Isolamento por Cliente**: Cada instância gerencia apenas um cliente específico
- **Cleanup Automático**: Prevenção de vazamento de memória com timer periódico
- **Tratamento de Erros**: Logging detalhado para debugging de operações
- **Limitações**: Dependente de implementação correta do StateStorage subjacente