# Nome do Arquivo: analiseConversa/precisaAtendimento.ts
**Caminho Relativo:** src/backend/analiseConversa/precisaAtendimento.ts

## Propósito
Este arquivo implementa um sistema de detecção automática de necessidade de atendimento humano em conversas de chat. Ele utiliza inteligência artificial para analisar conversas e determinar quando um cliente requer intervenção manual de um atendente, gerando notificações automáticas com resumos concisos das conversas.

## Funcionamento
O código executa um fluxo de análise e notificação em três etapas principais:

1. **Análise de Necessidade:** Utiliza IA para determinar se a conversa requer atendimento humano baseado em prompts específicos.

2. **Geração de Resumo:** Quando atendimento humano é necessário, cria um resumo conciso da conversa (máximo 200 caracteres).

3. **Notificação Automática:** Compila informações do cliente (nome, telefone, origem) e envia mensagem formatada para o chat de destino configurado.

## Entrada de Informações
- **chatId (string):** Identificador único do chat sendo analisado.
- **historicoConversa (string):** Texto completo do histórico da conversa a ser analisado.
- **client (any):** Instância do cliente WhatsApp para envio de notificações.
- **clientePath (string):** Caminho do diretório do cliente contendo arquivos de configuração.

## Processamento de Informações
1. **Carregamento de Configuração:** Lê arquivo `infoCliente.json` para obter `TARGET_CHAT_ID` (destino das notificações).

2. **Análise IA:** Envia prompt para o serviço Google BG perguntando se precisa atendimento humano, esperando resposta "sim" ou "não".

3. **Geração de Resumo:** Se resposta for "sim", solicita resumo conciso da conversa com limite de 200 caracteres.

4. **Coleta de Dados do Cliente:** Busca informações adicionais em `Dados.json` e `leads.json` para enriquecer a notificação.

5. **Formatação da Mensagem:** Compila informações em mensagem formatada com nome, telefone, origem e resumo.

## Saída de Informações
- **Notificação WhatsApp:** Mensagem formatada enviada para `TARGET_CHAT_ID` contendo:
  - Identificação do cliente (nome simples)
  - Nome completo do lead
  - Número de telefone
  - Lista de origem (se disponível)
  - Resumo da conversa gerado por IA
- **Logs do Console:** Registra operações realizadas, incluindo envio de notificações ou ausência de necessidade de atendimento.

## Dependências
- **mainGoogleBG:** Função de serviço Google BG importada para processamento de IA.
- **fs (node:fs/promises):** Módulo para leitura assíncrona de arquivos.
- **path:** Módulo para manipulação de caminhos de arquivo.

## Exemplo de Uso
```typescript
import { precisaAtendimento } from './precisaAtendimento';

// Analisar se conversa precisa de atendimento humano
await precisaAtendimento(
  "5511999999999@c.us", // chatId
  "Cliente: Preciso de ajuda urgente com meu pedido\nAtendente: Claro, como posso ajudar?", // histórico
  clienteWhatsApp, // instância do cliente WhatsApp
  "/caminho/do/cliente" // caminho das configurações
);

// Resultado: Se IA detectar necessidade, envia notificação automática
// para o TARGET_CHAT_ID configurado com resumo da conversa
```

## Notas Adicionais
- **Limite de Resumo:** Resumos são limitados a 200 caracteres para manter notificações concisas.
- **Fallback de Dados:** Sistema robusto com fallbacks para casos onde dados do cliente não estão disponíveis.
- **Configuração Obrigatória:** Requer `TARGET_CHAT_ID` configurado no `infoCliente.json` para funcionar.
- **Integração WhatsApp:** Depende de cliente WhatsApp válido para envio de notificações.
- **Tratamento de Erros:** Captura e registra erros sem interromper o fluxo principal.
- **Eficiência:** Só gera resumo quando necessário, economizando recursos de IA.