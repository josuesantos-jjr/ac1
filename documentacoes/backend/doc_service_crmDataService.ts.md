# Documentação do Arquivo: src/backend/service/crmDataService.ts

## Nome do Arquivo
`src/backend/service/crmDataService.ts`

## Propósito
Este arquivo implementa o `CRMDataService`, um serviço abrangente para gerenciamento de dados de CRM (Customer Relationship Management) em um sistema de vendas. Centraliza o armazenamento e sincronização de contatos entre SQLite local e Google Sheets, oferecendo funcionalidades completas de CRUD (Create, Read, Update, Delete), filtros avançados, sincronização bidirecional e importação de dados legados. É o núcleo do sistema de gerenciamento de leads e contatos.

## Funcionamento
O serviço opera como uma ponte entre múltiplos sistemas de armazenamento:

1. **Inicialização**: Conecta ao SQLite, cria tabelas automaticamente e verifica autenticação Google.
2. **CRUD de Contatos**: Salva, carrega, atualiza e lista contatos com filtros avançados.
3. **Sincronização**: Mantém dados sincronizados entre SQLite local e Google Sheets automaticamente.
4. **Importação**: Converte dados legados de arquivos `dados.json` para o formato CRM.
5. **Exportação**: Gera relatórios CSV completos dos dados.
6. **Gerenciamento de Planilhas**: Cria e mantém planilhas Google Sheets automaticamente.

O algoritmo usa SQLite como fonte primária (mais rápido para consultas) e Google Sheets como backup/visualização (mais acessível), com sincronização automática em operações de escrita. A lógica de controle inclui filtros dinâmicos, conversão de tipos de dados e tratamento robusto de erros.

## Entrada de Informações
- **contact** (parâmetro do tipo `CRMContact`): Objeto completo com dados do contato incluindo ID, nome, telefone, tags, scores, etc.
- **chatId** (parâmetro `string`): Identificador único do chat WhatsApp.
- **updates** (parâmetro `Partial<CRMContact>`): Campos parciais para atualização.
- **filters** (parâmetro opcional): Objeto com filtros como `etapaFunil`, `lead`, `status`, `limit`, `offset`.
- **clientePath** (parâmetro `string`): Caminho para importação de dados legados.

As informações são recebidas de:
- Chamadas de API direta (CRUD operations).
- Sistema de arquivos local (importação de `dados.json`).
- Google Sheets (sincronização bidirecional).

## Processamento de Informações
- **Validação**: Verifica existência de IDs únicos, valida campos obrigatórios.
- **Transformação**: Converte entre formatos (SQLite ↔ CRMContact ↔ Google Sheets), serializa JSON para strings.
- **Cálculos**: Não aplicável diretamente - serviço é de armazenamento.
- **Filtros**: Aplica filtros SQL dinâmicos em consultas, ordenação por data de atualização.
- **Controle de Fluxo**: Operações assíncronas com Promises, sincronização condicional baseada em autenticação Google.
- **Conversão de Tipos**: Boolean ↔ INTEGER (0/1), arrays ↔ JSON strings, datas em ISO string.

## Saída de Informações
- **CRMContact**: Objeto completo do contato (métodos `loadContact`, `listContacts`).
- **void**: Confirmação de operações de escrita (`saveContact`, `updateContact`).
- **string**: Conteúdo CSV completo (`exportToCSV`).
- **number**: Contagem de registros importados (`importFromDadosJson`).

As saídas são destinadas a:
- Outros serviços do backend (dados de contatos).
- Interface do usuário (listas filtradas, detalhes de contato).
- Google Sheets (sincronização automática).
- Arquivos CSV (exportação de dados).

## Dependências
- **Módulos Node.js**: `sqlite3` (banco de dados local), `fs` e `path` (operações de arquivo).
- **Bibliotecas Externas**: `createLogger` do módulo `../util/logger.ts` (logs estruturados), `googleSheetsAuth` do módulo `./googleSheetsAuth.ts` (integração Google).
- **Arquivos Locais**: Depende da estrutura de pastas `clientes/*/Chats/Historico/*/dados.json` para importação.

## Exemplo de Uso
```typescript
import { crmDataService, CRMContact } from './crmDataService.ts';

// Adicionar novo contato
const novoContato: CRMContact = {
  id: '123@c.us',
  chatId: '123@c.us',
  nome: 'João Silva',
  telefone: '11999999999',
  tags: ['potencial'],
  lead: 'sim',
  leadScore: 85,
  etapaFunil: 'Qualificação',
  // ... outros campos
};

await crmDataService.addContact(novoContato);

// Listar contatos filtrados
const leads = await crmDataService.listContacts({
  lead: 'sim',
  etapaFunil: 'Qualificação',
  limit: 50
});

// Exportar para CSV
const csvData = await crmDataService.exportToCSV();
```

## Notas Adicionais
- **Otimizações**: Usa SQLite como cache rápido, sincronização assíncrona com Google Sheets para não bloquear operações.
- **Limitações**: Requer autenticação Google para funcionalidades de sincronização; conversão de dados legados assume estrutura específica de `dados.json`.
- **Bugs Conhecidos**: Sincronização pode falhar se planilha for deletada - sistema recria automaticamente.
- **Melhorias Sugeridas**: Implementar cache Redis para melhor performance; adicionar validação de schema mais robusta; implementar versionamento de dados.
- **Segurança**: Dados sensíveis (telefones, emails) armazenados localmente e na nuvem; implementar criptografia se necessário.