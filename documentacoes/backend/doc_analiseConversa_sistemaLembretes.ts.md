# Nome do Arquivo: analiseConversa/sistemaLembretes.ts
**Caminho Relativo:** src/backend/analiseConversa/sistemaLembretes.ts

## Propósito
Este arquivo implementa um sistema automatizado de lembretes para agendamentos, verificando diariamente todos os compromissos marcados e enviando notificações personalizadas tanto para os clientes quanto para a equipe interna de vendas. O sistema utiliza inteligência artificial para gerar mensagens contextualizadas e personalizadas baseadas no perfil do lead.

## Funcionamento
O código executa um processo diário de verificação e envio de lembretes:

1. **Carregamento de Agendamentos:** Lê arquivo `agendamentos.json` com todos os compromissos registrados.

2. **Filtragem por Data:** Identifica apenas agendamentos marcados para o dia atual usando biblioteca date-fns.

3. **Processamento Individual:** Para cada agendamento do dia, gera lembretes personalizados.

4. **Geração IA:** Utiliza Google Gemini para criar mensagens contextualizadas baseadas no histórico do lead.

5. **Envio Dual:** Prepara lembretes tanto para o cliente (via chatId) quanto para equipe interna (TARGET_CHAT_ID).

6. **Marcação de Status:** Atualiza registros para evitar envios duplicados no mesmo dia.

## Entrada de Informações
- **clientePath (string):** Caminho do diretório do cliente contendo configurações e dados.
- **clienteId (string):** Identificador único do cliente para logging e organização.

## Processamento de Informações
1. **Verificação Diária:** Carrega lista completa de agendamentos e filtra por data atual.

2. **Validação de Dados:** Verifica integridade dos dados de agendamento (data, horário, tipo).

3. **Carregamento de Contexto:** Busca dados do lead (nome, interesse, histórico recente) para personalização.

4. **Geração de Mensagens:** Cria dois tipos de lembretes via IA:
   - Para cliente: Mensagem amigável e pessoal
   - Para equipe: Notificação estruturada com dados completos e insights

5. **Personalização Inteligente:** Incorpora nome do cliente, interesse específico, e contexto conversacional.

6. **Prevenção de Spam:** Verifica se lembretes já foram enviados no dia atual.

## Saída de Informações
- **Logs Detalhados:** Registra processamento de cada agendamento, mensagens geradas e status de notificações.
- **Arquivos Atualizados:** Modifica `agendamentos.json` marcando notificações como enviadas.
- **Mensagens Preparadas:** Gera conteúdo completo dos lembretes (atualmente logado, pronto para integração com WhatsApp).

## Dependências
- **date-fns:** Biblioteca para manipulação e comparação de datas (format, isSameDay, parseISO).
- **mainGoogleBG:** Serviço Google BG para geração de mensagens via IA.
- **fs (node:fs/promises):** Operações assíncronas de arquivo.
- **path:** Manipulação de caminhos de arquivo.
- **logger:** Sistema centralizado de logging.

## Exemplo de Uso
```typescript
import { verificarEEnviarLembretes } from './sistemaLembretes';

// Executar diariamente para verificar lembretes
await verificarEEnviarLembretes(
  "/caminho/do/cliente",
  "cliente123"
);

// Sistema irá automaticamente:
// - Carregar agendamentos do dia
// - Gerar lembretes personalizados via IA
// - Preparar mensagens para cliente e equipe
// - Registrar logs detalhados
// - Marcar agendamentos como notificados
```

## Notas Adicionais
- **Integração Pendente:** Código preparado para envio WhatsApp (TODO comentado), atualmente apenas gera e loga mensagens.
- **Personalização Avançada:** Usa histórico conversacional recente para contextualizar lembretes.
- **Prevenção de Duplicatas:** Sistema robusto para evitar múltiplos lembretes no mesmo dia.
- **Insights Automáticos:** Gera recomendações baseadas no perfil do lead para equipe interna.
- **Escalabilidade:** Processa múltiplos agendamentos eficientemente em lote diário.
- **Robustez:** Trata erros gracefully mantendo processamento de outros agendamentos.
- **Configuração Flexível:** Adapta mensagens baseado em TARGET_CHAT_ID configurado.