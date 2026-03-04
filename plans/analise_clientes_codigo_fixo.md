# Análise: Separação de Código Fixo vs Nome de Exibição

## Problema Atual

Quando o usuário renomeia um cliente de "C1" para "Fotos", o sistema tenta buscar arquivos em `/app/clientes/Fotos/` mas a pasta real continua sendo `/app/clientes/C1/`.

## Estrutura Proposta

```
clientes/
├── C1/                    # Código fixo (nome da pasta)
│   ├── config/
│   │   ├── infoCliente.json
│   │   │   {
│   │   │     "codigo": "C1",      # Código fixo (igual ao nome da pasta)
│   │   │     "name": "Fotos",      # Nome de exibição (pode mudar)
│   │   │     "CLIENTE": "Fotos"    # Nome de exibição (pode mudar)
│   │   │   }
```

## Análise dos Arquivos Identificados

### 1. getPasta() - src/backend/disparo/disparo.ts:290
```typescript
export function getPasta(cliente: string) {
  return path.join(process.cwd(), 'clientes', cliente);
}
```
- **Problema**: Usa o parâmetro diretamente como nome de pasta
- **Solução**: Precisa receber o código e usar o código para buscar a pasta

### 2. rename/route.ts - src/app/api/client-operations/rename/route.ts
- **Problema atual**: Renomeia CLIENTE e name, mas o sistema continua usando o código
- **Correção**: Manter o código inalterado, apenas atualizar name e CLIENTE

### 3. listClientes/route.js - src/app/api/listClientes/route.js:141-143
```javascript
const clienteInfo = {
  id: clienteNome,                    // código (nome da pasta)
  name: infoCliente.CLIENTE || clienteNome,  // nome de exibição
  path: clienteNome,                  // código
};
```
- **Status**: Já está correto! Usa nome da pasta como ID e CLIENTE como name

### 4. create-client-functions/route.ts - src/app/api/create-client-functions/route.ts
- **Problema**: Quando cria novo cliente, usa nomePastaCliente que é gerado automaticamente (cliente1, cliente2)
- **Correção**: O código deve ser o nome da pasta, e name/CLIENTE deve ser o nome fornecido

## Pontos de Atenção

### Arquivos que usam getPasta() com clienteId:
1. **src/app/api/client-control/route.js** - Iniciar/parar cliente
2. **src/app/api/client-config/route.js** - Buscar configurações
3. **src/backend/followup/gerarMensagemFollowUp.ts** - Follow-up
4. **src/backend/followup/disparoFollowup.ts** - Disparo follow-up
5. **src/backend/followup/analise.ts** - Análise

### Informações que devem salvar both (código + nome):
- Relatórios
- Dados de conversas
- Listas de disparo
- Contatos
- Leads
- Histórico de mensagens

## Plano de Implementação

### Fase 1: Atualizar infoCliente.json
Adicionar campo `codigo` em todos os clientes existentes:
```json
{
  "codigo": "C1",  // Mesmo valor do nome da pasta
  "name": "Fotos",
  "CLIENTE": "Fotos"
}
```

### Fase 2: Modificar getPasta()
A função deve continuar funcionando como antes (receber código e retornar caminho)

### Fase 3: Modificar rename route
- Ler o código atual do infoCliente
- Apenas atualizar name e CLIENTE
- Manter codigo inalterado

### Fase 4: Garantir integridade
- Todos os arquivos que salvam dados devem salvar both (codigo + name)
- Buscas devem usar sempre o código

## Impactos Positivos
1. Renomear clientes não quebra referências internas
2. Sistema mais robusto e tolerante a mudanças de nome
3. Dados permanecem associados ao código fixo

## Riscos/Negativos
1. Necessário migrar clientes existentes para adicionar campo `codigo`
2.backups anteriores podem ter inconsistências se não seguirem o novo padrão

## Solução Imediata para o Erro
O erro "Script não encontrado em: /app/clientes/Fotos/index.ts" acontece porque:
- O sistema está tentando buscar em "Fotos" mas a pasta é "C1"

**Correção rápida**: Atualizar a API para usar o código (nome da pasta) em vez do nome de exibição.
