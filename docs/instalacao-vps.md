# 🚀 Guia de Instalação na VPS - Autodeploy Bun

## 📋 Pré-requisitos

- VPS com Ubuntu/Debian
- Acesso SSH
- Git configurado
- Porta 8080 disponível para webhook
- Domínio ou IP público configurado

## 🔧 Instalação Passo-a-Passo

### 1. Instalar Bun na VPS

```bash
# Instalar Bun
curl -fsSL https://bun.sh/install | bash

# Atualizar sessão (ou reiniciar SSH)
source ~/.bashrc

# Verificar instalação
bun --version
```

### 2. Clonar repositório

```bash
# Clonar o repositório
git clone https://github.com/josuesantos-jjr/AC-Online.git
cd AC-Online

# Instalar dependências
bun install
```

### 3. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo .env
nano .env

# Adicionar variáveis essenciais:
# GITHUB_WEBHOOK_SECRET=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
```

### 4. Tornar scripts executáveis

```bash
chmod +x deploy-bun.sh
chmod +x src/autodeploy-bun.js
```

### 5. Configurar firewall (se necessário)

```bash
# Permitir porta 8080
sudo ufw allow 8080
sudo ufw reload

# Verificar status
sudo ufw status
```

### 6. Iniciar aplicação principal

```bash
# Primeiro, testar build localmente
bun run build

# Iniciar aplicação principal
bun run start:pm2
# OU
pm2 start src/start.js --name front
```

### 7. Iniciar webhook server

```bash
# Opção 1: Executar diretamente (para teste)
bun run autodeploy

# Opção 2: Executar com PM2 (recomendado para produção)
bun run autodeploy:pm2

# Verificar status
pm2 status
pm2 logs autodeploy
```

### 8. Configurar PM2 para persistência

```bash
# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar com sistema
pm2 startup
# Seguir instruções que aparecerem
```

## 🔗 Configuração do GitHub Webhook

### Configurar Webhook

1. Ir para: https://github.com/josuesantos-jjr/AC-Online/settings/hooks/new
2. Configurar:

```
Payload URL: http://SEU_IP_VPS:8080/deploy
Content type: application/json  
Secret: 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
SSL verification: Enable SSL verification
Which events: Just the push event
```

### ⚠️ Importante: Substitua `SEU_IP_VPS` pelo IP público da sua VPS

### Testar Webhook

```bash
# Teste local
curl -X POST http://localhost:8080/deploy \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🧪 Testes de Validação

### 1. Teste de conectividade
```bash
# Verificar se webhook está rodando
curl http://localhost:8080/deploy

# Deve retornar "Not Found" (404) - correto
```

### 2. Teste de rate limiting
```bash
# Fazer 5 requests rápidos
for i in {1..5}; do
  curl -X POST http://localhost:8080/deploy \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
done

# 6º request deve retornar "Too Many Requests" (429)
```

### 3. Teste de health check
```bash
# Verificar se aplicação principal está rodando
curl http://localhost:3000/api/health
```

## 📊 Monitoramento

### Ver logs

```bash
# Logs do webhook
pm2 logs autodeploy

# Logs da aplicação
pm2 logs front

# Logs do deploy
tail -f logs/deploy/deploy-$(date +%Y%m%d).log
```

### Status dos processos

```bash
pm2 status
pm2 monit
```

## 🔄 Processo de Deploy Completo

### Deploy Automático (via GitHub)
1. Push para branch `main` no GitHub
2. GitHub envia webhook para VPS
3. VPS baixa atualizações
4. Instala dependências com Bun
5. Faz build da aplicação
6. Reinicia aplicação
7. Health check
8. Em caso de erro → Rollback automático

### Deploy Manual (backup)
```bash
# Se precisar fazer deploy manual
./deploy-bun.sh
```

## 🆘 Solução de Problemas

### Webhook não responde
```bash
# Verificar se está rodando
pm2 status

# Reiniciar se necessário
pm2 restart autodeploy

# Verificar logs
pm2 logs autodeploy
```

### Deploy falha
```bash
# Ver logs de deploy
cat logs/deploy/deploy-$(date +%Y%m%d).log

# Verificar se todas as dependências estão instaladas
bun install

# Testar build manualmente
bun run build
```

### Problemas de permissão
```bash
# Verificar permissões dos scripts
ls -la deploy-bun.sh
ls -la src/autodeploy-bun.js

# Corrigir se necessário
chmod +x deploy-bun.sh
chmod +x src/autodeploy-bun.js
```

### Porta 8080 já em uso
```bash
# Verificar processo usando porta 8080
sudo lsof -i :8080

# Parar processo se necessário
sudo kill -9 <PID>
```

## 🔒 Configuração de Segurança

### Variáveis de ambiente sensíveis
- `GITHUB_WEBHOOK_SECRET` → Usar variável de ambiente
- Não commitar `.env` no repositório
- Usar diferentes secrets para desenvolvimento/produção

### Firewall
- Apenas porta 80 (HTTP) e 443 (HTTPS) expostas
- Porta 3000 apenas local
- Porta 8080 apenas para webhook (se necessário)

### SSL/TLS (recomendado)
- Usar nginx como proxy reverso
- Configurar SSL com Let's Encrypt
- Redirecionar HTTP para HTTPS

## ✅ Checklist Final

- [ ] Bun instalado e funcionando
- [ ] Repositório clonado
- [ ] Dependências instaladas
- [ ] Variáveis de ambiente configuradas
- [ ] Scripts tornados executáveis
- [ ] Webhook server rodando
- [ ] Aplicação principal rodando
- [ ] PM2 configurado para persistência
- [ ] Firewall configurado
- [ ] Webhook do GitHub configurado
- [ ] Testes de conectividade realizados
- [ ] Processo de deploy testado
- [ ] Logs monitorados

## 📞 Suporte

Em caso de problemas:
1. Verificar logs em `logs/deploy/`
2. Verificar status dos processos com `pm2 status`
3. Verificar conectividade com testes básicos
4. Consultar documentação do Bun se necessário

O sistema está pronto para receber deploys automáticos! 🎉