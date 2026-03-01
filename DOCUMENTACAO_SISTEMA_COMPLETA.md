# 📋 DOCUMENTAÇÃO COMPLETA DO SISTEMA AC-PC

## 🤖 Visão Geral do Sistema

O **AC-PC** (Archer Chat PC) é um sistema avançado de automação para WhatsApp desenvolvido especificamente para a imobiliária **CMW**. O sistema utiliza Inteligência Artificial para automatizar o processo de vendas, desde o primeiro contato até o fechamento de negócios, com foco em qualificação de leads e agendamento de visitas.

### 🎯 Objetivo Principal
Automatizar o processo de prospecção e vendas de imóveis através do WhatsApp, utilizando IA para conduzir conversas naturais, qualificar leads automaticamente e agendar visitas ou ligações com corretores humanos.

### 🏗️ Arquitetura do Sistema

O sistema é construído com uma arquitetura **Full-Stack** moderna:

- **Frontend**: Next.js 14+ com React e TypeScript
- **Backend**: Node.js com TypeScript e APIs REST
- **Banco de Dados**: Sistema de arquivos JSON (sem banco de dados tradicional)
- **IA**: Google Gemini (principal), Groq (fallback) e OpenAI (alternativo)
- **Automação**: WPPConnect para integração WhatsApp
- **Monitoramento**: PM2 para gerenciamento de processos

## 🏢 Estrutura de Diretórios

```
AC-PC/
├── 📁 src/                           # Código fonte principal
│   ├── 📁 app/                       # Frontend Next.js
│   │   ├── 📁 api/                   # APIs REST
│   │   ├── 📁 components/            # Componentes React
│   │   ├── 📁 dashboard/             # Dashboard principal
│   │   └── 📁 pages/                 # Páginas da aplicação
│   ├── 📁 backend/                   # Backend e serviços
│   │   ├── 📁 analiseConversa/       # Análise de conversas
│   │   ├── 📁 disparo/               # Sistema de disparos
│   │   ├── 📁 followup/              # Sistema de follow-ups
│   │   ├── 📁 relatorio/             # Relatórios e análises
│   │   ├── 📁 service/               # Serviços de IA
│   │   └── 📁 util/                  # Utilitários
│   └── 📁 scripts/                   # Scripts de automação
├── 📁 clientes/                      # Dados dos clientes
│   ├── 📁 ativos/                   # Clientes em operação
│   ├── 📁 cancelados/               # Clientes desativados
│   └── 📁 modelos/                  # Templates de clientes
├── 📁 docs/                         # Documentação
└── 📁 dados/                        # Dados auxiliares
```

## 🚀 Funcionalidades Principais

### 1. 🤖 Sistema de IA Multi-Modelo

#### **Google Gemini (Principal)**
- **GoogleBG**: Para validação e análise de respostas
- **GoogleChat**: Para processamento de conversas em tempo real
- **Configuração**: Modelos `gemini-2.5-flash-lite` e `gemini-2.0-flash-lite`

#### **Groq (Fallback)**
- **Modelos**: `llama3-8b-8192`, `llama3-70b-8192`, `qwen/qwen3-32b`
- **Rate Limiting**: 30 RPM por modelo
- **Fallback automático**: Ativado em caso de rate limit do Gemini

#### **OpenAI (Alternativo)**
- **Assistants**: Sistema de assistentes personalizados
- **Configuração**: Chave e assistant ID obrigatórios

### 2. 📱 Integração WhatsApp

#### **WPPConnect**
- **Conexão**: QR Code para autenticação
- **Funcionalidades**:
  - Envio de mensagens de texto
  - Transcrição de áudio (PTT)
  - Envio de imagens, vídeos e documentos
  - Verificação de status de números

#### **Gestão de Conversas**
- **Histórico completo**: Armazenado em arquivos JSON
- **Estrutura**: `/Chats/Historico/{chatId}/{chatId}.json`
- **Dados do lead**: `/Chats/Historico/{chatId}/Dados.json`

### 3. 🎯 Sistema de Disparo

