# Documentação do Arquivo: src/backend/service/googlechat.ts

## Nome do Arquivo
`src/backend/service/googlechat.ts`

## Propósito
Este arquivo implementa o serviço `mainGoogleChat`, a versão mais avançada e inteligente do sistema de chat baseado em Gemini AI. Especializada em conversas de vendas imobiliárias, a assistente "Mara" da CMW usa validação automática de respostas, detecção de repetições, failover inteligente e integração completa com o sistema de mensagens. Inclui análise contextual profunda, cancelamento de envios pendentes e métricas detalhadas para otimização de conversas.

## Funcionamento
O serviço opera como um assistente de vendas inteligente:

1. **Validação de Entrada**: Verifica mensagens vazias e cancela envios pendentes se usuário enviar nova mensagem.
2. **Análise Contextual**: Carrega histórico de conversas e valida respostas automaticamente usando IA.
3. **Geração de Resposta**: Usa Gemini com instruções específicas para vendas imobiliárias.
4. **Validação Inteligente**: Analisa respostas para detectar repetições, saudações excessivas, apresentações desnecessárias.
5. **Aprimoramento Automático**: Usa GoogleBG como fallback para melhorar respostas com problemas.
6. **Failover Robusto**: Troca para Groq se Gemini falhar completamente.
7. **Notificações de Falha**: Alerta administradores em caso de falhas críticas.
8. **Métricas Avançadas**: Registra performance e uso de APIs.

O algoritmo combina múltiplas camadas de IA: geração primária com Gemini, validação/análise com GoogleBG, e fallback com Groq, criando um sistema altamente resiliente e inteligente.

## Entrada de Informações
- **currentMessageChat** (parâmetro `string`): Mensagem atual do usuário.
- **chatId** (parâmetro `string`): Identificador único do chat WhatsApp.
- **clearHistory** (parâmetro `boolean`): Flag para resetar histórico da conversa.
- **maxRetries** (parâmetro opcional `number`, padrão 3): Número máximo de tentativas.
- **__dirname** (parâmetro `string`): Caminho base do diretório do cliente.

As informações são recebidas de:
- Sistemas de messaging (WhatsApp).
- Arquivos de histórico JSON (`Chats/Historico/{chatId}/{chatId}.json`).
- Arquivos de configuração (`config/infoCliente.json`).
- Sistema de controle de envios (`getIsSendingMessages`).

## Processamento de Informações
- **Validação**: Cancela envios pendentes, verifica mensagens válidas, testa conectividade.
- **Transformação**: Enriquece prompts com contexto de vendas, histórico de mensagens.
- **Cálculos**: Backoff exponencial reduzido (máx 3s) para resposta rápida em chat.
- **Filtros**: Remove respostas com erros críticos, valida qualidade conversacional.
- **Controle de Fluxo**: Múltiplas validações e fallbacks automáticos.

## Saída de Informações
- **string**: Resposta validada e otimizada da assistente Mara.

As saídas são destinadas a:
- Sistemas de messaging (respostas conversacionais inteligentes).
- Sistema de notificações (alertas de falha).
- Sistema de métricas (performance e qualidade).

## Dependências
- **Bibliotecas Externas**: `@google/generative-ai` (SDK Gemini), `dotenv` (variáveis).
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).
- **Módulos Locais**: `rateLimitManager` (controle de taxa), `smartCache` (cache), `monitoringService` (métricas), `groqSuporte` (fallback), `logger` (logs estruturados), `index.ts` (controles de envio).
- **Arquivos Locais**: `config/infoCliente.json` (configurações), arquivos de histórico JSON.

## Exemplo de Uso
```typescript
import { mainGoogleChat } from './googlechat.ts';

// Gerar resposta inteligente para venda imobiliária
const response = await mainGoogleChat({
  currentMessageChat: 'Olá, estou interessado em imóveis',
  chatId: '551199999999@c.us',
  clearHistory: false,
  maxRetries: 3,
  __dirname: '/path/to/client'
});

// Resposta será validada, contextual e focada em qualificar lead
console.log(response);
```

## Notas Adicionais
- **Otimizações**: Validação automática de qualidade, cancelamento inteligente de envios, análise contextual profunda, failover multi-nível.
- **Limitações**: Sistema complexo pode ter latência maior devido às validações; dependente de múltiplas APIs; configuração extensa necessária.
- **Bugs Conhecidos**: Sistema complexo pode ter edge cases em validações; notificação de falha pode falhar se BK_CHATID mal configurado.
- **Melhorias Sugeridas**: Implementar cache para validações, adicionar testes A/B de respostas, implementar aprendizado contínuo, otimizar timeouts.
- **Uso Específico**: Principal sistema de atendimento automatizado para vendas imobiliárias, onde qualidade conversacional e qualificação de leads são críticas.