# Nome do Arquivo: analiseConversa/qualificarLead.ts
**Caminho Relativo:** src/backend/analiseConversa/qualificarLead.ts

## Propósito
Este arquivo implementa um sistema completo de qualificação automática de leads usando inteligência artificial. Ele analisa conversas de chat para extrair informações sobre o cliente (nome, interesse, score de lead), determinar sua posição no funil de vendas, identificar agendamentos e decidir se requer atendimento humano. O sistema integra criação automática de registros de leads e notificações para equipes de vendas.

## Funcionamento
O código executa um fluxo complexo de qualificação em múltiplas etapas:

1. **Configuração e Validação:** Carrega configurações do cliente (chaves API, prompts IA, funil de vendas).

2. **Análise IA:** Utiliza Google Gemini para analisar conversas com contexto completo (objetivos, produtos, funil).

3. **Extração Estruturada:** Processa resposta JSON da IA contendo nome, interesse, score, etapa do funil, etc.

4. **Decisão de Atendimento Humano:** Aplica critérios inteligentes para detectar quando intervenção manual é necessária.

5. **Persistência de Dados:** Salva análise sempre (não apenas quando há mudanças) em arquivo Dados.json do chat.

6. **Integração com CRM:** Para leads qualificados, cria automaticamente registros em contatos.json e leads.json.

7. **Notificações Automáticas:** Envia alertas para equipe de vendas via WhatsApp quando leads são identificados.

8. **Fallback Robusto:** Mantém funcionamento básico mesmo quando IA não está disponível.

## Entrada de Informações
- **conversationHistory (string):** Histórico completo da conversa formatado.
- **infoConfig (any):** Objeto de configuração do cliente contendo GEMINI_KEY_BG, QUALIFY_LEAD_PROMPT, funil de vendas, etc.
- **clientePath (string):** Caminho do diretório do cliente para arquivos de configuração e dados.
- **chatId (string):** Identificador único do chat sendo analisado.
- **client (any - opcional):** Instância do cliente WhatsApp para notificações.

## Processamento de Informações
1. **Validação de Configuração:** Verifica presença de chave API e prompt de qualificação.

2. **Construção de Prompt:** Monta prompt completo com contexto do cliente (objetivos, funil, produtos/serviços).

3. **Análise IA:** Envia prompt para GoogleBG e processa resposta JSON estruturada.

4. **Validação de Resposta:** Garante que leadScore está entre 0-10 e outros campos são válidos.

5. **Análise de Necessidade Humana:** Aplica 5 critérios inteligentes para detectar necessidade de intervenção.

6. **Gestão de Estado:** Carrega dados atuais e mescla com nova análise, mantendo histórico.

7. **Integração CRM:** Para leads qualificados:
   - Cria/encontra contato em contatos.json
   - Verifica se lead já existe
   - Cria novo registro em leads.json
   - Envia notificação automática

8. **Persistência:** Salva sempre os dados atualizados, mantendo campos críticos.

## Saída de Informações
- **Retorno da Função:** Objeto AnaliseLead com campos estruturados ou null em caso de erro.
- **Arquivos Atualizados:**
  - `Dados.json` do chat (análise completa do lead)
  - `contatos.json` (registro de contato se novo lead)
  - `leads.json` (registro do lead qualificado)
- **Notificações WhatsApp:** Mensagem formatada para TARGET_CHAT_ID com detalhes do lead identificado.
- **Logs Detalhados:** Registra todas as operações, incluindo scores, etapas, decisões de qualificação e notificações.

## Dependências
- **@google/generative-ai:** Para integração com IA Gemini (não usado diretamente, via GoogleBG).
- **mainGoogleBG:** Serviço Google BG para processamento de prompts IA.
- **detectarMudancasSignificativas:** Função de comparação de mudanças.
- **fs (node:fs/promises e node:fs):** Operações de arquivo síncronas e assíncronas.
- **path:** Manipulação de caminhos de arquivo.
- **logger:** Sistema de logging centralizado.

## Exemplo de Uso
```typescript
import { qualificarLead } from './qualificarLead';

const resultado = await qualificarLead(
  "Cliente: Olá, quero comprar um apartamento\nAtendente: Claro, que tipo?",
  {
    GEMINI_KEY_BG: "chave-api",
    QUALIFY_LEAD_PROMPT: "Analise: {conversation_history}",
    GEMINI_PROMPT: [{ "Funil de vendas": "Acolhimento -> Qualificação" }]
  },
  "/caminho/cliente",
  "5511999999999@c.us",
  clienteWhatsApp // opcional
);

// Resultado: Análise completa do lead com possível criação automática
// de registro e notificação para equipe de vendas
```

## Notas Adicionais
- **Integração Completa:** Sistema end-to-end que vai da análise IA à notificação automática.
- **Buffer de Notificações:** Evita spam com intervalo mínimo de 15 minutos entre notificações de atendimento humano.
- **Fallback Inteligente:** Mantém operação básica sem IA, marcando leads como "analise-pendente".
- **Insights Personalizados:** Gera recomendações específicas baseadas no perfil do lead.
- **Validação Robusta:** Trata erros de parsing JSON e validação de campos críticos.
- **Performance:** Otimizado para análise em tempo real com cache de configurações.
- **Escalabilidade:** Arquitetura modular permite fácil extensão para novos campos de análise.