# Documentação do Arquivo: src/backend/service/groqSuporte.ts

## Nome do Arquivo
`src/backend/service/groqSuporte.ts`

## Propósito
Este arquivo implementa o serviço `mainGroqSuporte` e `GroqService`, um wrapper completo para integração com a API Groq, atuando como fallback inteligente para os serviços Google Gemini. Gerencia múltiplos modelos com rate limiting automático, balanceamento de carga, configuração por cliente e retry com backoff exponencial. É usado como alternativa quando os serviços primários falham, garantindo alta disponibilidade do sistema de IA.

## Funcionamento
O serviço opera como um sistema de failover inteligente:

1. **Inicialização por Cliente**: Cada cliente tem sua própria instância com configurações específicas (`GROQ_KEY`, `GROQ_KEY_RESERVA`).
2. **Gerenciamento de Modelos**: Balanceia carga entre modelos disponíveis (`qwen3-32b`, `kimi-k2-instruct`) com limites de RPM.
3. **Rate Limiting**: Monitora uso por modelo e alterna automaticamente quando limites são atingidos.
4. **Geração de Respostas**: Usa chat completions com histórico contextual e parâmetros otimizados.
5. **Retry Robusto**: Implementa backoff exponencial e múltiplas tentativas com tratamento diferenciado de erros.
6. **Métricas de Status**: Fornece informações detalhadas sobre utilização de modelos.

O algoritmo prioriza o modelo primário, alterna para secundário quando necessário, e usa configuração específica por cliente para isolamento de recursos.

## Entrada de Informações
- **currentMessage** (parâmetro `string`): Mensagem atual do usuário.
- **chatId** (parâmetro opcional `string`): Identificador do chat para contexto.
- **clearHistory** (parâmetro opcional `boolean`, padrão true): Flag para limpar histórico.
- **maxRetries** (parâmetro opcional `number`, padrão 3): Número máximo de tentativas.
- **__dirname** (parâmetro `string`): Caminho do diretório do cliente.
- **history** (parâmetro opcional `any[]`): Histórico de mensagens anteriores.

As informações são recebidas de:
- Chamadas de outros serviços (principalmente como fallback).
- Arquivos de configuração do cliente (`config/infoCliente.json`).
- Histórico de conversas passado como parâmetro.

## Processamento de Informações
- **Validação**: Verifica mensagens vazias, existência de configurações e chaves API.
- **Transformação**: Converte histórico para formato Groq API, gerencia alternância de modelos.
- **Cálculos**: Monitora RPM por modelo, calcula backoff exponencial, percentual de utilização.
- **Filtros**: Não aplicável - processamento direto de IA.
- **Controle de Fluxo**: Balanceamento automático entre modelos, retry inteligente baseado no tipo de erro.

## Saída de Informações
- **string**: Resposta gerada pela IA Groq.
- **object**: Status detalhado dos modelos (`getModelsStatus`).

As saídas são destinadas a:
- Serviços primários (como fallback quando Gemini falha).
- Sistema de monitoramento (métricas de uso).
- Logs do sistema (debugging e auditoria).

## Dependências
- **Bibliotecas Externas**: `groq-sdk` (SDK oficial da Groq).
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).
- **Arquivos Locais**: `config/infoCliente.json` (configurações com `GROQ_KEY`).

## Exemplo de Uso
```typescript
import { mainGroqSuporte } from './groqSuporte.ts';

// Usar como fallback quando Gemini falhar
const response = await mainGroqSuporte({
  currentMessage: 'Olá, preciso de ajuda',
  chatId: '551199999999@c.us',
  clearHistory: false,
  maxRetries: 3,
  __dirname: '/path/to/client',
  history: [{ role: 'user', content: 'Mensagem anterior' }]
});

// Verificar status dos modelos
const groqService = createGroqService('/path/to/client');
const status = groqService.getModelsStatus();
```

## Notas Adicionais
- **Otimizações**: Balanceamento automático de carga entre modelos; isolamento por cliente; rate limiting granular.
- **Limitações**: Depende de configuração específica por cliente; limitado pelos modelos disponíveis na Groq; custo associado ao uso.
- **Bugs Conhecidos**: Nenhum reportado; sistema bem testado como fallback.
- **Melhorias Sugeridas**: Adicionar cache de respostas; implementar warmup de modelos; adicionar métricas mais detalhadas; suportar mais modelos.
- **Uso Específico**: Sistema de alta disponibilidade para IA, usado principalmente como backup quando serviços primários falham.