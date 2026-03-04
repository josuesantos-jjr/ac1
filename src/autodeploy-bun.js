import crypto from 'crypto';
import { exec } from 'child_process';

// Rate limiting simples
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS = 5;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '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';

function isRateLimited(ip) {
    const now = Date.now();
    const userRequests = rateLimit.get(ip) || [];
    
    // Limpa requests antigos
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

const server = Bun.serve({
    port: 8080,
    fetch(request) {
        const url = new URL(request.url);
        
        if (url.pathname !== '/deploy') {
            return new Response('Not Found', { status: 404 });
        }

        const clientIP = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
        
        // Rate limiting
        if (isRateLimited(clientIP)) {
            console.log(`🚫 Rate limit exceeded for IP: ${clientIP}`);
            return new Response('Too Many Requests', { status: 429 });
        }

        return request.text().then(text => {
            try {
                const payload = JSON.parse(text);
                const signature = request.headers.get('x-hub-signature-256');
                
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

                // Executa deploy-bun.sh (o novo script)
                exec('./deploy-bun.sh', (error, stdout, stderr) => {
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
    }
});

console.log('🚀 Webhook server Bun iniciado na porta 8080');