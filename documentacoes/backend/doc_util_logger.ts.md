# Documentação do Arquivo: src/backend/util/logger.ts

## Nome do Arquivo
`src/backend/util/logger.ts`

## Propósito
Este arquivo implementa o sistema de logging estruturado baseado em Winston, com suporte a logs por cliente, rotação automática de arquivos, sanitização de dados e compatibilidade tanto com logs JSON estruturados quanto console legível. Fornece logger específico por cliente com categorização, fonte e backup automático de arquivos corrompidos.

## Funcionamento
O serviço opera como um sistema de logging multi-nível:

1. **Instanciação por Cliente**: Cria loggers específicos com diretório isolado (`clientes/{clienteId}/config/logs/`).
2. **Rotação de Arquivos**: Limita tamanho (50MB) e quantidade (10 arquivos) com rotação automática.
3. **Sanitização**: Remove caracteres de controle que podem corromper JSON.
4. **Estrutura Hierárquica**: Logs por data, backup de arquivos corrompidos, limite de entradas (10000).
5. **Compatibilidade**: Múltiplos transports (arquivo + console), formatação legível em desenvolvimento.
6. **Recuperação**: Detecta e recupera arquivos de log corrompidos automaticamente.

O algoritmo combina Winston para transporte eficiente com sanitização personalizada para garantir integridade dos dados de log.

## Entrada de Informações
- **clienteId** (parâmetro opcional `string`): Identificador do cliente para isolamento de logs.
- **categoria** (parâmetro opcional `string`): Categoria do log (ex: 'crm-data', 'backend-util').
- **fonte** (parâmetro opcional `string`): Arquivo/função de origem do log.
- **message** (parâmetro `string`): Mensagem de log principal.
- **details** (parâmetro opcional `any`): Dados adicionais estruturados.

As informações são recebidas de:
- Todos os módulos do sistema (através de `createLogger()`).
- Sistema de Winston (para transporte e rotação).

## Processamento de Informações
- **Validação**: Sanitiza strings e objetos para remover caracteres perigosos.
- **Estruturação**: Converte dados em formato JSON estruturado com timestamps ISO.
- **Limitação**: Mantém histórico limitado por tamanho e quantidade.
- **Backup**: Salva arquivos corrompidos automaticamente antes de reset.
- **Filtros**: Remove caracteres de controle Unicode.
- **Controle de Fluxo**: Salvamento síncrono com tratamento de erros robusto.

## Saída de Informações
- **void**: Métodos de log (`info`, `error`, `warn`, `debug`) não retornam valor.
- Logs salvos em arquivos JSON estruturados e console (desenvolvimento).

As saídas são destinadas a:
- Arquivos de log diários (`YYYY-MM-DD.json`).
- Console do desenvolvedor (formatação colorida).
- Sistema de backup (arquivos corrompidos salvos separadamente).

## Dependências
- **Bibliotecas Externas**: `winston` (framework de logging), `winston.transports` (transports de arquivo/console).
- **Módulos Node.js**: `fs`, `path`, `os` (operações de arquivo).

## Exemplo de Uso
```typescript
import { createLogger } from './logger.ts';

// Logger específico do cliente
const logger = createLogger({
  clienteId: 'CMW',
  categoria: 'crm-data',
  fonte: 'src/backend/service/crmDataService.ts'
});

// Logs estruturados
logger.info('Contato salvo no SQLite', {
  contactId: '123@c.us',
  leadScore: 85
});

logger.error('Erro ao salvar contato', {
  error: 'Database connection failed',
  contactId: '123@c.us'
});
```

## Notas Adicionais
- **Limitações**: Sanitização pode remover caracteres válidos; limite de entradas pode perder logs antigos; dependente de estrutura de diretórios específica.
- **Bugs Conhecidos**: Nenhum reportado; sistema bem testado com recuperação automática.
- **Melhorias Sugeridas**: Adicionar compressão de logs antigos; implementar envio para sistemas externos (ELK, CloudWatch); adicionar métricas de performance de logging.