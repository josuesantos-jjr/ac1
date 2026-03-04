# Plano de Consolidação: Remover `name` e usar apenas `CLIENTE`

## Objetivo
Remover o campo `name` do infoCliente.json e统一izar todas as funções para usar apenas `CLIENTE`.

## Análise de Uso de `name` e `CLIENTE`

### Arquivos que usam `name` (precisam ser alterados):

| Arquivo | Linha | Uso Atual | Ação |
|---------|-------|------------|-------|
| src/database/sync.ts | 153 | `data.infoCliente.name \|\| data.infoCliente.CLIENTE` | Remover fallback para name |
| src/database/migration.ts | 66 | `configData.name \|\| configData.CLIENTE` | Remover fallback para name |
| src/app/api/client-operations/route.js | 153-154, 207-208 | `pastedInfo.name = ...` `duplicatedInfo.name = ...` | Remover atribuição de name |
| src/app/api/client-operations/rename/route.ts | 53-54 | `infoClienteData.name = ...` | Remover atribuição de name |

### Arquivos que já usam apenas `CLIENTE` (não precisam de alteração):
- src/app/api/client-control/route.js - linha 12
- src/app/api/listClientes/route.js - linha 142
- src/app/api/whatsapp-status/route.ts - linha 180
- src/backend/analiseConversa/qualificarLead.ts - linhas 254, 264, 294, 612

### Arquivos com `CLIENTE_ID` (diferente - não é cliente name):
- src/app/components/EditClientModalImproved.js - linhas 618-639
- src/app/api/listClientes/route.js - linha 33

## Ação Required

### 1. Remover `name` do infoCliente.json
Manter apenas:
```json
{
  "CLIENTE": "Fotos"
}
```

### 2. Alterar arquivos:

#### src/database/sync.ts:153
```typescript
// Antes:
name: data.infoCliente.name || data.infoCliente.CLIENTE,

// Depois:
name: data.infoCliente.CLIENTE,
```

#### src/database/migration.ts:66
```typescript
// Antes:
name: configData.name || configData.CLIENTE || clientName,

// Depois:
name: configData.CLIENTE || clientName,
```

#### src/app/api/client-operations/route.js
- Linha 153: Remover `pastedInfo.name = ...`
- Linha 154: Remover `pastedInfo.name = ...`  
- Linha 207: Remover `duplicatedInfo.name = ...`
- Linha 208: Remover `duplicatedInfo.name = ...`

#### src/app/api/client-operations/rename/route.ts:53-54
```typescript
// Antes:
infoClienteData.CLIENTE = newClientName;
infoClienteData.name = newClientName;

// Depois:
infoClienteData.CLIENTE = newClientName;
// Remover name
```

## Verificação Final

Após as alterações, verificar que:
1. Nenhum arquivo usa `.name` para referenciar o nome do cliente
2. Todas as referências usam apenas `.CLIENTE`
3. O campo `name` não é mais usado em nenhuma operação de leitura/escrita

## Risco
- Baixo: As alterações são simples remoções de campos redundantes
- Compatibilidade: Os fallbacks foram mantidos onde necessário durante a migração
