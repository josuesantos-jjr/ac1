# Nome do Arquivo: followup/analise.ts
**Caminho Relativo:** src/backend/followup/analise.ts

## Propósito
Este arquivo implementa o sistema de análise automática de follow-up para conversas de chat, determinando quais contatos precisam de acompanhamento baseado em interesse demonstrado e criando/gerenciando níveis de follow-up. Ele analisa todos os chats de um cliente, filtra aqueles com interesse ativo e mantém um registro estruturado de follow-ups necessários.

## Funcionamento
O código executa uma análise abrangente de todos os chats do cliente:

1. **Verificação de Configuração:** Confirma se o sistema de follow-up está ativo para o cliente.

2. **Iteração de Chats:** Processa todos os diretórios de chat no histórico do cliente.

3. **Análise de Interesse:** Avalia se o contato demonstrou interesse suficiente para follow-up.

4. **Criação de Níveis:** Atribui nível inicial de follow-up (1) para contatos elegíveis.

5. **Gestão de Registros:** Atualiza arquivo followups.json com entradas únicas, evitando duplicatas.

6. **Limpeza:** Remove follow-ups para contatos que perderam interesse.

## Entrada de Informações
- **clienteId (string):** Identificador único do cliente para localizar seus dados.

## Processamento de Informações
1. **Carregamento de Configuração:** Obtém configurações de follow-up do cliente.

2. **Listagem de Chats:** Varre diretório de histórico para encontrar todos os chats ativos.

3. **Carregamento de Dados:** Lê arquivo Dados.json de cada chat para avaliar interesse.

4. **Filtragem por Interesse:** Exclui contatos com interesse negativo ou ausente.

5. **Atribuição de Níveis:** Define nível_followup inicial para novos candidatos.

6. **Atualização de Registros:** Mantém followups.json sincronizado com dados atuais.

## Saída de Informações
- **Arquivo followups.json:** Atualizado com registros de follow-up por chatId.
- **Arquivo Dados.json:** Modificado com campo nivel_followup quando necessário.
- **Logs Detalhados:** Registra decisões tomadas para cada chat processado.

## Dependências
- **getFollowUpConfig:** Função para obter configurações de follow-up.
- **getPasta:** Utilitário para resolver caminho do cliente.
- **cleanChatId:** Função para normalizar identificadores de chat.
- **fs (node:fs/promises e node:fs):** Operações de arquivo assíncronas e síncronas.
- **path:** Manipulação de caminhos de arquivo.

## Exemplo de Uso
```typescript
import { analisarNecessidadeFollowUp } from './analise';

// Analisar todos os chats do cliente para follow-up
await analisarNecessidadeFollowUp("cliente123");

// Sistema irá:
// - Verificar se follow-up está ativo
// - Analisar interesse de cada chat
// - Criar/Atualizar registros em followups.json
// - Atribuir níveis iniciais de follow-up
// - Remover follow-ups desnecessários
```

## Notas Adicionais
- **Controle de Duplicatas:** Sistema inteligente evita registros duplicados em followups.json.
- **Filtragem Inteligente:** Remove automaticamente contatos com interesse negativo.
- **Resiliente:** Continua processamento mesmo se alguns chats tiverem dados corrompidos.
- **Configurável:** Respeita configurações específicas de cada cliente.
- **Auditoria:** Logs detalhados facilitam rastreamento de decisões.
- **Integração:** Vinculado ao sistema de disparo de follow-up automático.