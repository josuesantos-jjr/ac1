# Nome do Arquivo: followup/disparoFollowup.ts
**Caminho Relativo:** src/backend/followup/disparoFollowup.ts

## Propósito
Este arquivo implementa o sistema automatizado de disparo de mensagens de follow-up, gerenciando campanhas de reengajamento de leads baseada em níveis configuráveis e intervalos temporais. O sistema verifica horários permitidos, evita duplicatas, controla limites diários compartilhados e executa follow-ups sequenciais usando IA para personalização de mensagens.

## Funcionamento
O código executa um processo complexo de verificação e envio de follow-ups:

1. **Validação Inicial:** Verifica se follow-up está ativo e carrega configurações do cliente.

2. **Controle de Limites:** Verifica limites diários compartilhados entre disparos normais e follow-ups.

3. **Verificação Horária:** Confirma que está dentro dos dias e horários permitidos.

4. **Processamento Sequencial:** Itera sobre todos os follow-ups pendentes no arquivo followups.json.

5. **Avaliação Temporal:** Calcula se já passou tempo suficiente desde último contato para cada nível.

6. **Geração de Conteúdo:** Usa IA para criar mensagens personalizadas baseadas no histórico conversacional.

7. **Controle de Duplicatas:** Sistema inteligente previne envio de mensagens idênticas em sequência.

8. **Envio Seguro:** Divide mensagens longas e usa sistema robusto de envio com fallbacks.

9. **Atualização de Estado:** Incrementa níveis de follow-up e registra histórico completo.

## Entrada de Informações
- **client (any):** Instância do cliente WhatsApp para envio de mensagens.
- **clienteIdCompleto (string):** Identificador completo do cliente.
- **__dirname (string):** Caminho base do sistema.

## Processamento de Informações
1. **Carregamento de Dados:** Lê configurações de follow-up e lista de follow-ups pendentes.

2. **Filtragem por Interesse:** Remove automaticamente contatos com interesse negativo.

3. **Cálculo de Intervalos:** Determina se já passou tempo necessário baseado no nível atual.

4. **Validação de WID:** Verifica formato correto do ID do WhatsApp com sanitização automática.

5. **Geração IA:** Cria mensagens personalizadas usando histórico conversacional.

6. **Controle de Fluxo:** Divide mensagens longas e gerencia envio sequencial.

7. **Registro de Atividades:** Atualiza contadores, timestamps e níveis de follow-up.

## Saída de Informações
- **Mensagens WhatsApp:** Follow-ups personalizados enviados para contatos elegíveis.
- **Arquivos Atualizados:** Dados.json e followups.json com informações atualizadas.
- **Logs Detalhados:** Registro completo de decisões tomadas e operações realizadas.
- **Relatórios de Follow-up:** Registros no sistema de relatórios para auditoria.

## Dependências
- **date-fns:** Manipulação de datas e intervalos temporais.
- **gerarMensagemFollowUp:** Função de geração de mensagens via IA.
- **getFollowUpConfig:** Carregamento de configurações de follow-up.
- **fs (node:fs/promises e node:fs):** Operações de arquivo assíncronas e síncronas.
- **Módulos utilitários:** index.ts, analise.ts para funcionalidades complementares.

## Exemplo de Uso
```typescript
import { dispararFollowupsAgendados } from './disparoFollowup';

// Executar sistema de follow-up automatizado
await dispararFollowupsAgendados(
  clienteWhatsApp, // Instância do cliente WhatsApp
  "cliente123", // ID do cliente
  "/caminho/do/sistema" // Diretório base
);

// Sistema irá automaticamente:
// - Verificar follow-ups pendentes
// - Validar horários e limites
// - Gerar mensagens personalizadas via IA
// - Enviar follow-ups elegíveis
// - Atualizar níveis e registros
```

## Notas Adicionais
- **Sistema Robusto:** Controle completo de duplicatas e validação de integridade.
- **IA Integrada:** Geração automática de mensagens contextualizadas.
- **Controle de Qualidade:** Validação rigorosa de WIDs e sanitização automática.
- **Limites Inteligentes:** Compartilhamento de cotas entre diferentes tipos de disparo.
- **Escalabilidade:** Processamento sequencial eficiente de múltiplos follow-ups.
- **Auditoria Completa:** Logs detalhados para rastreamento de todas as operações.
- **Flexibilidade:** Suporte a múltiplos níveis e intervalos configuráveis.