# Documentação do Arquivo: src/backend/service/geminiAna.ts

## Nome do Arquivo
`src/backend/service/geminiAna.ts`

## Propósito
Este arquivo implementa o serviço `geminiAna`, um wrapper para integração com a API do Google Gemini AI. Atua como uma assistente virtual chamada "Ana" especializada em análise de dados de clientes e conversas, fornecendo insights estratégicos e respostas contextuais sobre o sistema de gerenciamento de clientes. Usa o modelo Gemini 2.5 Pro Experimental para gerar respostas inteligentes baseadas em histórico de conversas e conteúdo de página.

## Funcionamento
O serviço opera como uma interface conversacional inteligente:

1. **Inicialização**: Valida presença da chave API e configura o modelo Gemini 2.5 Pro.
2. **Preparação de Contexto**: Constrói histórico de chat incluindo instruções do sistema e conversas anteriores.
3. **Mapeamento de Papéis**: Converte papéis de mensagens (assistant → model) para compatibilidade com API Gemini.
4. **Geração de Resposta**: Usa chat session para gerar resposta contextual enriquecida com conteúdo de página.
5. **Tratamento de Erros**: Captura e reporta erros da API Gemini.

O algoritmo usa o padrão de chat do Gemini, prependendo instruções do sistema como primeira mensagem "user" seguida de resposta "model" simulada, mantendo coerência na personalidade de Ana como assistente estratégica.

## Entrada de Informações
- **prompt** (parâmetro `string`): Pergunta ou comando do usuário atual.
- **history** (parâmetro `Message[]`): Array de mensagens anteriores com `role` (user/assistant) e `text`.
- **pageContent** (parâmetro `string`): Conteúdo HTML ou texto da página atual para contexto adicional.

As informações são recebidas de:
- Interface do usuário (prompts diretos).
- Histórico de conversas armazenado (array de mensagens).
- Renderização de página atual (conteúdo dinâmico).

## Processamento de Informações
- **Validação**: Verifica existência da variável de ambiente `NEXT_PUBLIC_GEMINI_API_KEY`.
- **Transformação**: Mapeia papéis de mensagens (`assistant` → `model`) e estrutura dados para formato Gemini API.
- **Enriquecimento**: Combina prompt do usuário com conteúdo da página para contexto mais rico.
- **Cálculos**: Não aplicável - processamento é de IA generativa.
- **Filtros**: Não aplicável - processamento direto.
- **Controle de Fluxo**: Operação assíncrona, tratamento de erros com logs detalhados.

## Saída de Informações
- **string**: Resposta gerada pela IA Gemini, contextualizada com histórico e conteúdo da página.

As saídas são destinadas a:
- Interface do usuário (respostas conversacionais).
- Sistema de logs (erros da API).

## Dependências
- **Bibliotecas Externas**: `@google/generative-ai` (SDK oficial do Google Gemini).
- **Variáveis de Ambiente**: `NEXT_PUBLIC_GEMINI_API_KEY` (chave de API do Google Gemini).

## Exemplo de Uso
```typescript
import { generateResponse } from './geminiAna.ts';

const history = [
  { role: 'user', text: 'Como está o cliente João?' },
  { role: 'assistant', text: 'João está na fase de qualificação.' }
];

const pageContent = '<div>Dashboard mostrando métricas de vendas...</div>';

const response = await generateResponse(
  'Quais ações devo tomar com João?',
  history,
  pageContent
);

console.log(response); // "Com base nos dados, sugiro agendar uma reunião..."
```

## Notas Adicionais
- **Limitações**: Requer chave API válida; limitado pelas capacidades do modelo Gemini 2.5 Pro; pode ter custos associados ao uso da API.
- **Bugs Conhecidos**: Nenhum reportado; dependente da estabilidade da API do Google.
- **Melhorias Sugeridas**: Implementar cache de respostas; adicionar validação de entrada mais robusta; suportar múltiplos modelos; implementar retry automático em falhas de rede.
- **Uso Específico**: Integrado ao sistema de dashboard para fornecer assistência inteligente aos usuários sobre dados de clientes e decisões estratégicas.