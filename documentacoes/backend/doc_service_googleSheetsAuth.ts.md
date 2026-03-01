# Documentação do Arquivo: src/backend/service/googleSheetsAuth.ts

## Nome do Arquivo
`src/backend/service/googleSheetsAuth.ts`

## Propósito
Este arquivo implementa o `GoogleSheetsAuth`, um serviço completo para gerenciamento de autenticação OAuth 2.0 com Google APIs, especificamente focado em Sheets e Drive. Gerencia todo o fluxo de autenticação, armazenamento seguro de tokens, renovação automática e verificação de expiração. É o componente fundamental para integração com Google Workspace, permitindo leitura/escrita em planilhas e criação de arquivos.

## Funcionamento
O serviço opera como um gerenciador de autenticação OAuth completo:

1. **Inicialização**: Carrega credenciais de arquivo ou variáveis de ambiente, cria cliente OAuth2.
2. **Fluxo de Autenticação**: Gera URLs de autorização e processa callbacks.
3. **Gerenciamento de Tokens**: Salva/carrega tokens automaticamente, verifica expiração.
4. **Renovação Automática**: Refresh tokens quando necessário (5 minutos antes de expirar).
5. **Verificação de Estado**: Métodos para verificar autenticação e logout.
6. **Clientes API**: Fornece instâncias autenticadas de Sheets e Drive APIs.

O algoritmo segue o padrão OAuth 2.0 com concessão de código de autorização, armazenando tokens localmente para persistência de sessão.

## Entrada de Informações
- **code** (parâmetro do método `handleAuthCallback`): Código de autorização retornado pelo Google no callback OAuth.

As informações são recebidas de:
- Arquivo `credentials.json` (credenciais OAuth do Google Console).
- Variáveis de ambiente (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`).
- Arquivo `token.json` (tokens OAuth salvos localmente).

## Processamento de Informações
- **Validação**: Verifica existência e validade de credenciais e tokens.
- **Transformação**: Converte entre formatos de token e credenciais OAuth.
- **Cálculos**: Verifica expiração de tokens comparando timestamps.
- **Filtros**: Não aplicável - serviço de infraestrutura.
- **Controle de Fluxo**: Inicialização condicional baseada em disponibilidade de credenciais.

## Saída de Informações
- **string**: URL de autorização OAuth (`generateAuthUrl`).
- **boolean**: Status de autenticação (`isAuthenticated`) ou sucesso de callback (`handleAuthCallback`).
- **Clientes API**: Instâncias autenticadas de Sheets (`getSheetsClient`) e Drive (`getDriveClient`).

As saídas são destinadas a:
- Interface do usuário (URLs de autenticação).
- Outros serviços (clientes API autenticados).
- Sistema de logs (status de autenticação).

## Dependências
- **Bibliotecas Externas**: `googleapis` (APIs do Google), `google-auth-library` (OAuth2), `dotenv` (variáveis).
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).
- **Módulos Locais**: `createLogger` do módulo `../util/logger.ts` (logs estruturados).

## Exemplo de Uso
```typescript
import { googleSheetsAuth } from './googleSheetsAuth.ts';

// Verificar se está autenticado
if (!googleSheetsAuth.isAuthenticated()) {
  // Gerar URL de autorização
  const authUrl = googleSheetsAuth.generateAuthUrl();
  // Redirecionar usuário para authUrl
  
  // Após callback, processar código
  const success = await googleSheetsAuth.handleAuthCallback(code);
}

// Usar APIs autenticadas
const sheets = await googleSheetsAuth.getSheetsClient();
const drive = await googleSheetsAuth.getDriveClient();
```

## Notas Adicionais
- **Segurança**: Tokens armazenados localmente em arquivo; renovação automática transparente; verificação de expiração rigorosa.
- **Limitações**: Requer configuração manual de credenciais OAuth no Google Console; dependente de arquivos locais para persistência.
- **Bugs Conhecidos**: Nenhum reportado; tratamento robusto de erros em todas as operações.
- **Melhorias Sugeridas**: Implementar criptografia de tokens armazenados; adicionar métricas de uso; suportar múltiplas contas OAuth.
- **Uso Específico**: Infraestrutura essencial para integração com Google Workspace, usado por CRM e outros serviços que precisam de planilhas.