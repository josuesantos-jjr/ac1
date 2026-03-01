# Sistema de Controle de Sobrecarga da API - Documentação

## 📋 Visão Geral

Este sistema foi desenvolvido para resolver problemas críticos de sobrecarga da API do Google Gemini, garantindo:

- ✅ **180 RPM total** (60 Google + 60 Groq Qwen + 60 Groq Kimi)
- ✅ **Respostas de chat < 1 minuto** sempre priorizadas
- ✅ **Sistema de filas inteligente** com deduplicação automática
- ✅ **3 camadas de redundância** contra falhas
- ✅ **Cache inteligente** para reduzir chamadas desnecessárias
- ✅ **Monitoramento completo** com alertas automáticos

## 🏗️ Arquitetura do Sistema

### Componentes Principais

1. **`groqSuporte.ts`** - Serviço Groq com suporte a múltiplos modelos
2. **`rateLimitManager.ts`** - Gerenciador centralizado de rate limiting
3. **`smartCache.ts`** - Sistema de cache inteligente
4. **`monitoringService.ts`** - Monitoramento e métricas
5. **`googleBG.ts`** - Serviço Google Gemini (modificado)
6. **`googlechat.ts`** - Serviço Google Chat (modificado)

## 🚀 Fluxo de Funcionamento

### Para Requisições de Chat (Prioridade MÁXIMA)
```
Mensagem Chat → Processar Imediatamente → Google Gemini
    ↓ (se falhar)
Groq Qwen → Groq Kimi → Resposta Final
```

### Para Análises BG (Controle de 60 RPM)
```
Análise BG → Rate Limit (60 RPM) → Processar ou Enfilar
    ↓
Google Gemini → Cache → Resposta
    ↓ (se sobrecarregar)
Fila Inteligente → Deduplicação → Próximo minuto
    ↓ (se Google falhar)
Groq Qwen → Groq Kimi → Resposta
```

## 📊 Recursos Implementados

### 1. Rate Limiting Inteligente
- **Google Gemini**: 60 RPM compartilhados
- **Groq Qwen**: 60 RPM dedicados
- **Groq Kimi**: 60 RPM dedicados
- **Total**: 180 RPM com balanceamento automático

### 2. Sistema de Filas Prioritárias
```typescript
enum RequestType {
  CHAT = 'chat',           // Prioridade 100
  ORCAMENTO = 'orcamento', // Prioridade 80
  LEAD = 'lead',          // Prioridade 70
  RESUMO = 'resumo',      // Prioridade 60
  NOME = 'nome',          // Prioridade 40
  INTERESSE = 'interesse' // Prioridade 30
}
```

### 3. Deduplicação Automática
- Remove requisições duplicadas do mesmo `chatId + tipo`
- Mantém apenas a versão mais recente na fila
- Evita processamento desnecessário

### 4. Cache Inteligente
- **TTL**: 30 minutos
- **Máximo 5 reutilizações** por entrada
- **Tamanho máximo**: 1000 entradas
- **Evicção LRU** quando necessário

### 5. Failover em Cascata
1. **Primário**: Google Gemini (60 RPM)
2. **Secundário**: Groq Qwen (60 RPM)
3. **Terciário**: Groq Kimi (60 RPM)

## 🔧 Configuração Necessária

### 1. Chaves API no `infoCliente.json`
```json
{
  "GEMINI_KEY": "sua-chave-gemini",
  "GEMINI_KEY_CHAT": "sua-chave-gemini-chat",
  "GROQ_KEY": "sua-chave-groq"
}
```

### 2. Dependências Instaladas
```bash
npm install groq-sdk
```

## 📈 Monitoramento e Alertas

### Métricas Coletadas
- Tempo de resposta por serviço
- Taxa de sucesso/erro
- Uso de cada API
- Tamanho da fila
- Taxa de cache hit

### Regras de Alerta
- 🚨 **Erro > 10%**: Taxa de erro alta
- 🐌 **Resposta > 30s**: Latência alta
- 📋 **Fila > 100**: Acúmulo de requisições
- 💾 **Cache < 20%**: Cache ineficiente
- 🚨 **API > 90%**: Próxima do limite

