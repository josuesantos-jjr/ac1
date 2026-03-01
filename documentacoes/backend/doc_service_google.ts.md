# Documentação do Arquivo: src/backend/service/google.ts

## Nome do Arquivo
`src/backend/service/google.ts`

## Propósito
Este arquivo implementa o serviço `mainGoogle`, um wrapper para integração com a API do Google Gemini AI focado em conversas de chat. Mantém sessões de chat ativas por usuário (identificado por `chatId`), permitindo conversas contextuais contínuas com o modelo Gemini 2.5 Flash Lite. É usado para gerar respostas automatizadas em sistemas de chatbot, mantendo o histórico da conversa para contexto.

## Funcionamento
O serviço opera como um gerenciador de sessões de chat:

1. **Gerenciamento de Sessões**: Mantém um Map global `activeChats` para armazenar histórico por chatId.
2. **Criação/Recuperação de Chat**: Para cada mensagem, recupera ou cria nova sessão de chat com histórico.
3. **Envio de Mensagens**: Usa a sessão ativa para enviar mensagens e receber respostas.
4. **Atualização de Histórico**: Após cada resposta, atualiza o histórico local com nova interação.
5. **Persistência Temporária**: Histórico mantido em memória durante execução do processo.

O algoritmo usa configuração otimizada (temperatura 0.5, topP 0.8, max tokens 819200) para respostas balanceadas entre criatividade e consistência, adequado para aplicações conversacionais.

## Entrada de Informações
- **currentMessage** (parâmetro `string`): Mensagem atual do usuário.
- **chatId** (parâmetro `string`): Identificador único do chat/conversa (como número do WhatsApp).

As informações são recebidas de:
- Sistemas de messaging (WhatsApp, Telegram, etc.).
- Interfaces de chat em tempo real.

## Processamento de Informações
- **Validação**: Carrega variáveis de ambiente automaticamente via dotenv.
- **Transformação**: Converte mensagens em formato Gemini API (role/parts).
- **Cálculos**: Não aplicável - processamento é de IA generativa.
- **Filtros**: Não aplicável - processamento direto.
- **Controle de Fluxo**: Operação assíncrona, gerenciamento de estado por chatId.

## Saída de Informações
- **string**: Resposta gerada pela IA Gemini, mantendo contexto da conversa.

As saídas são destinadas a:
- Sistemas de messaging (respostas automáticas).
- Logs do console (debugging).

## Dependências
- **Bibliotecas Externas**: `@google/generative-ai` (SDK Gemini), `dotenv` (carregamento de variáveis).
- **Variáveis de Ambiente**: `GEMINI_KEY` (chave API), `GEMINI_PROMPT` (prompt inicial opcional).

## Exemplo de Uso
```typescript
import { mainGoogle } from './google.ts';

// Primeira mensagem de um chat
const response1 = await mainGoogle({
  currentMessage: 'Olá, como você está?',
  chatId: '551199999999@c.us'
});

// Resposta mantém contexto da conversa anterior
const response2 = await mainGoogle({
  currentMessage: 'Qual é o seu nome?',
  chatId: '551199999999@c.us'
});
```

## Notas Adicionais
- **Limitações**: Histórico mantido apenas em memória (perdido em restart); limitado pelas capacidades do modelo Gemini 2.5 Flash Lite; pode ter custos associados.
- **Bugs Conhecidos**: Nenhum reportado; dependente da estabilidade da API Google.
- **Melhorias Sugeridas**: Implementar persistência de histórico (Redis/database); adicionar limpeza automática de sessões antigas; implementar timeout de sessões; adicionar validação de entrada.
- **Uso Específico**: Integrado a sistemas de chatbot WhatsApp para respostas automatizadas contextuais, mantendo continuidade nas conversas.