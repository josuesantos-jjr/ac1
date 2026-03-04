# Nome do Arquivo: followup/sistemaFollowupCorrigido.ts
**Caminho Relativo:** src/backend/followup/sistemaFollowupCorrigido.ts

## Propósito
Este arquivo implementa um sistema corrigido de follow-up que resolve problemas de duplicação, integra com agendamentos e fornece controle mais inteligente sobre quando e como executar follow-ups automáticos. Ele corrige inconsistências nos dados e garante que follow-ups sejam executados apenas quando apropriado, considerando agendamentos ativos e regras de negócio.

## Funcionamento
O código executa múltiplas funções corretivas e de controle:

1. **Correção de Duplicatas:** Remove entradas duplicadas em followups.json, mantendo apenas o nível mais alto.

2. **Controle de Adição:** Adiciona ou atualiza follow-ups apenas quando necessário, evitando sobrecarga.

3. **Verificação Inteligente:** Avalia se deve iniciar follow-up considerando agendamentos ativos.

4. **Integração com Agendamentos:** Pausa follow-ups durante agendamentos ativos e reinicia após expiração.

5. **Geração Personalizada:** Cria mensagens usando prompts corretos com contexto completo do lead.

## Entrada de Informações
- **clientePath (string):** Caminho do diretório do cliente.
- **chatId (string):** Identificador único do chat.
- **nivel (number):** Nível de follow-up (opcional).
- **clienteId (string):** ID do cliente.
- **conversationHistory (string):** Histórico da conversa.
- **dadosLead (any):** Dados do lead para contexto.

## Processamento de Informações
1. **Correção de Dados:** Remove duplicatas mantendo maior nível de follow-up por chat.

2. **Validação de Estado:** Verifica existência de agendamentos antes de iniciar follow-up.

3. **Controle Temporal:** Avalia expiração de agendamentos para reiniciar follow-ups.

4. **Geração Contextual:** Constrói prompts com dados completos do lead e histórico.

5. **Persistência Segura:** Salva mensagens no histórico e atualiza níveis de forma transacional.

## Saída de Informações
- **Arquivos Corrigidos:** followups.json sem duplicatas.
- **Mensagens Históricas:** Novas entradas no histórico de conversas.
- **Dados Atualizados:** Níveis de follow-up incrementados.
- **Logs Detalhados:** Informações sobre correções e decisões tomadas.

## Dependências
- **gerarMensagemFollowUp:** Geração de mensagens via IA.
- **getFollowUpConfig:** Carregamento de configurações.
- **mainGoogleBG:** Serviço de IA Google BG.
- **logger:** Sistema de logging.
- **fs (node:fs/promises e node:fs):** Operações de arquivo.

## Exemplo de Uso
```typescript
import { corrigirDuplicacaoFollowup, verificarInicioFollowup } from './sistemaFollowupCorrigido';

// Corrigir duplicatas no sistema
await corrigirDuplicacaoFollowup("/caminho/do/cliente");

// Verificar se deve iniciar follow-up
const deveIniciar = await verificarInicioFollowup(
  "/caminho/do/cliente",
  "5511999999999@c.us",
  dadosLead
);

// Gerar e enviar follow-up personalizado
await enviarFollowupPersonalizado(
  "/caminho/do/cliente",
  "cliente123",
  "5511999999999@c.us",
  2,
  "Histórico da conversa..."
);
```

## Notas Adicionais
- **Correção de Bugs:** Resolve problemas de duplicação identificados na versão anterior.
- **Integração Inteligente:** Considera agendamentos para pausar/reiniciar follow-ups automaticamente.
- **Contexto Completo:** Incorpora dados do lead e histórico na geração de mensagens.
- **Controle Transacional:** Atualizações seguras para evitar inconsistências.
- **Flexibilidade:** Suporte a prompts gerais e específicos por nível.
- **Robustez:** Tratamento abrangente de erros e validações.