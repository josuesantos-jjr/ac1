# Documentação: index.ts (Cliente CMW)

## Nome do Arquivo
`clientes/ativos/CMW/index.ts`

## Propósito
Arquivo principal de inicialização e controle do cliente WhatsApp CMW, implementando sistema completo de atendimento automatizado com IA, incluindo processamento de mensagens, análise de leads, validação de respostas, buffer de mensagens e integração com diversos serviços.

## Funcionamento
O arquivo implementa um cliente WhatsApp completo usando WPPConnect, com sistema de processamento assíncrono de mensagens através de buffer, análise automática de conversas via IA Gemini, qualificação de leads, validação de respostas e funcionalidades de automação.

### Algoritmos Principais
- **Sistema de Buffer de Mensagens**: Processamento assíncrono com timeout para agrupar mensagens
- **Análise de Conversa**: Qualificação automática de leads com IA integrada
- **Validação de Respostas**: Sistema BG (Background) para garantir qualidade das respostas
- **Proteção contra Duplicatas**: Cache de mensagens recentes para evitar envios repetidos
- **Controle de Concorrência**: Limitação de validações simultâneas e processamento ordenado

### Estruturas de Dados
- **MessageBufferEntry**: Buffer de mensagens por chat com status de resposta
- **ActiveChatState**: Estado ativo de chats para controle de concorrência
- **Contato**: Estrutura de dados para informações de contato
- **Message**: Interface do WPPConnect para mensagens recebidas

### Lógica de Controle
1. **Inicialização**: Carrega configurações, inicializa WPPConnect, configura QR code
2. **Processamento de Mensagens**: Buffer → Análise → Validação → Resposta
3. **Análise de Leads**: Extração de informações, qualificação automática
4. **Validação BG**: Verificação de qualidade das respostas IA com tentativas de correção
5. **Envio Controlado**: Proteção contra duplicatas e controle de timing

## Entrada de Informações
- **Mensagens WhatsApp**: Texto, áudio, imagens de clientes
- **Configurações JSON**: infoCliente.json com chaves API e configurações
- **Arquivos de Estado**: Buffer de mensagens, histórico de conversas
- **Configurações de Cliente**: Parâmetros específicos do cliente CMW

## Processamento de Informações
- **Transcrição de Áudio**: Conversão automática de mensagens PTT/audio para texto
- **Filtragem de Conteúdo**: Remoção de prompts internos do histórico
- **Análise Contextual**: IA avalia contexto da conversa para respostas adequadas
- **Validação de Qualidade**: Verificação se resposta mantém contexto e avança no funil
- **Proteção de Integridade**: Evita respostas fora do contexto ou repetitivas

## Saída de Informações
- **Respostas Automáticas**: Mensagens processadas e enviadas via WhatsApp
- **Notificações de Lead**: Alertas para chat administrativo sobre leads qualificados
- **Logs Estruturados**: Registro detalhado de todas as operações
- **Atualizações de Estado**: Persistência de dados de contato e lead

## Dependências
- **WPPConnect**: Biblioteca principal para integração WhatsApp
- **Google Gemini**: IA para geração de respostas e validação
- **Sistema de Logging**: Utilidades de log estruturado
- **Utilitários de Mensagem**: Funções de processamento e envio
- **Sistema de Monitoramento**: Análise de conversas e qualificação de leads
- **Gerenciamento de Estado**: Controle de mensagens ativas e buffer

## Exemplo de Uso
```typescript
// Inicialização automática - executado ao iniciar o sistema
// 1. Carrega configurações de infoCliente.json
const infoConfig = JSON.parse(fs.readFileSync('config/infoCliente.json'));

// 2. Inicializa cliente WhatsApp
wppconnect.create({
  session: infoConfig.CLIENTE,
  // ... configurações
});

// 3. Processa mensagens automaticamente
client.onMessage(async (message) => {
  // Buffer de mensagens
  messageBufferPerChatId.get(message.chatId).push({
    messages: [message.body],
    answered: false
  });
  
  // Análise e resposta automática
  await responderChat(client, message, message.chatId, conversation);
});
```

## Notas Adicionais
- **Cliente Específico**: Implementação customizada para cliente CMW com regras específicas
- **Sistema de Fallback**: Múltiplas chaves Gemini com rotação automática
- **Proteção contra Rate Limits**: Controle de frequência de chamadas à API
- **Processamento Assíncrono**: Buffer evita perda de mensagens durante processamento
- **Integração Completa**: Conecta análise, validação, envio e monitoramento
- **Configuração Flexível**: Diferentes modos de IA (Gemini/GPT) via configuração