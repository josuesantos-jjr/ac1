# Documentação do Arquivo: src/backend/util/emojiUtils.ts

## Nome do Arquivo
`src/backend/util/emojiUtils.ts`

## Propósito
Este arquivo implementa utilitários para manipulação de emojis em mensagens de texto. Permite remover emojis de mensagens baseado na configuração específica do cliente, útil para sistemas que precisam de texto limpo para processamento por IA ou para evitar problemas de codificação.

## Funcionamento
O serviço opera como um filtro condicional de emojis:

1. **Verificação de Configuração**: Lê configuração `REMOVER_EMOJIS` do cliente.
2. **Processamento Condicional**: Remove emojis apenas se configurado como 'sim'.
3. **Regex Abrangente**: Usa múltiplos ranges Unicode para cobrir emojis diversos.
4. **Tratamento de Erros**: Fallback gracioso se configuração não for encontrada.

O algoritmo usa expressões regulares abrangentes para cobrir todos os blocos Unicode de emojis.

## Entrada de Informações
- **clientePath** (parâmetro `string`): Caminho do diretório do cliente.
- **message** (parâmetro `string`): Mensagem original que pode conter emojis.

As informações são recebidas de:
- Sistema de mensagens (texto com possíveis emojis).
- Arquivo `config/infoCliente.json` (configuração `REMOVER_EMOJIS`).

## Processamento de Informações
- **Validação**: Verifica configuração específica do cliente.
- **Filtragem**: Aplica regex abrangente para remoção de emojis.
- **Preservação**: Mantém texto original se configuração desabilitada.
- **Filtros**: Regex Unicode para múltiplos blocos de emojis.

## Saída de Informações
- **string**: Mensagem com ou sem emojis conforme configuração.

As saídas são destinadas a:
- Sistema de processamento de IA (texto limpo).
- Sistema de mensagens (texto sanitizado).

## Dependências
- **Módulos Node.js**: `fs`, `path` (leitura de configuração).

## Exemplo de Uso
```typescript
import { removeEmojisIfConfigured } from './emojiUtils.ts';

// Remover emojis se configurado para o cliente
const cleanMessage = removeEmojisIfConfigured(
  '/path/to/client',
  'Olá! 😊 Como vai? 👍'
);

// Resultado depende da configuração:
// Se REMOVER_EMOJIS = 'sim': 'Olá! Como vai?'
// Se REMOVER_EMOJIS = 'não': 'Olá! 😊 Como vai? 👍'
```

## Notas Adicionais
- **Limitações**: Cobertura Unicode pode não incluir emojis mais novos; configuração hardcoded; dependente de arquivo específico.
- **Bugs Conhecidos**: Nenhum reportado; implementação simples.
- **Melhorias Sugeridas**: Atualizar ranges Unicode regularmente; adicionar opção de substituir emojis por texto descritivo; implementar cache de configuração.