#### **Listas de Contatos**
- **Formato JSON**: Listas estruturadas com contatos
- **Campos obrigatórios**: nome, telefone, tags
- **Controle de status**: `disparo: "sim"/"não"/"falha_wpp"`

#### **Regras de Disparo**
```json
{
  "HORARIO_INICIAL": "06:00",
  "HORARIO_FINAL": "18:00",
  "DIA_INICIAL": "segunda",
  "DIA_FINAL": "sábado",
  "INTERVALO_DE": "50",
  "INTERVALO_ATE": "250",
  "QUANTIDADE_LIMITE": "100",
  "QUANTIDADE_SEQUENCIA": "8"
}
```

#### **Estratégias de Disparo**
- **todas_ativas**: Dispara para todas as listas ativas
- **selecionadas**: Dispara apenas para listas específicas
- **Aquecimento**: Sistema de aquecimento para novos números

### 4. 🔄 Sistema de Follow-up

#### **Configuração de Follow-ups**
- **Arquivo**: `config/followUpConfig.json`
- **Intervalos**: Dias entre cada follow-up
- **Níveis**: Sistema de níveis progressivos

#### **Disparo Automático**
- **Verificação**: A cada 60 minutos
- **Intervalos**: Baseado no nível do follow-up
- **Condições**: Respeita interesse e bloqueios

### 5. 📊 Sistema de Relatórios

#### **Relatórios Diários**
- **Análise de IA**: Conversas do dia anterior
- **Métricas**: Leads qualificados, agendamentos, conversões
- **Envio automático**: Via WhatsApp para administrador

#### **Relatórios de Listas**
- **Performance**: Por lista específica
- **Taxa de sucesso**: Conversão por lista
- **Insights**: Análise de padrões

### 6. 🛡️ Sistema de Segurança

#### **Rate Limiting**
- **Interno**: Controle por modelo de IA
- **Externo**: RateLimitManager para APIs
- **Fallback**: Troca automática de modelos

#### **Controle de Duplicação**
- **Cache**: 30 segundos para mensagens duplicadas
- **Limpeza automática**: A cada 5 minutos
- **Validação**: Antes de cada envio

#### **Bloqueios Inteligentes**
- **Detecção**: Leads ignorados pelo celular
- **Limpeza**: A cada 60 minutos
- **Respeito**: Não envia para números bloqueados

## 🎨 Interface de Administração

### **Dashboard Principal**
- **Gerenciamento de clientes**: Ativos, cancelados, modelos
- **Monitoramento em tempo real**: Status de processos PM2
- **Controle de sistema**: Start/Stop de clientes
- **Logs e relatórios**: Visualização de logs e relatórios

### **Componentes Principais**
- **PM2Panel**: Controle de processos do sistema
- **SystemMonitor**: Monitoramento de recursos
- **WhatsappStatus**: Status das conexões WhatsApp
- **BackupStatusHeader**: Status dos backups

## ⚙️ Configuração de Clientes

### **Estrutura por Cliente**
```
clientes/ativos/{cliente}/
├── 📁 config/                    # Configurações do cliente
│   ├── 📄 infoCliente.json       # Configurações principais
│   ├── 📄 regrasDisparo.json     # Regras de disparo
│   ├── 📄 followUpConfig.json    # Configuração de follow-ups
│   ├── 📄 followups.json         # Lista de follow-ups ativos
│   ├── 📁 listas/                # Listas de contatos
│   └── 📁 abordagens/            # Prompts personalizados
├── 📁 Chats/                     # Histórico de conversas
│   └── 📁 Historico/             # Conversas organizadas por chatId
└── 📁 relatorios/                # Relatórios gerados
```

### **Configuração Principal (infoCliente.json)**
```json
{
  "CLIENTE": "CMW",
  "AI_SELECTED": "GEMINI",
  "TARGET_CHAT_ID": "120363422191671112@g.us",
  "GEMINI_PROMPT": [...],
  "GROQ_KEY": "...",
  "GEMINI_KEY": "..."
}
```

## 📈 Sistema de Qualificação de Leads

### **Critérios de Qualificação**
1. **Informações básicas**: Nome do cliente
2. **Interesse específico**: Imóvel ou tipo de imóvel
3. **Dados de qualificação**: Cidade, renda familiar, FGTS
4. **Engajamento**: Respostas positivas e interesse demonstrado

