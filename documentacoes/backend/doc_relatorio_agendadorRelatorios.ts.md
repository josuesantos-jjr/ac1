# Nome do Arquivo: relatorio/agendadorRelatorios.ts
**Caminho Relativo:** src/backend/relatorio/agendadorRelatorios.ts

## Propósito
Este arquivo implementa um sistema de agendamento automático de relatórios, utilizando expressões cron para executar geração e envio de diferentes tipos de relatórios (diários, semanais e mensais) em horários específicos. Ele garante que stakeholders recebam informações atualizadas sobre performance de campanhas de marketing de forma regular e automatizada.

## Funcionamento
O código configura três tipos de agendamentos cron:

1. **Relatórios Diários:** Executados no final do horário comercial configurado, nos dias úteis permitidos.

2. **Relatórios Semanais:** Executados toda segunda-feira às 9h.

3. **Relatórios Mensais:** Executados no primeiro dia de cada mês às 9h.

Cada agendamento gera múltiplos tipos de relatório e os combina em uma única mensagem enviada via WhatsApp.

## Entrada de Informações
- **client (any):** Instância do cliente WhatsApp para envio de mensagens.
- **clientePath (string):** Caminho do diretório do cliente contendo configurações.

## Processamento de Informações
1. **Carregamento de Configurações:** Lê regras de disparo e informações do cliente para determinar horários e destino.

2. **Conversão de Dias:** Converte nomes de dias da semana para índices numéricos do cron.

3. **Configuração de Expressões Cron:** Cria schedules baseados nas regras configuradas.

4. **Execução Automática:** Processa diferentes tipos de relatório conforme periodicidade.

5. **Agregação de Conteúdo:** Combina múltiplos relatórios em mensagem única.

## Saída de Informações
- **Mensagens WhatsApp:** Relatórios automatizados enviados para TARGET_CHAT_ID configurado.
- **Logs Detalhados:** Informações sobre execução de agendamentos e possíveis erros.

## Dependências
- **node-cron:** Biblioteca para agendamento de tarefas cron.
- **logger:** Sistema de logging centralizado.
- **geradorRelatorios:** Funções para gerar diferentes tipos de relatório.
- **fs:** Operações de leitura de arquivos de configuração.

## Exemplo de Uso
```typescript
import { iniciarAgendamentoRelatorios } from './agendadorRelatorios';

// Iniciar sistema de relatórios automatizados
await iniciarAgendamentoRelatorios(
  clienteWhatsApp,
  "/caminho/do/cliente"
);

// Sistema irá automaticamente:
// - Enviar relatório diário no final do expediente útil
// - Enviar relatório semanal toda segunda às 9h
// - Enviar relatório mensal no dia 1 às 9h
// - Todos enviados para o TARGET_CHAT_ID configurado
```

## Notas Adicionais
- **Flexibilidade:** Adapta horários baseado nas regras de disparo do cliente.
- **Robustez:** Continua funcionando mesmo se algumas execuções falharem.
- **Integração:** Vinculado automaticamente ao sistema de disparo principal.
- **Periodicidades:** Suporte a relatórios diários, semanais e mensais.
- **Múltiplas Métricas:** Combina performance, análise diária e funil de vendas.
- **Configuração Obrigatória:** Requer TARGET_CHAT_ID definido no infoCliente.json.