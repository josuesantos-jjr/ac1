# Documentação do Arquivo: src/backend/service/googleBG.ts

## Nome do Arquivo
`src/backend/service/googleBG.ts`

## Propósito
Este arquivo implementa o serviço `mainGoogleBG`, uma versão avançada e robusta do wrapper para API Google Gemini, especializada em geração de respostas contextuais com alta resiliência. Inclui sistema de cache inteligente, rate limiting, monitoramento, failover automático para Groq, validação de conectividade e tratamento sofisticado de erros. É a implementação mais completa entre os serviços Gemini, projetada para uso em produção com alta confiabilidade.

## Funcionamento
O serviço opera como um sistema de IA de alta disponibilidade:

1. **Validação de Entrada**: Verifica mensagens vazias e parâmetros obrigatórios.
2. **Cache Inteligente**: Consulta cache antes de fazer chamadas à API.
3. **Verificação de Conectividade**: Testa conectividade com internet antes de tentar API.
4. **Rate Limiting**: Gerencia limites de requisição por usuário/tipo.
5. **Geração de Resposta**: Usa sessão de chat com prompts contextuais.
6. **Validação de Resposta**: Verifica erros de API e repetições.
7. **Failover Automático**: Troca para Groq se Gemini falhar.
8. **Cache de Saída**: Salva respostas bem-sucedidas para reutilização.
9. **Métricas e Monitoramento**: Registra performance e uso da API.

O algoritmo combina múltiplas camadas de proteção: cache para performance, rate limiting para estabilidade, validações para qualidade, e failover para disponibilidade.

## Entrada de Informações
- **currentMessageBG** (parâmetro `string`): Mensagem atual do usuário.
- **chatId** (parâmetro `string`): Identificador único do chat (como `551199999999@c.us`).
- **clearHistory** (parâmetro `boolean`): Flag para resetar histórico da conversa.
- **maxRetries** (parâmetro opcional `number`, padrão 3): Número máximo de tentativas.
- **__dirname** (parâmetro `string`): Caminho base do diretório do cliente.

As informações são recebidas de:
- Sistemas de messaging (principalmente WhatsApp).
- Cache inteligente (`smartCache`).
- Arquivos de configuração do cliente (`infoCliente.json`).
- Sistema de rate limiting (`rateLimitManager`).

## Processamento de Informações
- **Validação**: Verifica conectividade, autenticação e limites de taxa.
- **Transformação**: Enriquece prompts com instruções anti-repetição.
- **Cálculos**: Backoff exponencial baseado no tipo de erro (rede, rate limit, servidor).
- **Filtros**: Remove respostas com erros de API, previne mensagens repetidas.
- **Controle de Fluxo**: Múltiplas camadas de retry com diferentes estratégias por tipo de erro.

## Saída de Informações
- **string**: Resposta gerada pela IA Gemini ou fallback Groq.

As saídas são destinadas a:
- Sistemas de messaging (respostas contextuais).
- Cache inteligente (para reutilização).
- Sistema de monitoramento (métricas de performance).

## Dependências
- **Bibliotecas Externas**: `@google/generative-ai` (SDK Gemini), `dotenv` (variáveis), `http`/`https` (teste de conectividade).
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).
- **Módulos Locais**: `rateLimitManager` (controle de taxa), `smartCache` (cache), `monitoringService` (métricas), `groqSuporte` (failover), `chatDataUtils` (limpeza de IDs).
- **Arquivos Locais**: `config/infoCliente.json` (configurações), arquivos de histórico JSON.

## Exemplo de Uso
```typescript
import { mainGoogleBG } from './googleBG.ts';

// Gerar resposta com alta resiliência
const response = await mainGoogleBG({
  currentMessageBG: 'Olá, como posso ajudar?',
  chatId: '551199999999@c.us',
  clearHistory: false,
  maxRetries: 3,
  __dirname: '/path/to/client'
});

// Sistema automaticamente usa cache, rate limiting, e failover se necessário
console.log(response);
```

## Notas Adicionais
- **Otimizações**: Cache inteligente reduz custos e latência; rate limiting previne bloqueios; failover automático aumenta disponibilidade.
- **Limitações**: Complexidade alta pode dificultar debug; dependente de múltiplos serviços externos; configuração extensa necessária.
- **Bugs Conhecidos**: Sistema complexo pode ter edge cases em transições de estado; dependente da confiabilidade dos serviços de cache/monitoring.
- **Melhorias Sugeridas**: Extrair lógica de retry para utilitários separados; adicionar testes unitários; implementar circuit breaker; melhorar métricas de observabilidade.
- **Uso Específico**: Serviço principal de geração de respostas IA em produção, onde confiabilidade e performance são críticos.