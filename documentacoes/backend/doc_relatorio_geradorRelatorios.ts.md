# Nome do Arquivo: relatorio/geradorRelatorios.ts
**Caminho Relativo:** src/backend/relatorio/geradorRelatorios.ts

## Propósito
Este arquivo implementa um conjunto de funções para geração automática de relatórios analíticos sobre performance de campanhas de marketing, análise diária de saúde do sistema e acompanhamento do funil de vendas. Ele processa dados estruturados de leads, conversas e sistema para fornecer insights acionáveis em formato adequado para comunicação via WhatsApp.

## Funcionamento
O código implementa três tipos principais de relatório:

1. **Relatório de Performance:** Analisa geração de leads por período (diário, semanal, mensal) e origens.

2. **Análise Diária:** Avalia saúde do sistema através de logs de erro e perfil de clientes baseado em tags e scores.

3. **Relatório de Funil:** Acompanha distribuição de contatos por etapas do funil de vendas em diferentes períodos.

## Entrada de Informações
- **clientePath (string):** Caminho do diretório do cliente para localizar dados.
- **periodo ('diario' | 'semanal' | 'mensal'):** Período temporal para análise.

## Processamento de Informações
1. **Carregamento de Dados:** Lê arquivos JSON de leads, conversas e logs estruturados.

2. **Filtragem Temporal:** Aplica filtros baseados no período solicitado.

3. **Agregação Estatística:** Conta ocorrências, calcula médias e distribuições.

4. **Formatação WhatsApp:** Estrutura dados em mensagens formatadas com emojis e quebras de linha.

5. **Tratamento de Erros:** Fornece fallbacks quando dados estão ausentes ou corrompidos.

## Saída de Informações
- **gerarRelatorioPerformance:** String formatada com estatísticas de leads por origem.
- **gerarAnaliseDiaria:** Relatório de saúde do sistema e perfil de clientes.
- **gerarRelatorioFunil:** Distribuição de contatos por etapa do funil.
- **formatarRelatorioParaEnvio:** Função utilitária para formatação JSON (não utilizada).

## Dependências
- **fs (node:fs/promises):** Operações assíncronas de arquivo.
- **logger:** Sistema de logging centralizado.

## Exemplo de Uso
```typescript
import { gerarRelatorioPerformance, gerarAnaliseDiaria, gerarRelatorioFunil } from './geradorRelatorios';

// Gerar relatório de performance semanal
const relatorioPerf = await gerarRelatorioPerformance("/caminho/cliente", "semanal");

// Gerar análise diária
const analiseDiaria = await gerarAnaliseDiaria("/caminho/cliente");

// Gerar relatório de funil mensal
const relatorioFunil = await gerarRelatorioFunil("/caminho/cliente", "mensal");

// Resultados são strings formatadas para envio via WhatsApp
```

## Notas Adicionais
- **Estrutura Hierárquica:** Espera dados de leads organizados por ano/mês/dia.
- **Robustez:** Trata ausência de dados com mensagens informativas.
- **Integração Automática:** Chamado pelo sistema de agendamento de relatórios.
- **Performance:** Processa grandes volumes de dados eficientemente.
- **Flexibilidade:** Adapta-se a diferentes estruturas de dados existentes.
- **Monitoramento:** Inclui análise de saúde baseada em logs de erro.