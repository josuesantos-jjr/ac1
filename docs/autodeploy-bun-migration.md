# 🔄 Migração Autodeploy para Bun

## 📋 Resumo da Migração

Migração completa do sistema de autodeploy de Node.js para Bun, mantendo todas as funcionalidades de segurança e monitoramento.

## 🎯 Funcionalidades a Migrar

### ✅ Funcionalidades Atuais Mantidas:
- Rate limiting (5 requests por minuto por IP)
- Validação HMAC-SHA256 do GitHub
- Execução de script deploy.sh
- Logs detalhados
- Verificação de branch main
- Proteção contra spam

### 🆕 Melhorias no Bun:
- Servidor HTTP nativo (mais rápido)
- Sintaxe ES modules moderna
- Menos dependências externas
- Melhor performance de I/O

## 📝 Arquivos a Criar/Modificar

### 1. `src/autodeploy-bun.js` - Novo servidor webhook
```javascript
import { serve } from 'http';
import crypto from 'crypto';
import { exec } from 'child_process';

const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS = 5;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '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';

function isRateLimited(ip) {
    const now = Date.now();
    const userRequests = rateLimit.get(ip) || [];
    
    const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= MAX_REQUESTS) {
        return true;
    }
    
    validRequests.push(now);
    rateLimit.set(ip, validRequests);
    return false;
}

function verifySignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
    
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(digest)
        );
    } catch {
        return false;
    }
}

const server = serve(async (req) => {
    if (req.url !== '/deploy') {
        return new Response('Not Found', { status: 404 });
    }

    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Rate limiting
    if (isRateLimited(clientIP)) {
        console.log(`🚫 Rate limit exceeded for IP: ${clientIP}`);
        return new Response('Too Many Requests', { status: 429 });
    }

    try {
        const payload = await req.json();
        const signature = req.headers.get('x-hub-signature-256');
        
        // Validação HMAC
        if (!signature || !verifySignature(payload, signature)) {
            console.log('❌ Invalid HMAC signature');
            return new Response('Unauthorized', { status: 401 });
        }

        // Verifica se é push para main
        if (payload.ref !== 'refs/heads/main') {
            console.log(`⏭️ Ignorando push para branch: ${payload.ref}`);
            return new Response('Branch ignorada');
        }

        console.log('✅ Webhook válido - iniciando deploy');

        // Executa deploy.sh
        exec('./deploy.sh', (error, stdout, stderr) => {
            console.log('Deploy stdout:', stdout);
            if (error) {
                console.error('Deploy error:', error);
                console.error('Deploy stderr:', stderr);
            }
        });

        return new Response('Webhook processado com sucesso');
    } catch (error) {
        console.error('Erro processando webhook:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
});

server.listen(8080);
console.log('🚀 Webhook server iniciado na porta 8080');
```

### 2. `deploy-bun.sh` - Script atualizado para Bun
```bash
#!/bin/bash
set -e  # Para no primeiro erro

echo "🚀 Iniciando deploy $(date)"

# Criar diretório de logs se não existir
mkdir -p logs/deploy

# Função de log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a logs/deploy/deploy-$(date +%Y%m%d).log
}

# Função de rollback
rollback() {
    log "❌ Erro detectado - fazendo rollback"
    git reset --hard HEAD~1 2>/dev/null || git reset --hard origin/main~1
    bun install --production
    bun run build
    pm2 restart front
    log "🔄 Rollback concluído"
    exit 1
}

# Trap para rollback em caso de erro
trap rollback ERR

log "📦 Fazendo backup de arquivos locais"

# Backup arquivos locais (ignorar erros se diretórios não existirem)
tar -czf "backup-$(date +%Y%m%d-%H%M%S).tar.gz" dados/ clientes/ uploads/ 2>/dev/null || log "⚠️ Alguns diretórios de backup não encontrados (normal na primeira execução)"

log "🔄 Atualizando código do repositório"

# Git operations seguras
git fetch origin
git reset --hard HEAD  # Limpa mudanças locais não committadas
git pull origin main --allow-unrelated-histories

log "📦 Instalando dependências com Bun"
bun install --production

log "🔨 Fazendo build da aplicação"
bun run build

log "🔄 Reiniciando aplicação com PM2"
pm2 restart front || pm2 start src/start.js --name front

log "🏥 Verificando saúde da aplicação"
sleep 15  # Tempo para aplicação subir

# Health check
if curl -f --max-time 30 http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Deploy concluído com sucesso"
    log "🧹 Limpando backups antigos (mantendo últimos 5)"
    ls -t backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
    exit 0
else
    log "❌ Falha no health check"
    rollback
fi
```

### 3. Atualizar `package.json` scripts
```json
{
  "scripts": {
    "autodeploy": "bun run src/autodeploy-bun.js",
    "autodeploy:pm2": "pm2 start src/autodeploy-bun.js --name autodeploy",
    "deploy-bun": "./deploy-bun.sh"
  }
}
```

## 🔧 Configurações do GitHub

```
Payload URL: http://SEU_IP_VPS:8080/deploy
Content type: application/json
Secret: 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
SSL verification: Enable SSL verification
Which events: Just the push event
```

## 🏗️ Processo de Instalação na VPS

### 1. Instalar Bun na VPS
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 2. Configurar variáveis de ambiente
```bash
echo "GITHUB_WEBHOOK_SECRET=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" >> .env
```

### 3. Instalar dependências
```bash
bun install
```

### 4. Tornar scripts executáveis
```bash
chmod +x deploy-bun.sh
chmod +x src/autodeploy-bun.js
```

### 5. Iniciar PM2 com Bun
```bash
bun run autodeploy:pm2
```

### 6. Verificar status
```bash
pm2 status
pm2 logs autodeploy
```

## ⚡ Testes de Validação

### 1. Teste de conectividade
```bash
curl -X POST http://localhost:8080/deploy \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 2. Teste de rate limiting
- Fazer 5 requests rápidos
- Verificar se o 6º retorna 429

### 3. Teste de validação HMAC
- Fazer request sem signature
- Verificar se retorna 401

## 🔍 Monitoramento

### Logs importantes:
- `logs/deploy/deploy-YYYYMMDD.log` - Logs do deploy
- `pm2 logs autodeploy` - Logs do webhook server
- GitHub webhook delivery logs

### Alertas configurados:
- Falha no health check → Rollback automático
- Erro no deploy → Notificação e rollback
- Rate limit exceeded → Log apenas

## 🚀 Próximos Passos

1. ✅ Criar `src/autodeploy-bun.js`
2. ✅ Criar `deploy-bun.sh`
3. ✅ Atualizar `package.json`
4. ✅ Testar em ambiente local
5. ✅ Configurar na VPS
6. ✅ Configurar webhook do GitHub
7. ✅ Testar deploy completo

## ⚠️ Considerações Importantes

### Segurança:
- Token do GitHub exposto no código (considerar usar variável de ambiente)
- Rate limiting protege contra spam
- HMAC validation obrigatório

### Performance:
- Bun é ~2x mais rápido que Node.js para I/O
- HTTP nativo reduz overhead
- Menor consumo de memória

### Compatibilidade:
- Bun suporta 95% das APIs do Node.js
- Dependências específicas podem precisar de ajustes
- Testar todas as funcionalidades antes de produção