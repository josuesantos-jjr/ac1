# Nome do Arquivo: disparo/disparoAgendados.ts
**Caminho Relativo:** src/backend/disparo/disparoAgendados.ts

## Propósito
Este arquivo implementa um sistema automatizado completo para gerenciamento de agendamentos e lembretes, incluindo geração automática de leads, monitoramento horário de compromissos e envio de notificações personalizadas. O sistema garante que nenhum agendamento seja perdido, enviando lembretes estratégicos tanto para clientes quanto para equipe de vendas, utilizando IA para personalizar mensagens e gerar resumos conversacionais.

## Funcionamento
O código executa múltiplas funcionalidades em sequência:

1. **Monitoramento Horário:** Inicia sistema de verificação contínua a cada hora para detectar agendamentos pendentes.

2. **Verificação de Lembretes:** Analisa agendamentos diários, identificando aqueles que precisam de lembretes (1 hora antes e no horário exato).

3. **Geração Automática de Leads:** Quando detecta agendamento, automaticamente converte o contato em lead qualificado.

4. **Envio de Lembretes Personalizados:** Utiliza histórico conversacional e IA para criar mensagens contextualizadas.

5. **Notificações para Equipe:** Envia alertas detalhados com resumos da conversa para proprietários/equipe de vendas.

6. **Controle de Estado:** Mantém registro preciso de notificações enviadas para evitar duplicatas.

7. **Integração com IA:** Gera resumos inteligentes da conversa usando Google Gemini.

## Entrada de Informações
- **client (any):** Instância do cliente WhatsApp para envio de mensagens.
- **clientePath (string):** Caminho do diretório do cliente contendo configurações e dados.

## Processamento de Informações
1. **Carregamento de Agendamentos:** Lê arquivo `agendamentos.json` com estrutura completa de compromissos.

2. **Filtragem Temporal:** Identifica agendamentos do dia atual e calcula horários de lembrete.

3. **Análise de Histórico:** Busca dados do cliente e histórico conversacional para personalização.

4. **Geração de Conteúdo IA:** Cria mensagens personalizadas e resumos usando IA integrada.

5. **Validação de Estado:** Verifica se lembretes já foram enviados para evitar duplicatas.

6. **Criação de Leads:** Gera automaticamente leads qualificados quando agendamento é detectado.

7. **Envio Multimídia:** Suporte para mensagens de texto e futuras expansões para mídia.

## Saída de Informações
- **Mensagens WhatsApp para Clientes:** Lembretes personalizados no horário adequado.
- **Notificações para Equipe:** Alertas detalhados com informações completas do lead e resumo conversacional.
- **Leads Automaticamente Gerados:** Conversão automática de contatos em leads qualificados.
- **Arquivos Atualizados:** Modificação de `agendamentos.json` com status de notificações e dados de leads.
- **Logs Detalhados:** Registro completo de operações, envios e geração de leads.
- **Resumos IA:** Análises inteligentes da conversa para contextualizar agendamentos.

## Dependências
- **mainGoogleAG:** Serviço Google AG para processamento de mensagens IA.
- **processTriggers:** Sistema de gatilhos para automação de respostas.
- **updateLastSentMessageDate:** Utilitário para atualização de timestamps de mensagens.
- **fs (node:fs/promises):** Operações assíncronas de arquivo.
- **path:** Manipulação de caminhos de arquivo.

## Exemplo de Uso
```typescript
import { iniciarMonitoramentoHorario, disparoAgendados } from './disparoAgendados';

// Iniciar monitoramento contínuo (recomendado)
await iniciarMonitoramentoHorario(clienteWhatsApp, "/caminho/do/cliente");

// Ou usar sistema antigo de disparo imediato
await disparoAgendados(clienteWhatsApp, "/caminho/do/cliente");

// Sistema irá automaticamente:
// - Verificar agendamentos a cada hora
// - Gerar leads automaticamente
// - Enviar lembretes personalizados
// - Notificar equipe com resumos
// - Evitar duplicatas de notificações
```

## Notas Adicionais
- **Sistema Robusto:** Monitoramento horário sobrevive a reinicializações do sistema.
- **IA Integrada:** Geração automática de resumos e mensagens personalizadas.
- **Geração Automática de Leads:** Conversão inteligente de agendamentos em oportunidades.
- **Controle de Duplicatas:** Sistema preciso de verificação de notificações já enviadas.
- **Notificações Hierárquicas:** Lembretes escalonados (1h antes + horário exato).
- **Personalização Inteligente:** Análise de histórico para contextualizar mensagens.
- **Escalabilidade:** Suporte para múltiplos agendamentos por cliente.
- **Integração Completa:** Vinculado automaticamente ao sistema principal de disparo.