# Nome do Arquivo: relatorio/registroDisparo.ts
**Caminho Relativo:** src/backend/relatorio/registroDisparo.ts

## Propósito
Este arquivo implementa um sistema robusto de registro e armazenamento de disparos de mensagens, organizando dados de forma hierárquica (ano/mês/dia) para facilitar consultas e geração de relatórios. Ele registra tanto disparos iniciais quanto follow-ups, mantendo estatísticas detalhadas sobre performance de campanhas de marketing.

## Funcionamento
O código organiza dados em estrutura hierárquica persistente:

1. **Registro Estruturado:** Salva disparos em `config/relatorios/disparos.json` organizado por ano/mês/dia.

2. **Busca Inteligente:** Permite consultas por intervalos de datas específicos.

3. **Estatísticas Automáticas:** Gera métricas de sucesso, falha e atividade geral.

4. **Rastreamento de Conversas:** Identifica chats ativos baseado em atividade recente.

5. **Análise de Funil:** Coleta estatísticas sobre distribuição de leads por etapa.

6. **Integração Follow-up:** Registra mensagens de acompanhamento separadamente.

## Entrada de Informações
- **clientePath (string):** Caminho do diretório do cliente.
- **registro (DisparoRegistro):** Dados do disparo incluindo data, telefone, status, etc.
- **dataInicio/dataFim (string opcional):** Intervalos para consultas.

## Processamento de Informações
1. **Estruturação Temporal:** Converte datas em hierarquia ano/mês/dia.

2. **Criação de Diretórios:** Garante existência de estrutura de pastas automaticamente.

3. **Merging de Dados:** Adiciona novos registros à estrutura existente.

4. **Filtragem por Data:** Aplica filtros de intervalo quando especificados.

5. **Agregação Estatística:** Calcula médias e contadores baseados nos registros.

6. **Validação de Atividade:** Verifica timestamps para determinar conversas ativas.

## Saída de Informações
- **Arquivo disparos.json:** Estrutura hierárquica organizada por data.
- **Array de Registros:** Lista filtrada de disparos por período.
- **Objeto Estatísticas:** Métricas calculadas (sucesso, falha, médias).
- **Contador de Conversas:** Número de chats ativos recentemente.
- **Estatísticas de Funil:** Distribuição por etapas do processo de vendas.

## Dependências
- **fs (node:fs/promises e node:fs):** Operações de arquivo síncronas e assíncronas.
- **date-fns:** Formatação e manipulação de datas.
- **logger:** Sistema de logging centralizado.

## Exemplo de Uso
```typescript
import { registrarDisparo, buscarRelatorios, gerarEstatisticas } from './registroDisparo';

// Registrar um disparo
await registrarDisparo("/caminho/cliente", {
  data: new Date().toISOString(),
  numeroTelefone: "11999999999",
  status: true,
  etapaAquecimento: 5,
  quantidadeDisparada: 1,
  limiteDiario: 50,
  tipo: "disparo_inicial",
  listaNome: "Lista VIP"
});

// Buscar relatórios de um período
const registros = buscarRelatorios("/caminho/cliente", "2025-01-01", "2025-01-31");

// Gerar estatísticas
const stats = gerarEstatisticas(registros);
// Resultado: { totalDisparos: 150, disparosSucesso: 120, ... }
```

## Notas Adicionais
- **Estrutura Hierárquica:** Facilita consultas eficientes e organização temporal.
- **Robustez:** Cria estrutura automaticamente e trata erros gracefully.
- **Flexibilidade:** Suporte a diferentes tipos de disparo (inicial, follow-up).
- **Performance:** Estrutura otimizada para grandes volumes de dados.
- **Integração:** Funciona como base para todos os sistemas de relatório.
- **Escalabilidade:** Estrutura preparada para crescimento temporal indefinido.