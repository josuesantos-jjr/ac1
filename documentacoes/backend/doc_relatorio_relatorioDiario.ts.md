# Nome do Arquivo: relatorio/relatorioDiario.ts
**Caminho Relativo:** src/backend/relatorio/relatorioDiario.ts

## Propósito
Este arquivo implementa o sistema de geração e envio de relatórios diários automatizados, consolidando dados de performance de campanhas de marketing, conversas respondidas, estatísticas de funil e resumos individuais de chats. Ele coleta informações de múltiplas fontes (registros de disparo, histórico de conversas, dados estruturados) e gera relatórios detalhados enviados via WhatsApp para stakeholders.

## Funcionamento
O código executa um processo abrangente de análise diária:

1. **Coleta de Dados:** Reúne estatísticas de disparos, conversas ativas e distribuição por etapas do funil.

2. **Análise de Conversas:** Conta mensagens respondidas e identifica padrões de interação.

3. **Extração de Resumos:** Coleta resumos gerados por IA de cada conversa do dia.

4. **Agregação:** Combina métricas em relatório estruturado com seções organizadas.

5. **Persistência:** Salva dados detalhados em arquivo JSON mensal organizado.

6. **Envio:** Envia relatório formatado via WhatsApp para chat configurado.

## Entrada de Informações
- **client (any):** Instância do cliente WhatsApp para envio.
- **clientePath (string):** Caminho do diretório do cliente.
- **dataRelatorio (Date):** Data específica para gerar o relatório.

## Processamento de Informações
1. **Agregação de Métricas:** Conta disparos, follow-ups, conversas ativas e falhas.

2. **Análise Temporal:** Filtra dados por data específica usando formato brasileiro.

3. **Mapeamento de Funil:** Conta distribuição de leads por etapas do processo de vendas.

4. **Extração de Resumos:** Coleta resumos gerados por IA dos Dados.json.

5. **Formatação WhatsApp:** Estrutura relatório com emojis, quebras de linha e seções claras.

6. **Persistência Hierárquica:** Salva em estrutura ano/mês/dia para histórico completo.

## Saída de Informações
- **Mensagem WhatsApp:** Relatório detalhado enviado para TARGET_CHAT_ID.
- **Arquivo JSON:** Dados salvos em `relatorios_mensais.json` organizado por data.
- **Logs Detalhados:** Informações sobre processamento e métricas coletadas.

## Dependências
- **date-fns:** Manipulação de datas e formatação.
- **registroDisparo:** Funções para buscar registros e estatísticas.
- **fs (node:fs/promises):** Operações assíncronas de arquivo.
- **logger:** Sistema de logging centralizado.

## Exemplo de Uso
```typescript
import { criarEnviarRelatorioDiario } from './relatorioDiario';

// Gerar relatório diário para ontem
const ontem = new Date();
ontem.setDate(ontem.getDate() - 1);

await criarEnviarRelatorioDiario(
  clienteWhatsApp,
  "/caminho/do/cliente",
  ontem
);

// Resultado: Relatório completo enviado via WhatsApp e salvo em JSON
```

## Notas Adicionais
- **Análise Inteligente:** Conta apenas conversas respondidas (usuário respondeu à IA).
- **Estrutura Persistente:** Dados organizados por ano/mês/dia para consultas históricas.
- **Tratamento de Erros:** Relatório salvo localmente mesmo se envio falhar.
- **Notificações de Falha:** Sistema avisa quando envio para WhatsApp falha.
- **Métricas Abrangentes:** Combina dados quantitativos e qualitativos (resumos IA).
- **Flexibilidade:** Adapta-se a diferentes configurações de cliente.