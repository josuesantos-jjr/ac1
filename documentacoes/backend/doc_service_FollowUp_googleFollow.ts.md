# Documentação do Arquivo: src/backend/service/FollowUp/googleFollow.ts

## Nome do Arquivo
`src/backend/service/FollowUp/googleFollow.ts`

## Propósito
Este arquivo implementa o serviço `mainGoogleChat` (nome da função exportada) especializado em geração de mensagens de follow-up. Usa Gemini 2.5 Flash Lite para criar respostas contextuais em conversas de acompanhamento, com sistema de retry robusto, validação de respostas e prevenção de repetições. Mantém histórico de conversas por chatId e trata erros específicos da API.

## Funcionamento
O serviço opera como um gerador de follow-up inteligente:

1. **Sessões Contextuais**: Mantém histórico de conversa por chatId para continuidade.
2. **Geração de Respostas**: Usa modelo Gemini otimizado para follow-up.
3. **Validação de Qualidade**: Remove respostas com erros de API e previne repetições.
4. **Correção Automática**: Força geração de resposta diferente se detectar repetição.
5. **Retry Robusto**: Até 500 tentativas com backoff de 5 segundos.

O algoritmo combina configuração de follow-up com validação rigorosa para garantir qualidade das mensagens.

## Entrada de Informações
- **currentMessageChat** (parâmetro `string`): Mensagem/contexto para follow-up.
- **chatId** (parâmetro `string`): Identificador único do chat.
- **clearHistory** (parâmetro `boolean`): Flag para resetar histórico.
- **maxRetries** (parâmetro opcional `number`, padrão 500): Máximo de tentativas.
- **__dirname** (parâmetro `string`): Caminho base do cliente.

As informações são recebidas de:
- Sistema de follow-up (contexto de mensagens anteriores).
- Arquivos de histórico JSON no diretório do cliente.

## Processamento de Informações
- **Validação**: Verifica respostas válidas e remove erros de API.
- **Comparação**: Verifica se resposta é igual à última mensagem da IA.
- **Correção**: Força variação se detectar repetição com delay aleatório.
- **Histórico**: Mantém/atualiza contexto conversacional.
- **Controle de Fluxo**: Loop de retry com tratamento de erros específicos.

## Saída de Informações
- **string**: Resposta de follow-up gerada e validada.

As saídas são destinadas a:
- Sistema de follow-up (mensagens de acompanhamento).
- Logs do sistema (debugging e auditoria).

## Dependências
- **Bibliotecas Externas**: `@google/generative-ai` (SDK Gemini), `dotenv` (variáveis).
- **Módulos Node.js**: `fs`, `path` (leitura de arquivos de histórico).

## Exemplo de Uso
```typescript
import { mainGoogleChat } from './googleFollow.ts';

// Gerar mensagem de follow-up
const response = await mainGoogleChat({
  currentMessageChat: 'Cliente interessado em apartamento, fazer follow-up',
  chatId: '551199999999@c.us',
  clearHistory: false,
  maxRetries: 100,
  __dirname: '/path/to/client'
});

console.log(response); // Mensagem de follow-up contextual
```

## Notas Adicionais
- **Limitações**: Alto limite de retry pode causar delays; dependente de arquivos de histórico específicos; validação limitada a comparações diretas.
- **Bugs Conhecidos**: Sistema de detecção de repetição pode ter falsos positivos; histórico pode crescer indefinidamente.
- **Melhorias Sugeridas**: Implementar cache para respostas similares; reduzir limite de retry padrão; adicionar validação de qualidade por IA; implementar limpeza automática de histórico antigo.