### **Classificação de Leads**
- **Lead Score**: 0-10 baseado na qualificação
- **Etapas do Funil**: Acolhimento → Qualificação → Recomendação → Agendamento
- **Tags automáticas**: Baseadas no comportamento e respostas

### **Notificações de Leads Qualificados**
- **Envio automático**: Para o chat administrativo
- **Informações incluídas**: Nome, telefone, interesse, score, insights
- **Formatação**: WhatsApp com emojis e formatação

## 🔧 Funcionalidades Avançadas

### **1. Análise de Sentimentos**
- **Classificação automática**: Quente, morno, frio
- **Baseado em**: Respostas e engajamento do cliente
- **Atualização**: Em tempo real durante a conversa

### **2. Transcrição de Áudio**
- **Formato suportado**: PTT (Push-to-Talk) e arquivos de áudio
- **Transcrição automática**: Usando ferramentas de IA
- **Integração**: Resposta automática baseada na transcrição

### **3. Backup Automático**
- **Frequência**: Diária (horário configurável)
- **Compactação**: ZIP otimizado
- **Envio**: Automático via WhatsApp
- **Métricas**: Tamanho, taxa de compressão, duração

### **4. Sistema de Gatilhos**
- **Mídia automática**: Envio de imagens/vídeos baseado em palavras-chave
- **Configuração**: Por cliente em `config/gatilhos.json`
- **Execução**: Durante o processamento de respostas

## 🌐 APIs Disponíveis

### **Principais Endpoints**

#### **Gerenciamento de Clientes**
- `POST /api/listClientes` - Lista todos os clientes
- `POST /api/create-client` - Cria novo cliente
- `POST /api/save-client-config` - Salva configuração do cliente
- `POST /api/client-control` - Inicia/para clientes

#### **WhatsApp e Disparos**
- `POST /api/disparo-status` - Status dos disparos
- `GET /api/whatsapp-status` - Status das conexões WhatsApp
- `POST /api/listas/upload` - Upload de listas de contatos
- `POST /api/followup-config` - Configuração de follow-ups

#### **Relatórios e Monitoramento**
- `GET /api/relatorio` - Relatórios do sistema
- `GET /api/pm2-status` - Status dos processos PM2
- `GET /api/pm2-logs/{processo}` - Logs de processos específicos
- `GET /api/backup-status` - Status dos backups

#### **Sistema e Monitoramento**
- `GET /api/health` - Health check do sistema
- `GET /api/env-status` - Status das variáveis de ambiente
- `GET /api/system-monitor` - Monitoramento de recursos

## 📋 Fluxo de Funcionamento

### **1. Inicialização do Sistema**
1. **Carregamento de configuração**: `infoCliente.json` por cliente
2. **Inicialização WhatsApp**: Conexão via QR Code
3. **Carregamento de listas**: Listas de contatos ativas
4. **Agendamento de tarefas**: Relatórios, backups, follow-ups

### **2. Processamento de Mensagens**
1. **Recepção**: Nova mensagem do WhatsApp
2. **Buffer**: Agrupamento de mensagens (15-20 segundos)
3. **Análise**: Processamento com IA para qualificação
4. **Resposta**: Geração e envio de resposta
5. **Armazenamento**: Salvar histórico e atualizar dados do lead

### **3. Qualificação de Leads**
1. **Extração de dados**: Nome, interesse, informações básicas
2. **Score**: Cálculo de pontuação de qualificação
3. **Classificação**: Tags e etapa do funil
4. **Notificação**: Se qualificado, notifica administrador
5. **Follow-up**: Se necessário, agenda follow-up

### **4. Sistema de Disparo**
1. **Verificação de horário**: Respeita regras de disparo
2. **Seleção de listas**: Baseado na estratégia configurada
3. **Processamento**: Contato por contato com intervalo
4. **Controle de limite**: Respeita limite diário
5. **Relatório**: Gera relatório de performance

## 🔒 Medidas de Segurança

