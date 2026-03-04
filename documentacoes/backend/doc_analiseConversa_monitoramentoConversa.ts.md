# Nome do Arquivo: analiseConversa/monitoramentoConversa.ts
**Caminho Relativo:** src/backend/analiseConversa/monitoramentoConversa.ts

## Propósito
Este arquivo implementa um sistema completo de monitoramento de conversas para análise automática de leads e detecção de agendamentos. Ele integra múltiplas funcionalidades de IA para processar históricos de chat, identificar intenções, qualificar leads e gerenciar agendamentos, automatizando processos de CRM (Customer Relationship Management) em tempo real.

## Funcionamento
O código executa uma sequência abrangente de operações de monitoramento:

1. **Carregamento de Dados:** Lê o histórico de conversa do chat específico e configurações do cliente (chave Gemini).

2. **Análise de Intenção:** Utiliza IA para determinar a intenção principal da conversa (apenas para logging).

3. **Detecção de Agendamento:** Identifica datas e horários de agendamentos mencionados na conversa.

4. **Qualificação de Lead:** Executa análise completa do lead usando IA, incluindo pontuação, qualificação e identificação de necessidades de atendimento humano.

5. **Comparação de Estado:** Verifica se houve mudanças significativas nos dados do lead ou agendamentos.

6. **Persistência de Dados:** Salva informações atualizadas em arquivos JSON específicos do chat e no arquivo central de agendamentos.

7. **Notificações:** Registra eventos importantes como leads recém-qualificados ou necessidade de atendimento humano.

## Entrada de Informações
- **clientePath (string):** Caminho do diretório do cliente contendo configurações e dados.
- **chatId (string):** Identificador único do chat a ser monitorado.
- **listaNome (string | null):** Nome da lista associada ao chat (aparentemente não utilizado na implementação atual).
- **client (any):** Instância do cliente WhatsApp para notificações e interações.

## Processamento de Informações
1. **Carregamento do Histórico:** Lê arquivo JSON do chat e converte mensagens em formato textual concatenado.

2. **Carregamento de Configurações:** Extrai chave da API Gemini do arquivo de configuração do cliente.

3. **Análise de Intenção:** Chama função de análise para logging (não afeta fluxo principal).

4. **Detecção de Agendamento:** Identifica datas e horários usando IA especializada.

5. **Qualificação de Lead:** Executa análise completa incluindo nome, interesse, score, etapa do funil, etc.

6. **Verificação de Mudanças:** Compara dados atuais com anteriores para detectar leads recém-qualificados.

7. **Atualização de Dados:** Persiste informações em Dados.json do chat específico.

8. **Gestão de Agendamentos:** Salva agendamentos no arquivo central apenas se houver mudanças.

## Saída de Informações
- **Logs Detalhados:** Registra todas as operações principais no console, incluindo:
  - Início e conclusão do monitoramento
  - Intenção detectada
  - Resultados da qualificação de lead
  - Detecção de agendamentos
  - Status de notificações
- **Arquivos Atualizados:** Modifica dados persistentes em:
  - `Dados.json` do chat (informações do lead e agendamento)
  - `agendamentos.json` central (lista de agendamentos organizados por chatId)

## Dependências
- **analisarIntencao:** Função de análise de intenção importada localmente.
- **identificarAgendamento:** Função de detecção de agendamentos importada localmente.
- **qualificarLead:** Função completa de qualificação de leads importada localmente.
- **fs (node:fs/promises e node:fs):** Módulos do Node.js para operações de arquivo assíncronas e síncronas.
- **path:** Módulo do Node.js para manipulação de caminhos de arquivo.

## Exemplo de Uso
```typescript
import { monitorarConversa } from './monitoramentoConversa';

// Monitorar conversa específica
await monitorarConversa(
  "/caminho/do/cliente",
  "chat123456",
  "Lista Principal",
  clienteWhatsApp // Instância do cliente WhatsApp
);

// O sistema irá automaticamente:
// - Carregar histórico do chat
// - Analisar intenção da conversa
// - Detectar agendamentos
// - Qualificar o lead
// - Salvar dados atualizados
// - Registrar logs detalhados
```

## Notas Adicionais
- **Integração Completa:** Combina múltiplos módulos de análise em um fluxo coeso de monitoramento.
- **Tratamento de Erros:** Implementa try-catch abrangente com logging detalhado para facilitar depuração.
- **Otimização:** Evita salvamentos desnecessários comparando estados antes de persistir dados.
- **Notificações Inteligentes:** Detecta leads recém-qualificados e necessidade de atendimento humano.
- **Persistência Robusta:** Mantém dados em múltiplos arquivos para redundância e organização.
- **Performance:** Carrega arquivos sob demanda e processa conversas individualmente para escalabilidade.
- **Limitações:** Depende da qualidade dos arquivos de configuração e histórico; falhas em leitura podem abortar o monitoramento.