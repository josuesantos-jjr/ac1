# Documentação do Arquivo: src/backend/util/index.ts

## Nome do Arquivo
`src/backend/util/index.ts`

## Propósito
Este arquivo implementa o módulo utilitário central do backend, fornecendo funções essenciais para processamento de mensagens WhatsApp, controle de estado de envio, validação de IDs, divisão inteligente de mensagens e integração com sistemas de IA. Atua como ponto central de utilitários compartilhados entre diferentes módulos do sistema.

## Funcionamento
O serviço opera como uma coleção de utilitários organizados:

1. **Controle de Estado**: Gerencia envio de mensagens através do `ScalableMessageManager`, permitindo cancelamento e verificação de estado.
2. **Validação de IDs**: Sanitiza e valida formatos de WhatsApp IDs (WIDs) para garantir compatibilidade.
3. **Divisão de Mensagens**: Implementa algoritmos complexos para dividir mensagens longas em partes adequadas, com suporte a blocos especiais (envolvidos em ***).
4. **Processamento Sequencial**: Envia mensagens com delays calculados, indicadores de digitação e tratamento de cancelamento.
5. **Integração IA**: Processa mensagens através de diferentes modelos (Google, Groq) com fallbacks automáticos.
6. **Reformulação Inteligente**: Usa IA para reestruturar mensagens que excedem limites de partes.

O algoritmo combina controle de estado moderno com processamento de mensagens inteligentes, suportando cancelamento em tempo real e validação de mensagens recebidas.

## Entrada de Informações
- **client** (parâmetro `Whatsapp`): Instância do cliente WhatsApp para operações de envio.
- **originalMessage** (parâmetro `string`): Mensagem original a ser processada/dividida.
- **chatId** (parâmetro `string`): Identificador do chat destinatário.
- **__dirname** (parâmetro `string`): Caminho base do cliente.
- **clientePath/clienteIdCompleto** (parâmetros `string`): Identificadores do cliente para configuração.

As informações são recebidas de:
- Sistema de mensagens (conteúdo e destinatários).
- Sistema de controle de mensagens (estados de envio).
- Configurações do cliente (regras de processamento).

## Processamento de Informações
- **Validação**: Verifica formatos de WID, existência de mensagens válidas, estado de envio.
- **Transformação**: Divide mensagens por pontuação, agrupa blocos especiais, remove emojis se configurado.
- **Cálculos**: Determina delays baseados no tamanho das mensagens (máx 5s), valida mensagens recentes (últimos 10s).
- **Filtros**: Remove mensagens inválidas, ignora envios durante disparos se configurado.
- **Controle de Fluxo**: Processamento sequencial com cancelamento assíncrono, retry automático em falhas.

## Saída de Informações
- **void**: Operações de envio (`sendMessagesWithDelay`).
- **string[]**: Mensagens divididas (`splitMessages`, `handleMessageSplitting`).
- **boolean**: Estados e validações (`getIsSendingMessages`, `isValidWid`).

As saídas são destinadas a:
- Cliente WhatsApp (mensagens enviadas com indicadores).
- Sistema de controle (estados atualizados).
- Sistema de IA (mensagens processadas).

## Dependências
- **Módulos Locais**: `ScalableMessageManager` (controle de mensagens), `saveMessageToFile` (persistência), `processTriggers` (gatilhos), serviços de IA (`mainGoogleBG`, etc.).
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).

## Exemplo de Uso
```typescript
import { sendMessagesWithDelay, splitMessages, handleMessageSplitting } from './util/index.ts';

// Enviar mensagens divididas com controle
await sendMessagesWithDelay({
  messages: ['Olá!', 'Como posso ajudar?'],
  client: whatsappClient,
  targetNumber: '551199999999@c.us',
  __dirname: '/path/to/client',
  clienteIdCompleto: 'ativos/CMW',
  clientePath: '/path/to/client',
  logger: console
});

// Processar mensagem longa com IA
const parts = await handleMessageSplitting({
  client: whatsappClient,
  originalMessage: 'Mensagem muito longa...',
  chatId: '551199999999@c.us',
  __dirname: '/path/to/client',
  AI_SELECTED: 'GEMINI',
  infoConfig: {},
  logger: console
});
```

## Notas Adicionais
- **Limitações**: Sistema complexo com múltiplas responsabilidades; dependente de configuração específica de cliente; processamento sequencial pode causar delays.
- **Bugs Conhecidos**: Controle de estado complexo pode ter race conditions; validação de mensagens pode falhar em casos edge.
- **Melhorias Sugeridas**: Separar responsabilidades em módulos menores; implementar testes unitários; adicionar métricas de performance; otimizar algoritmos de divisão.