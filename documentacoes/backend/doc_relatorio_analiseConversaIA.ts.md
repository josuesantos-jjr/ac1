# Nome do Arquivo: relatorio/analiseConversaIA.ts
**Caminho Relativo:** src/backend/relatorio/analiseConversaIA.ts

## Propósito
Este arquivo implementa um sistema de análise inteligente de conversas para geração de relatórios, utilizando dados estruturados já existentes nos arquivos Dados.json dos chats. Ele gera resumos executivos e distribuições por etapa do funil de vendas, fornecendo insights sobre o progresso das conversas sem necessidade de processamento adicional de IA em tempo real.

## Funcionamento
O código executa uma análise abrangente baseada em dados persistidos:

1. **Varredura de Diretórios:** Percorre todos os chats no histórico do cliente.

2. **Filtragem Inteligente:** Seleciona apenas conversas com etapas de funil definidas.

3. **Extração de Dados:** Coleta informações estruturadas (nome, telefone, etapa, tags, origem).

4. **Agregação Estatística:** Conta distribuição de conversas por etapa do funil.

5. **Geração de Relatório:** Cria resumo executivo com métricas e distribuições.

## Entrada de Informações
- **clientePath (string):** Caminho do diretório do cliente.
- **dataRelatorio (Date):** Data para a qual gerar o relatório de conversas.

## Processamento de Informações
1. **Listagem de Chats:** Varre pasta Historico para encontrar todos os diretórios de chat.

2. **Validação de Dados:** Verifica existência de Dados.json e presença de etapaFunil.

3. **Extração Estruturada:** Coleta informações padronizadas de cada conversa válida.

4. **Contagem Estatística:** Agrupa conversas por etapa do funil.

5. **Formatação de Resumo:** Gera relatório com métricas totais e distribuição detalhada.

## Saída de Informações
- **Retorno da Função:** Objeto AnaliseResultado com:
  - resumoGeral: Relatório executivo formatado
  - resumosIndividuais: Array com detalhes de cada conversa
- **Logs Detalhados:** Informações sobre processamento e estatísticas encontradas.

## Dependências
- **fs (node:fs/promises):** Operações assíncronas de arquivo.
- **logger:** Sistema de logging com categoria específica.

## Exemplo de Uso
```typescript
import { analisarConversasDoDia } from './analiseConversaIA';

// Gerar análise de conversas do dia
const analise = await analisarConversasDoDia(
  "/caminho/do/cliente",
  new Date()
);

// Resultado:
// {
//   resumoGeral: "📊 RELATÓRIO DE CONVERSAS - 10/11/2025...",
//   resumosIndividuais: [
//     {
//       chatId: "5511999999999@c.us",
//       resumo: "📞 João Silva (11999999999)...",
//       etapaFunil: "Qualificação"
//     }
//   ]
// }
```

## Notas Adicionais
- **Eficiência:** Utiliza dados já processados, evitando reanálise custosa.
- **Confiabilidade:** Baseia-se em informações estruturadas e validadas.
- **Flexibilidade:** Adapta-se a diferentes estruturas de dados existentes.
- **Escalabilidade:** Processa milhares de conversas eficientemente.
- **Robustez:** Trata erros gracefully, continuando processamento mesmo com dados corrompidos.
- **Insights Automáticos:** Fornece distribuição estatística por etapa do funil.