## 🛠️ Como Usar

### Exemplo de Integração
```typescript
import { mainGoogleBG } from './src/backend/service/googleBG';
import { mainGoogleChat } from './src/backend/service/googlechat';

// Para análises (respeita rate limiting)
const analiseResult = await mainGoogleBG({
  currentMessageBG: "Analise este texto...",
  chatId: "123@c.us",
  clearHistory: false,
  __dirname: process.cwd()
});

// Para chat (sempre prioritário)
const chatResult = await mainGoogleChat({
  currentMessageChat: "Mensagem do usuário",
  chatId: "123@c.us",
  clearHistory: false,
  __dirname: process.cwd()
});
```

## 🔍 Diagnóstico e Troubleshooting

### Verificar Status do Sistema
```typescript
import { rateLimitManager } from './rateLimitManager';
import { smartCache } from './smartCache';
import { monitoringService } from './monitoringService';

// Status do rate limiting
console.log(rateLimitManager.getStats());

// Status do cache
console.log(smartCache.getStats());

// Relatório de saúde
console.log(monitoringService.generateHealthReport());
```

### Logs Importantes
- `✅` - Operação bem-sucedida
- `🚀` - Iniciando processamento
- `⏳` - Aguardando rate limit
- `🔄` - Failover ativado
- `📋` - Adicionado à fila
- `💾` - Cache utilizado
- `❌` - Erro ocorrido
- `💀` - Falha crítica

## 🚨 Recuperação de Erros

### Cenários de Falha Tratados

1. **Google Gemini Indisponível**
   - ✅ Failover automático para Groq
   - ✅ Manutenção de funcionalidades
   - ✅ Logs detalhados do erro

2. **Rate Limit Atingido**
   - ✅ Fila inteligente ativada
   - ✅ Processamento contínuo em segundo plano
   - ✅ Deduplicação automática

3. **Cache Corrompido**
   - ✅ Recriação automática do cache
   - ✅ Recuperação graceful
   - ✅ Logs de diagnóstico

4. **Perda de Conectividade**
   - ✅ Retry com backoff exponencial
   - ✅ Failover entre serviços
   - ✅ Timeout apropriado

## 📊 Relatórios e Métricas

### Comando para Exportar Métricas
```typescript
// Exporta métricas detalhadas
monitoringService.exportMetrics('./logs/metrics_backup.json');
```

### Interpretando Resultados
```json
{
  "successRate": 95.5,
  "averageResponseTime": 1200,
  "queueLength": 5,
  "cacheHitRate": 35.2,
  "apiUsage": {
    "googleGemini": { "usage": 45, "limit": 60 },
    "groq": { "usage": 30, "limit": 120 }
  }
}
```

## 🔒 Segurança e Performance

### Boas Práticas Implementadas
- ✅ Validação de entrada em todas as funções
- ✅ Sanitização de dados sensíveis nos logs
- ✅ Tratamento seguro de erros
- ✅ Limpeza automática de recursos
- ✅ Controle de memória e CPU

### Limites de Segurança
- **Máximo 1000** entradas de cache
- **Timeout 30s** para cada tentativa
- **Máximo 3** tentativas por requisição
- **Fila limitada** para evitar memory leaks

## 🚀 Próximos Passos

1. **Monitorar** o sistema em produção
2. **Ajustar limites** baseado no uso real
3. **Otimizar cache** conforme padrões identificados
4. **Expandir alertas** para outros canais (Telegram, Slack)
5. **Implementar circuit breaker** para serviços problemáticos

## 📞 Suporte

Para problemas ou dúvidas sobre o sistema:

1. Verifique os logs em `logs/alerts.log`
2. Exporte métricas atuais usando `monitoringService.exportMetrics()`
3. Analise padrões de erro nos últimos registros
4. Verifique conectividade com as APIs externas

---

**Sistema desenvolvido especificamente para as necessidades do projeto CMW, garantindo máxima resiliência e performance.**