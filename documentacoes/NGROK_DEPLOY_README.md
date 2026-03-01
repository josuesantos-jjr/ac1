# 🚀 Deploy da Aplicação com Ngrok

Este documento explica como fazer o deploy da aplicação no VPS Google com integração automática do Ngrok.

## 📋 Pré-requisitos

- VPS Google configurado
- Node.js instalado no servidor
- Ngrok instalado globalmente: `npm install -g ngrok`
- Aplicação funcionando localmente

## 🔐 1. Configuração Inicial do Ngrok

Antes do primeiro deploy, você precisa configurar o token de autenticação do Ngrok:

### Passo 1: Obter Token
1. Acesse: https://dashboard.ngrok.com/get-started/setup
2. Faça login com suas credenciais:
   - **Email:** josuesantos.jobs@gmail.com
   - **Senha:** Senhangrok1@
3. Copie o token gerado

### Passo 2: Configurar Token
Execute no servidor:
```bash
npx ngrok config add-authtoken [SEU_TOKEN_AQUI]
```

### Passo 3: Verificar Configuração
```bash
npx ngrok config check
```

## 🚀 2. Processo de Deploy

### Passo 1: Upload dos Arquivos
```bash
# No seu servidor VPS:
git clone [seu-repositorio] .  # ou faça upload dos arquivos
```

### Passo 2: Instalar Dependências
```bash
npm install
```

### Passo 3: Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas configurações específicas
nano .env
```

**Arquivo `.env` mínimo necessário:**
```env
NGROK_AUTH_TOKEN=seu_token_aqui
NGROK_EMAIL=josuesantos.jobs@gmail.com
NGROK_PASSWORD=Senhangrok1@
NGROK_PORT=3000
NODE_ENV=production
PORT=3000
```

### Passo 4: Build da Aplicação
```bash
npm run build
```

### Passo 5: Iniciar Aplicação
```bash
npm start
```

## 📊 3. Scripts Disponíveis

### Scripts de Produção:
- `npm run start:production` - Script robusto para produção com logs detalhados
- `npm start` - Script padrão (já integrado com Ngrok)

### Scripts de Desenvolvimento:
- `npm run ngrok:setup` - Configuração inicial do Ngrok
- `npm run ngrok:start` - Testar túnel Ngrok isoladamente
- `npm run ngrok:test` - Testar Ngrok + aplicação sem produção

## 🔧 4. Configurações Importantes

### Porta do Servidor:
- **Interna:** 3000 (configurada automaticamente)
- **Ngrok:** Expõe automaticamente na porta 3000

### Logs:
- Arquivo de log: `logs/production.log`
- Monitoramento em tempo real: `tail -f logs/production.log`

### URL da Aplicação:
Após iniciar com `npm start`, você verá:
```
🎉 Túnel Ngrok ativo!
🌐 URL pública: https://abc123.ngrok.io
🔗 Você pode acessar sua aplicação em: https://abc123.ngrok.io
```

## 🛠️ 5. Troubleshooting

### Problema: "Ngrok não autenticado"
**Solução:**
```bash
npx ngrok config add-authtoken [SEU_TOKEN]
```

### Problema: Porta já em uso
**Solução:**
```bash
# Verificar processos na porta 3000
lsof -i :3000

# Matar processo se necessário
kill -9 [PID]

# Ou usar outra porta
PORT=3001 npm start
```

### Problema: Build falhando
**Solução:**
```bash
# Limpar cache
rm -rf .next
npm run build
```

### Problema: Ngrok não inicia túnel
**Solução:**
```bash
# Verificar status do Ngrok
npx ngrok status

# Ver logs detalhados
DEBUG=* npm run start:production
```

## 🔒 6. Segurança

### Firewall:
```bash
# Permitir apenas porta 3000
sudo ufw allow 3000

# Verificar regras
sudo ufw status
```

### PM2 (Opcional):
Para manter aplicação rodando:
```bash
npm install -g pm2
pm2 start npm --name "archer-app" -- run start:production
pm2 startup
pm2 save
```

## 📈 7. Monitoramento

### Verificar Status:
```bash
# Status do Ngrok
curl http://localhost:4040/api/tunnels

# Status da aplicação
curl http://localhost:3000/api/env-status

# Logs do sistema
pm2 logs archer-app  # se usando PM2
tail -f logs/production.log  # logs customizados
```

### Reiniciar Aplicação:
```bash
pm2 restart archer-app  # se usando PM2
# ou
npm start  # reinicia automaticamente
```

## 🚨 8. Comandos Úteis para Produção

```bash
# Verificar se aplicação está rodando
curl http://localhost:3000

# Verificar saúde da aplicação
curl http://localhost:3000/api/env-status

# Verificar túneis Ngrok ativos
curl http://localhost:4040/api/tunnels

# Parar aplicação
Ctrl+C  # ou matar processo

# Ver logs em tempo real
tail -f logs/production.log
```

## 📞 9. Suporte

Se encontrar problemas:

1. **Verifique os logs:** `tail -f logs/production.log`
2. **Teste localmente primeiro:** `npm run ngrok:test`
3. **Verifique configuração:** `cat .env`
4. **Teste autenticação:** `npx ngrok config check`

---

🎉 **Parabéns!** Sua aplicação agora está configurada com Ngrok e pronta para deploy em produção!