# Documentação do Arquivo: src/backend/service/googleAQ.ts

## Nome do Arquivo
`src/backend/service/googleAQ.ts`

## Propósito
Este arquivo implementa o serviço `mainGoogleBG` (nome da função exportada), que parece ser uma implementação simplificada ou de fallback para geração de respostas baseada em prompts estáticos. Diferentemente dos outros serviços Gemini, este não utiliza realmente a API da IA para gerar respostas dinâmicas - em vez disso, retorna trechos aleatórios de um prompt pré-definido (`AQ_PROMPT`). Mantém estrutura similar aos outros serviços mas com funcionalidade limitada, atuando possivelmente como fallback ou para testes.

## Funcionamento
O serviço opera de forma minimalista:

1. **Configuração Básica**: Carrega variáveis de ambiente e configura modelo Gemini (não utilizado).
2. **Estrutura de Sessões**: Mantém código para gerenciamento de sessões de chat, mas não implementado.
3. **Geração de Resposta**: Em vez de usar IA, divide o `AQ_PROMPT` em frases e retorna uma aleatória.
4. **Histórico**: Possui função para ler última mensagem da IA, mas retorna "oi" como fallback.
5. **Retry**: Aceita parâmetro de maxRetries mas não implementa lógica de retry real.

O algoritmo é essencialmente um seletor aleatório de frases de um texto pré-definido, ignorando completamente as capacidades de IA do Gemini.

## Entrada de Informações
- **currentMessageBG** (parâmetro `string`): Mensagem atual (ignorada na implementação).
- **chatId** (parâmetro `string`): Identificador do chat (usado apenas para logs).
- **clearHistory** (parâmetro `boolean`): Flag para limpar histórico (não implementado).
- **maxRetries** (parâmetro opcional `number`, padrão 1): Número máximo de tentativas (não utilizado).

As informações são recebidas de:
- Chamadas de função (parâmetros ignorados).
- Variável de ambiente `AQ_PROMPT` (fonte das respostas).

## Processamento de Informações
- **Validação**: Carrega dotenv mas não valida se variáveis existem.
- **Transformação**: Divide prompt em frases usando regex para pontuação.
- **Cálculos**: Gera índice aleatório para seleção de frase.
- **Filtros**: Remove espaços em branco das frases selecionadas.
- **Controle de Fluxo**: Retorno imediato sem processamento assíncrono real.

## Saída de Informações
- **string**: Uma frase aleatória extraída do `AQ_PROMPT`, ou "oi" em caso de erro.

As saídas são destinadas a:
- Sistemas de messaging (respostas estáticas).
- Logs do console (debugging).

## Dependências
- **Bibliotecas Externas**: `@google/generative-ai` (importado mas não usado), `dotenv` (carregamento de variáveis).
- **Módulos Node.js**: `fs`, `path` (para leitura de arquivos de histórico).
- **Variáveis de Ambiente**: `GEMINI_KEY_AQ` (não utilizado), `AQ_PROMPT` (fonte das respostas).

## Exemplo de Uso
```typescript
import { mainGoogleBG } from './googleAQ.ts';

// Retorna uma frase aleatória do AQ_PROMPT
const response = await mainGoogleBG({
  currentMessageBG: 'Qualquer mensagem',
  chatId: '551199999999@c.us',
  clearHistory: false,
  maxRetries: 1
});

console.log(response); // Ex: "Comece a história" ou outra frase aleatória
```

## Notas Adicionais
- **Limitações**: Não utiliza IA, respostas são estáticas e previsíveis; função de histórico retorna sempre "oi"; código morto (imports e funções não utilizadas).
- **Bugs Conhecidos**: Implementação incompleta; função `getLastMessageFromIA` sempre retorna "oi"; retry não implementado.
- **Melhorias Sugeridas**: Implementar uso real da API Gemini ou remover código morto; melhorar função de histórico; adicionar validação de `AQ_PROMPT`; implementar retry se necessário.
- **Uso Específico**: Possivelmente usado como fallback quando API Gemini não está disponível, ou para testes com respostas controladas.