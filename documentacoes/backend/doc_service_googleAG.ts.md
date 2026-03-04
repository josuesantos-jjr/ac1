# Documentação do Arquivo: src/backend/service/googleAG.ts

## Nome do Arquivo
`src/backend/service/googleAG.ts`

## Propósito
Este arquivo implementa o serviço `mainGoogleAG`, um wrapper avançado para integração com a API do Google Gemini AI, especializado em geração de respostas contextuais para agendamentos e conversas automatizadas. Diferencia-se das outras implementações por incluir lógica robusta de retry, validação de respostas, prevenção de mensagens repetidas e integração com dados específicos do cliente (como nome e prompts de agendamento). Mantém sessões de chat ativas e inclui mecanismos de fallback para garantir respostas de qualidade.

## Funcionamento
O serviço opera como um sistema complexo de geração de respostas:

1. **Configuração Dinâmica**: Carrega configuração específica do cliente (`infoCliente.json`) incluindo chave API e prompts customizados.
2. **Gerenciamento de Sessões**: Mantém histórico de conversas por chatId, com opção de limpar histórico.
3. **Enriquecimento de Prompt**: Combina mensagem atual com dados do cliente (nome, prompt de agendamento) para contexto rico.
4. **Validação de Respostas**: Verifica se respostas contêm erros de API ou caracteres indesejados, refazendo automaticamente.
5. **Prevenção de Repetições**: Compara com última mensagem da IA e força geração de resposta diferente se repetida.
6. **Retry Inteligente**: Implementa backoff exponencial com diferentes delays para erros de rede vs API.
7. **Limpeza de Histórico**: Permite resetar conversa quando necessário.

O algoritmo usa configuração otimizada similar ao `google.ts`, mas inclui lógica adicional para qualidade de respostas e resiliência.

## Entrada de Informações
- **currentMessageBG** (parâmetro `string`): Mensagem atual do usuário para processamento.
- **chatId** (parâmetro `string`): Identificador único do chat (como `551199999999@c.us`).
- **clearHistory** (parâmetro `boolean`): Flag para limpar histórico da conversa após resposta.
- **maxRetries** (parâmetro opcional `number`, padrão 500): Número máximo de tentativas em caso de erro.
- **__dirname** (parâmetro `string`): Caminho base do diretório do cliente para acesso a configurações.

As informações são recebidas de:
- Sistemas de messaging (principalmente WhatsApp).
- Arquivos de configuração do cliente (`infoCliente.json`, `Dados.json`).
- Histórico de conversas armazenado em arquivos JSON.

## Processamento de Informações
- **Validação**: Carrega configurações dinâmicas por cliente, valida estrutura de arquivos.
- **Transformação**: Enriquece prompts com dados contextuais (nome do cliente, prompt de agendamento).
- **Cálculos**: Gera intervalos aleatórios para retry (15-20 segundos), calcula delays exponenciais.
- **Filtros**: Remove respostas com erros de API, previne mensagens repetidas.
- **Controle de Fluxo**: Loop de retry com backoff exponencial, tratamento diferenciado de tipos de erro.

## Saída de Informações
- **string**: Resposta gerada pela IA Gemini, validada e não repetitiva.

As saídas são destinadas a:
- Sistemas de messaging (respostas automáticas contextuais).
- Logs do console (debugging detalhado).

## Dependências
- **Bibliotecas Externas**: `@google/generative-ai` (SDK Gemini), `dotenv` (variáveis de ambiente).
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).
- **Arquivos Locais**: `config/infoCliente.json` (configurações), `Chats/Historico/{chatId}/Dados.json` (dados cliente), arquivos de histórico JSON.

## Exemplo de Uso
```typescript
import { mainGoogleAG } from './googleAG.ts';

// Gerar resposta contextual para agendamento
const response = await mainGoogleAG({
  currentMessageBG: 'Olá, gostaria de agendar uma reunião',
  chatId: '551199999999@c.us',
  clearHistory: false,
  maxRetries: 100,
  __dirname: '/path/to/client'
});

// A resposta incluirá contexto do cliente e prompt de agendamento
console.log(response);
```

## Notas Adicionais
- **Limitações**: Alto número de retries pode causar delays significativos; depende de estrutura específica de arquivos; limitações da API Gemini aplicam.
- **Bugs Conhecidos**: Sistema complexo pode ter edge cases em validações; dependente da estabilidade dos arquivos de configuração.
- **Melhorias Sugeridas**: Extrair lógica de retry para utilitário separado; implementar cache de respostas; adicionar métricas de performance; melhorar tratamento de erros específicos da API.
- **Uso Específico**: Especializado para sistemas de agendamento e atendimento automatizado, onde contexto do cliente e qualidade de resposta são críticos.