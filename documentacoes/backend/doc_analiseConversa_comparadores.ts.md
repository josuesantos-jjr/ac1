# Nome do Arquivo: analiseConversa/comparadores.ts
**Caminho Relativo:** src/backend/analiseConversa/comparadores.ts

## Propósito
Este arquivo contém funções utilitárias para comparar campos individuais de análises de leads (estrutura AnaliseLead) e detectar alterações significativas nos dados. Ele é utilizado em sistemas de CRM ou qualificação de leads para identificar quando houve mudanças importantes em informações como nome, interesse, pontuação do lead, etapa do funil, entre outros, evitando atualizações desnecessárias e otimizando o processamento de dados.

## Funcionamento
O código implementa várias funções de comparação específicas para cada campo da interface AnaliseLead, seguindo uma lógica de detecção de mudanças baseada em regras customizadas para cada tipo de dado:

1. **Comparação de Nome:** Verifica diferenças simples entre strings, ignorando maiúsculas/minúsculas e espaços extras.

2. **Comparação de Interesse:** Utiliza análise de similaridade de texto, considerando diferenças de tamanho (>50%) e percentual de caracteres diferentes (>30%) como mudanças significativas.

3. **Comparação de Lead Score:** Detecta mudanças quando a diferença absoluta é maior que 1 ponto.

4. **Comparação de Etapa do Funil:** Comparação direta de strings normalizadas.

5. **Comparação de Status de Qualificação:** Verificação simples de alteração booleana.

6. **Comparação de Detalhes de Agendamento:** Avalia mudanças em identificação, tipo, data e horário de agendamentos.

7. **Comparação de Resumo para Atendente:** Análise de similaridade baseada em palavras comuns (menos de 60% de similaridade indica mudança).

8. **Comparação de Necessidade de Atendimento Humano:** Verificação de mudança booleana.

9. **Comparação de Tags:** Verifica se os conjuntos de tags são idênticos, ignorando ordem e diferenças de capitalização.

10. **Função Principal:** `detectarMudancasSignificativas` combina todas as comparações individuais para determinar se houve qualquer alteração significativa entre dois objetos AnaliseLead.

## Entrada de Informações
Cada função de comparação recebe dois parâmetros correspondentes ao campo específico:
- **compararNome:** nomeAtual e nomeNovo (string | null)
- **compararInteresse:** interesseAtual e interesseNovo (string | null)
- **compararLeadScore:** scoreAtual e scoreNovo (number)
- **compararEtapaFunil:** etapaAtual e etapaNova (string | null)
- **compararIsLeadQualificado:** atual e novo (boolean)
- **compararDetalhesAgendamento:** atual e novo (array de objetos com detalhes de agendamento)
- **compararResumoParaAtendente:** resumoAtual e resumoNovo (string | null)
- **compararPrecisaAtendimentoHumano:** atual e novo (boolean)
- **compararTags:** tagsAtual e tagsNovo (string[])
- **detectarMudancasSignificativas:** atual (Partial<AnaliseLead>) e novo (AnaliseLead)

## Processamento de Informações
1. **Tratamento de Valores Nulos:** Todas as funções lidam adequadamente com valores null/undefined, considerando mudanças quando um campo passa de null para valor ou vice-versa.

2. **Normalização de Texto:** Campos de texto são normalizados (convertidos para minúsculo, removidos espaços extras) antes da comparação.

3. **Análise de Similaridade:** Para campos textuais complexos (interesse, resumo), implementa algoritmos simples de similaridade baseados em diferenças de tamanho, caracteres ou palavras.

4. **Comparação Estrutural:** Para arrays e objetos aninhados (tags, detalhes de agendamento), converte para estruturas comparáveis (Sets) ou compara campo a campo.

5. **Agregação de Resultados:** A função principal combina os resultados de todas as comparações usando operador OR, retornando true se qualquer campo mudou significativamente.

## Saída de Informações
- Todas as funções retornam **boolean**: true se houve mudança significativa, false caso contrário.
- Não há efeitos colaterais ou saídas para logs; as funções são puras e determinísticas.

## Dependências
- Nenhuma dependência externa; utiliza apenas recursos nativos do TypeScript/JavaScript (Set, Math, string methods).

## Exemplo de Uso
```typescript
import { detectarMudancasSignificativas, AnaliseLead } from './comparadores';

const leadAtual: Partial<AnaliseLead> = {
  nome: "João Silva",
  leadScore: 5,
  interesse: "Casa nova"
};

const leadNovo: AnaliseLead = {
  nome: "João Silva",
  interesse: "Apartamento novo",
  leadScore: 7,
  etapaFunil: "Qualificação",
  isLeadQualificado: true,
  detalhes_agendamento: [],
  resumoParaAtendente: "Cliente interessado em imóvel",
  precisaAtendimentoHumano: false,
  tags: ["imobiliaria", "cliente_potencial"]
};

const houveMudanca = detectarMudancasSignificativas(leadAtual, leadNovo);
console.log("Houve mudança significativa:", houveMudanca); // true (devido a diferença no score e interesse)
```

## Notas Adicionais
- **Thresholds Configuráveis:** Os limites para detecção de mudanças (30% caracteres diferentes, 1 ponto de score, etc.) são hardcoded; poderiam ser parametrizados para maior flexibilidade.
- **Performance:** Algoritmos de similaridade são simplificados e eficientes, adequados para uso em tempo real.
- **Sensibilidade:** As regras foram calibradas para serem sensíveis o suficiente para capturar mudanças relevantes, mas não excessivamente para evitar falsos positivos.
- **Extensibilidade:** A estrutura permite fácil adição de novos campos à interface AnaliseLead e criação de funções de comparação correspondentes.
- **Casos Limite:** Trata adequadamente arrays vazios, strings vazias e objetos parcialmente preenchidos.