### **1. Rate Limiting**
- **Por modelo de IA**: Controle interno de uso
- **Por API**: RateLimitManager para APIs externas
- **Fallback automático**: Troca de modelos em caso de limite

### **2. Controle de Duplicação**
- **Cache temporal**: 30 segundos para mensagens idênticas
- **Limpeza automática**: A cada 5 minutos
- **Validação pré-envio**: Verificação antes de cada mensagem

### **3. Backup e Recuperação**
- **Backup diário**: Compactação e envio automático
- **Recuperação de estado**: Em caso de falha, retoma do último ponto
- **Logs detalhados**: Para auditoria e debugging

### **4. Validação de Dados**
- **Sanitização**: Limpeza de dados de entrada
- **Validação de formato**: Verificação de números WhatsApp
- **Tratamento de erros**: Graceful degradation

## 📊 Métricas e KPIs

### **Principais Métricas Rastreadas**
- **Taxa de resposta**: Percentual de leads que respondem
- **Taxa de qualificação**: Leads que se tornam qualificados
- **Taxa de conversão**: Leads que agendam visita/ligação
- **Performance de IA**: Tempo de resposta e taxa de sucesso
- **Uptime do sistema**: Disponibilidade dos serviços

### **Dashboards e Relatórios**
- **Relatório diário**: Performance do dia anterior
- **Relatório de listas**: Performance por lista específica
- **Relatório de leads**: Qualificação e conversão de leads
- **Relatório de sistema**: Status de saúde e performance

## 🚀 Deployment e Produção

### **Gerenciamento com PM2**
```bash
# Iniciar sistema
npm run start:production

# Verificar status
npm run pm2-status

# Ver logs
npm run logs

# Reiniciar
npm run restart
```

### **Configuração de Produção**
- **PM2**: 4 processos principais (cliente, next-app, ngrok, health-monitor)
- **Health checks**: Monitoramento automático de saúde
- **Auto-restart**: Recuperação automática de falhas
- **Logs separados**: Por processo para debugging

### **Monitoramento Contínuo**
- **Health endpoint**: `/api/health` para verificação
- **PM2 monitoring**: Status de processos em tempo real
- **WhatsApp status**: Conexões ativas e QR codes
- **Backup status**: Verificação de backups realizados

## 🔄 Sistema de Atualizações

### **Funcionalidades Implementadas**
✅ Sistema de IA com fallback múltiplo
✅ Disparo de mensagens com controle de horário
✅ Follow-ups automáticos
✅ Relatórios com análise de IA
✅ Backup automático com compressão
✅ Dashboard web completo
✅ Sistema de qualificação de leads
✅ Transcrição de áudio
✅ Rate limiting inteligente
✅ Anti-duplicação de mensagens

### **Em Desenvolvimento** (Ver arquivo .-FUTURAS_ATUALIZAÇÕES)
🔄 Integração com banco de dados SQLite
🔄 Backup automático a cada hora
🔄 Sincronização com Google Sheets
🔄 CRM integrado com funil de vendas
🔄 Análise de sentimentos automática
🔄 Relatórios semanais/mensais por WhatsApp
🔄 Agendamento de follow-ups inteligente
🔄 Integração com CRMs externos
🔄 Sistema de CRM próprio
🔄 Gestão centralizada de chatIds
🔄 Análise de público e comportamento
🔄 Segmentação avançada de listas

## 📚 Conclusão

O sistema **AC-PC** é uma solução completa e robusta para automação de vendas imobiliárias através do WhatsApp. Com sua arquitetura modular, sistema de IA avançado, e interface de administração intuitiva, o sistema oferece:

- **Automação completa**: Do primeiro contato ao agendamento
- **Inteligência artificial**: Para conversas naturais e qualificação automática
- **Escalabilidade**: Suporte a múltiplos clientes simultaneamente
- **Confiabilidade**: Sistema de fallback e recuperação automática
- **Monitoramento**: Dashboards e relatórios em tempo real
- **Segurança**: Rate limiting, anti-duplicação e backup automático

O sistema está em constante evolução, com novas funcionalidades sendo adicionadas regularmente para melhorar ainda mais a experiência de vendas e a eficiência operacional da imobiliária CMW.