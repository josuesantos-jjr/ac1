# Plano de Migração: Novo Sistema de Identificação de Clientes

## Estrutura Nova

### infoCliente.json
```json
{
  "id": "C1",           // identificador fixo (nome da pasta)
  "CLIENTE": "fotos",   // nome de exibição
  // ...outros campos
}
```

**REGRAS:**
- `id` = nome da pasta do cliente (nunca muda)
- `CLIENTE` = nome que aparece nos cards e relatórios (pode mudar)
- Remover campos `name` e `codigo` redundantes

---

## Análise de Arquivos e Alterações Necessárias

### 1. listClientes/route.js
**Status:** ✅ Já returns `id` and `CLIENTE` correctly

Retorna:
```javascript
{
  id: item,              // nome da pasta
  CLIENTE: infoCliente.CLIENTE || item,
  // ...
}
```

**Ação:** OK - não precisa de mudança

---

### 2. create-client-functions/route.ts
**Status:** ⚠️ Usa `codigo`, precisa mudar para `id`

**Campo atual:**
```javascript
const infoClienteData = {
  codigo: nomePastaCliente,
  CLIENTE: nomeCliente,
  // ...
};
```

**Alterar para:**
```javascript
const infoClienteData = {
  id: nomePastaCliente,   // id = nome da pasta
  CLIENTE: nomeCliente,
  // remover codigo
};
```

---

### 3. client-operations/rename/route.ts
**Status:** ⚠️ Usa `nomePastaCliente` mas precisa referenciar o `id` corretamente

**Problema:** O endpoint recebe `nomePastaCliente` que é o id, mas o campo no JSON ainda é `codigo`

**Alterar para:**
```javascript
// Usar id para atualizar
infoClienteData.id = nomePastaCliente;  // garantir que id existe
infoClienteData.CLIENTE = newClientName;
// remover codigo se existir
delete infoClienteData.codigo;
```

---

### 4. client-control/route.js
**Status:** ⚠️ Precisa usar `id` para caminhos

**Atual:**
```javascript
const scriptPath = path.join(process.cwd(), 'clientes', clientId, 'index.ts');
// getClientName busca CLIENTE do JSON
```

**Ação:** Já funciona - `clientId` é o `id` (nome da pasta), e usa CLIENTE apenas para nome do processo PM2

---

### 5. DraggableCard.js
**Status:** ⚠️ Usa `cliente.name` para display, precisa mudar para `cliente.CLIENTE`

**Locais a alterar:**
- Linha 212: `<h2>{cliente.name}</h2>` → `<h2>{cliente.CLIENTE}</h2>`
- Linha 220: `clientName={cliente.name}` → `clientName={cliente.CLIENTE}`
- Linha 222: `onCopy(cliente.folderType, cliente.name)` → `onCopy(cliente.folderType, cliente.id)`
- Linha 223: similar para paste
- Linha 224: similar para duplicate
- Linha 226: `onDownloadClientFolder(cliente.name)` → `onDownloadClientFolder(cliente.id)`
- Linha 315: `onEditarCliente(cliente.id)` → OK (já usa id)

---

### 6. DroppableSection.js
**Status:** ⚠️ Passa `cliente.name` para algumas funções

**Locais a alterar:**
- Linha 38: `onCopy(type, cliente.name)` → `onCopy(type, cliente.id)`
- Linha 39: `onPaste(type, cliente.name)` → `onPaste(type, cliente.id)`
- Linha 40: `onDuplicate(type, cliente.name)` → `onDuplicate(type, cliente.id)`

---

### 7. dashboard/page.js
**Status:** ⚠️ Precisa revisar

**Locais a alterar:**
- Linha 318: `clientId: dados.name` - verificar se `dados.name` é o id

---

### 8. Outras APIs que usam clientId
Todas essas APIs já usam `clientId` como identificador (nome da pasta), então devem funcionar se passarmos o `id` correto:

- `client-config/route.js` ✅
- `save-client-config/route.js` ✅
- `disparo-status/route.js` ✅
- `relatorio/route.js` ✅
- `regras-disparo/route.js` ✅
- `listas/route.js` ✅
- `media/route.js` ✅
- `chat-history/route.js` ✅
- `blocked-numbers/route.js` ✅
- `followup-config/route.js` ✅
- `env-status/route.js` ✅
- `qr-code/route.js` ✅
- `pm2-status/route.js` ✅

---

## Resumo das Alterações

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | create-client-functions/route.ts | Mudar `codigo` → `id` |
| 2 | client-operations/rename/route.ts | Usar `id` e remover `codigo` |
| 3 | DraggableCard.js | Usar `CLIENTE` para display, `id` para operações |
| 4 | DroppableSection.js | Passar `id` para copy/paste/duplicate |
| 5 | dashboard/page.js | Verificar uso de `name` vs `id` |

---

##Migração de Clientes Existentes

Para clientes existentes (como `clientes/C1/config/infoCliente.json`), criar script de migração que:

1. Lê o infoCliente.json atual
2. Se existir `codigo`, move para `id`
3. Se existir `name`, remove
4. Remove `codigo`
5. Salva

---

## Fluxo de Dados após Migração

```
[Frontend - Card]
  ├── Exibe: cliente.CLIENTE (nome de exibição)
  │
  ├── Calls API: clientId=cliente.id (identificador fixo)
  │
  └── Passa para DraggableCard: cliente.id

[API - listClientes]
  ├── Lê pasta: clientes/{id}/config/infoCliente.json
  ├── Extrai: id = nome da pasta
  ├── Extrai: CLIENTE = infoCliente.CLIENTE
  └── Retorna: { id, CLIENTE, ... }

[API - Operations]
  ├── Usa clientId para caminho: clientes/{clientId}/...
  └── Busca CLIENTE do JSON apenas para display/nome do processo PM2
```
