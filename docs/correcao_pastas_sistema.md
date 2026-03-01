# Correção: Pastas de Sistema na Pasta Clientes

## Problema Identificado
As pastas `system-cache` e `monitoring` estavam sendo criadas incorretamente dentro da pasta `clientes/`, quando deveriam ficar em pastas separadas no diretório raiz.

## Causa Raiz
O `SyncManager` no arquivo `src/database/sync.ts` estava criando todas as pastas dentro de `clientes/` baseado no `clientId`, sem diferenciar pastas de sistema de pastas de clientes.

## Soluções Implementadas

### 1. Modificação do SyncManager (`src/database/sync.ts`)

**Adicionadas funções de controle:**
- `systemFolders`: Lista de pastas de sistema
- `isSystemFolder()`: Detecta se um clientId é de sistema
- `getClientPath()`: Retorna o caminho correto baseado no tipo

**Alterações nos métodos:**
- `saveToJSON()`: Roteamento correto de pastas
- `loadFromJSON()`: Carregamento das pastas corretas
- `saveToSQLite()`: Pula salvamento para pastas de sistema
- `loadFromSQLite()`: Pula carregamento para pastas de sistema

### 2. Estrutura de Pastas Corrigida

**Antes (incorreto):**
```
clientes/
├── CMW/
├── system-cache/          ❌ Pasta de sistema no lugar errado
├── monitoring/            ❌ Pasta de sistema no lugar errado
└── modelos/
```

**Depois (correto):**
```
clientes/
├── CMW/
└── modelos/

system-cache/              ✅ Pasta de sistema no lugar correto
├── config/
└── smartCache.json

monitoring/                ✅ Pasta de sistema no lugar correto
├── config/
└── monitoringAlerts.json
```

### 3. Código Afetado

**Arquivos que criavam as pastas incorretas:**
- `src/backend/service/smartCache.ts` (linha 109): `clientId = 'system-cache'`
- `src/backend/service/monitoringService.ts` (linha 192): `saveClientData("monitoring", ...)`

### 4. Arquivos Removidos
- `clientes/system-cache/` (removida)
- `clientes/monitoring/` (removida)

## Funcionalidade Mantida
- ✅ Sistema de cache continua funcionando
- ✅ Sistema de monitoramento continua funcionando  
- ✅ Sincronização JSON ↔ SQLite preservada
- ✅ Dados de clientes normais não foram afetados

## Próximos Passos
As pastas `system-cache` e `monitoring` serão criadas automaticamente nos caminhos corretos quando os respectivos serviços forem utilizados.

## Data da Correção
03/12/2025 12:29 - Concluída com sucesso