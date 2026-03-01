# Documentação do Arquivo: src/backend/util/saveMessage.ts

## Nome do Arquivo
`src/backend/util/saveMessage.ts`

## Propósito
Este arquivo implementa a função `saveMessageToFile`, responsável por persistir mensagens de chat em arquivos JSON estruturados. Salva histórico completo de conversas organizadamente por chatId, criando estrutura de diretórios automática e mantendo formato consistente de dados (data, hora, tipo, mensagem). Essencial para auditoria, análise de conversas e continuidade de contexto.

## Funcionamento
O serviço opera como um persistidor de mensagens:

1. **Limpeza de ID**: Padroniza chatId removendo prefixos/sufixos indesejados.
2. **Criação de Estrutura**: Gera diretórios automaticamente se não existirem.
3. **Formatação Temporal**: Registra data/hora em formato brasileiro legível.
4. **Estruturação de Dados**: Salva mensagens em formato JSON padronizado.
5. **Acúmulo Sequencial**: Adiciona novas mensagens ao histórico existente.
6. **Criação de Dados**: Inicializa arquivo `Dados.json` se não existir.

O algoritmo garante que cada conversa tenha seu histórico completo preservado em formato estruturado.

## Entrada de Informações
- **chatId** (parâmetro `string`): Identificador do chat (será limpo automaticamente).
- **message** (parâmetro `string`): Conteúdo da mensagem.
- **type** (parâmetro `'User' | 'IA'`): Tipo da mensagem (usuário ou assistente).
- **__dirname** (parâmetro `string`): Caminho base do cliente.

As informações são recebidas de:
- Sistema de mensagens WhatsApp (conteúdo de mensagens enviadas/recebidas).
- Sistema de IA (respostas geradas).

## Processamento de Informações
- **Limpeza**: Aplica `cleanChatId` para padronização.
- **Validação**: Cria diretórios e arquivos se não existirem.
- **Formatação**: Converte timestamp para formato brasileiro.
- **Estruturação**: Cria objeto JSON padronizado por mensagem.
- **Acúmulo**: Lê histórico existente e adiciona nova mensagem.
- **Persistência**: Salva em arquivo JSON formatado.

## Saída de Informações
- **void**: Função executa salvamento, sem retorno direto.

As saídas são destinadas a:
- Arquivo JSON de histórico (`{chatId}.json`).
- Arquivo de dados básico (`Dados.json`).

## Dependências
- **Módulos Locais**: `cleanChatId` do `chatDataUtils.ts` (limpeza de IDs).
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).

## Exemplo de Uso
```typescript
import { saveMessageToFile } from './saveMessage.ts';

// Salvar mensagem do usuário
await saveMessageToFile(
  '551199999999@c.us_validation_1',
  'Olá, gostaria de informações sobre imóveis',
  'User',
  '/path/to/client'
);

// Salvar resposta da IA
await saveMessageToFile(
  '551199999999@c.us',
  'Claro! Temos vários imóveis disponíveis.',
  'IA',
  '/path/to/client'
);
```

## Notas Adicionais
- **Limitações**: Operações síncronas podem bloquear thread; arquivos podem crescer indefinidamente; formato brasileiro hardcoded.
- **Bugs Conhecidos**: Nenhum reportado; implementação simples e direta.
- **Melhorias Sugeridas**: Implementar rotação de arquivos por tamanho; adicionar compressão; implementar backup automático; adicionar validação de estrutura.