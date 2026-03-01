# Documentação do Arquivo: src/backend/util/chatDataUtils.ts

## Nome do Arquivo
`src/backend/util/chatDataUtils.ts`

## Propósito
Este arquivo implementa utilitários para manipulação de dados de chat no sistema. Fornece funções para limpeza de IDs de chat, atualização automática de timestamps de mensagens recebidas/enviadas nos arquivos `dados.json` dos clientes. Essencial para manter consistência nos dados de histórico de conversas e rastreamento temporal de interações.

## Funcionamento
O serviço opera como um conjunto de utilitários de dados:

1. **Limpeza de ChatId**: Remove prefixos/sufixos indesejados de validação, padronizando formato.
2. **Atualização de Timestamps**: Registra automaticamente datas de mensagens recebidas/enviadas.
3. **Criação Automática**: Gera estrutura de dados se arquivos não existirem.
4. **Tratamento de Erros**: Robust error handling para arquivos corrompidos.

O algoritmo garante que dados de chat estejam sempre atualizados e padronizados.

## Entrada de Informações
- **chatId** (parâmetro `string`): ID do chat a ser processado.
- **clientePath** (parâmetro `string`): Caminho base do cliente.

As informações são recebidas de:
- Sistema de mensagens (IDs de chat).
- Sistema de arquivos (caminhos de clientes).

## Processamento de Informações
- **Limpeza**: Regex para remover padrões de validação de chatIds.
- **Validação**: Verificações de existência de diretórios e arquivos.
- **Atualização**: Timestamps ISO de mensagens recebidas/enviadas.
- **Criação**: Estrutura de dados padrão se arquivos não existirem.
- **Persistência**: Salvamento automático em JSON formatado.

## Saída de Informações
- **string**: ChatId limpo (`cleanChatId`).
- **void**: Operações de atualização não retornam valor.

As saídas são destinadas a:
- Sistema de dados (IDs padronizados).
- Arquivos `dados.json` (timestamps atualizados).

## Dependências
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).

## Exemplo de Uso
```typescript
import { cleanChatId, updateLastReceivedMessageDate } from './chatDataUtils.ts';

// Limpar ID de chat
const cleanId = cleanChatId('5519988675879@c.us_validation_1');
// Resultado: '5519988675879@c.us'

// Atualizar data da última mensagem recebida
updateLastReceivedMessageDate('/path/to/client', '5511999999999@c.us');
// Atualiza dados.json com timestamp atual
```

## Notas Adicionais
- **Limitações**: Operações síncronas podem bloquear thread; dependente de estrutura de pastas específica.
- **Bugs Conhecidos**: Nenhum reportado; funções simples e bem testadas.
- **Melhorias Sugeridas**: Implementar versionamento de dados; adicionar validação de formato; implementar backup automático.