# Nome do Arquivo: followup/gerarMensagemFollowUp.ts
**Caminho Relativo:** src/backend/followup/gerarMensagemFollowUp.ts

## Propósito
Este arquivo implementa a geração automatizada de mensagens de follow-up usando inteligência artificial, criando conteúdo personalizado baseado no histórico conversacional e nível de follow-up. Ele integra prompts configuráveis por cliente e nível, garantindo mensagens contextualizadas e eficazes para reengajar leads.

## Funcionamento
O código executa um processo de geração de mensagens em três etapas principais:

1. **Carregamento de Configuração:** Obtém configurações específicas do cliente para follow-up.

2. **Seleção de Prompt:** Escolhe entre prompt geral ou específico do nível atual.

3. **Geração IA:** Envia prompt contextualizado para o serviço Google BG e processa resposta.

## Entrada de Informações
- **clienteId (string):** Identificador do cliente para carregar configurações específicas.
- **chatId (string):** ID do chat para contextualização e logs.
- **level (number):** Nível atual do follow-up (1, 2, 3, etc.).
- **conversationHistory (string):** Histórico completo da conversa para contextualização.

## Processamento de Informações
1. **Resolução de Caminho:** Converte clienteId em caminho do sistema de arquivos.

2. **Validação de Configuração:** Verifica se follow-up está ativo para o cliente.

3. **Seleção Estratégica de Prompt:**
   - Usa prompt geral se configurado ou se prompt específico não existe
   - Seleciona prompt específico do nível atual quando disponível

4. **Construção de Contexto:** Combina prompt base com histórico conversacional.

5. **Chamada IA:** Envia prompt completo para Google BG com histórico limpo.

6. **Processamento de Resposta:** Remove espaços extras e retorna mensagem final.

## Saída de Informações
- **Retorno da Função:** String com mensagem gerada ou null em caso de erro.
- **Logs do Console:** Informações detalhadas sobre processo de geração e resultados.

## Dependências
- **getFollowUpConfig:** Função para obter configurações de follow-up do cliente.
- **mainGoogleBG:** Serviço Google BG para processamento de prompts IA.
- **getPasta:** Utilitário para resolver caminhos de cliente.

## Exemplo de Uso
```typescript
import { gerarMensagemFollowUp } from './gerarMensagemFollowUp';

// Gerar mensagem de follow-up nível 2
const mensagem = await gerarMensagemFollowUp(
  "cliente123", // ID do cliente
  "5511999999999@c.us", // Chat ID
  2, // Nível do follow-up
  "Cliente: Gostei do apartamento\nAtendente: Ótimo, posso agendar visita?" // Histórico
);

// Resultado: Mensagem personalizada como:
// "Olá! Passando para saber se você ainda está interessado no apartamento que conversamos..."
```

## Notas Adicionais
- **Flexibilidade de Configuração:** Suporte a prompts gerais e específicos por nível.
- **Contexto Inteligente:** Incorpora histórico conversacional completo na geração.
- **Tratamento de Erros:** Retorna null com logs detalhados em caso de falha.
- **Integração Modular:** Fácil integração com sistema de disparo de follow-up.
- **Limpeza Automática:** Remove espaços desnecessários das respostas IA.
- **Validação Robusta:** Verifica existência e validade de configurações antes do processamento.