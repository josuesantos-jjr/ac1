# Documentação: StateStorage-fixed.ts

## Nome do Arquivo
`src/backend/util/storage/StateStorage-fixed.ts`

## Propósito
Arquivo de definições de interfaces TypeScript que estabelece contratos para gerenciamento de estados de chat ativos, fornecendo tipagem forte e isolamento de responsabilidades no sistema de armazenamento.

## Funcionamento
Este arquivo contém apenas definições de interfaces TypeScript que especificam contratos para implementações de armazenamento de estados. Não contém lógica executável, apenas declarações de tipos para garantir consistência e segurança de tipos em todo o sistema.

### Algoritmos Principais
- **Interface Abstrata**: Define contrato sem implementação
- **Tipagem Forte**: Garante consistência de dados em tempo de compilação
- **Acoplamento Fraco**: Permite múltiplas implementações do mesmo contrato

### Estruturas de Dados
- **ActiveChatState**: Representa estado ativo de um chat específico
  - `clienteId`: Identificador do cliente proprietário
  - `chatId`: ID único do chat WhatsApp
  - `estado`: Tipo de operação ('index' | 'disparo')
  - `enviandoMensagem`: Flag de atividade de envio
  - `timestamp`: Controle temporal em milissegundos
  - `abortController`: Controle de cancelamento opcional

- **StateStorage**: Interface abstrata para operações CRUD
  - `set()`: Armazenamento de estado
  - `get()`: Recuperação de estado
  - `delete()`: Remoção de estado
  - `cleanup()`: Limpeza de estados expirados
  - `getMetrics()`: Estatísticas de uso

### Lógica de Controle
Este arquivo não contém lógica executável - apenas definições de contrato que serão implementadas por classes concretas (como LocalStorage, RedisStorage, etc.).

## Entrada de Informações
Este arquivo não processa entradas - define apenas tipos para validação em tempo de compilação.

## Processamento de Informações
Este arquivo não realiza processamento - serve apenas como contrato de interface.

## Saída de Informações
Este arquivo não produz saídas - define apenas estruturas de dados e contratos.

## Dependências
- **TypeScript**: Linguagem que suporta definições de interface
- **AbortController**: API nativa do Node.js para controle assíncrono

## Exemplo de Uso
```typescript
// Implementação concreta usando a interface
import { StateStorage, ActiveChatState } from './StateStorage-fixed';

class MyStorage implements StateStorage {
  async set(clienteId: string, chatId: string, state: ActiveChatState): Promise<void> {
    // Implementação específica
  }
  
  // ... outras implementações
}

// Uso das interfaces
const state: ActiveChatState = {
  clienteId: 'cliente001',
  chatId: '5511999999999@c.us',
  estado: 'disparo',
  enviandoMensagem: true,
  timestamp: Date.now(),
  abortController: new AbortController()
};
```

## Notas Adicionais
- **Arquivo de Tipos Puros**: Contém apenas definições TypeScript, sem código executável
- **Versão Corrigida**: Sufixo "-fixed" indica versão corrigida do arquivo original
- **Contratos Abstratos**: Permite múltiplas implementações (Local, Redis, Database)
- **Type Safety**: Garante consistência de tipos em toda a aplicação
- **Isolamento**: Separa definição de contrato da implementação concreta
- **Extensibilidade**: Fácil adição de novos campos ou métodos nas interfaces