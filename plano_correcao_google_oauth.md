# 🔧 Plano de Correção do Google OAuth - Redirecionamento para VPS

## 📋 Resumo do Problema
- **Problema**: URI de redirecionamento configurada para IP privado (`172.31.30.168`)
- **Solução**: Usar URL do Ngrok (`https://jacquetta-unsombre-gingelly.ngrok-free.dev`)
- **Meta**: Redirecionar corretamente após autenticação Google OAuth

## 🎯 Passos para Correção

### ✅ PASSO 1: Atualizar Arquivo de Credenciais JSON
**Arquivo**: `client_secret_621017169530-5rvf55fm48j4ar16mfso18e73rn6vdup.apps.googleusercontent.com.json`

**AÇÃO**: Substituir URI atual por nova URI do Ngrok

**Antes**:
```json
{"web":{"client_id":"621017169530-5rvf55fm48j4ar16mfso18e73rn6vdup.apps.googleusercontent.com","project_id":"ac-local-1","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"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","redirect_uris":["http://172-31-30-168:3000/api/auth/google/callback"]}}
```

**Depois**:
```json
{"web":{"client_id":"621017169530-5rvf55fm48j4ar16mfso18e73rn6vdup.apps.googleusercontent.com","project_id":"ac-local-1","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"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","redirect_uris":["https://jacquetta-unsombre-gingelly.ngrok-free.dev/api/auth/google/callback"]}}
```

### ✅ PASSO 2: Configurar Variável de Ambiente
**Arquivo**: `.env`

**ADICIONAR**:
```env
GOOGLE_REDIRECT_URI=https://jacquetta-unsombre-gingelly.ngrok-free.dev/api/auth/google/callback
```

### ✅ PASSO 3: Atualizar Google Cloud Console
**URL**: https://console.cloud.google.com/

**AÇÕES**:
1. Ir para **APIs & Services** → **Credentials**
2. Localizar ID OAuth: `621017169530-5rvf55fm48j4ar16mfso18e73rn6vdup.apps.googleusercontent.com`
3. Clicar em **Editar** (ícone lápis)
4. Em **Authorized redirect URIs**, **REMOVER**:
   - ❌ `http://172-31-30-168:3000/api/auth/google/callback`
5. **ADICIONAR**:
   - ✅ `https://jacquetta-unsombre-gingelly.ngrok-free.dev/api/auth/google/callback`
6. **Salvar**

### ✅ PASSO 4: Verificar Ngrok
**VERIFICAR**:
- ✅ Ngrok está rodando na VPS
- ✅ URL `https://jacquetta-unsombre-gingelly.ngrok-free.dev` está acessível
- ✅ Rota `/api/auth/google/callback` responde corretamente

**COMANDO para verificar**:
```bash
curl -I https://jacquetta-unsombre-gingelly.ngrok-free.dev/api/auth/google/callback
```

### ✅ PASSO 5: Testar Fluxo OAuth
**TESTE**:
1. Acessar aplicação: `https://jacquetta-unsombre-gingelly.ngrok-free.dev`
2. Clicar em botão "🔗 Conectar Google Sheets"
3. **Esperado**: Redirecionamento para Google OAuth
4. **Esperado**: Após autorização, retorno para aplicação na URL correta

### ✅ PASSO 6: Documentar Configuração
**ADICIONAR** em `documentacoes/README_Google_OAuth_Setup.md`:
```markdown
## 🚨 ATUALIZAÇÃO: Redirecionamento para VPS

**Data**: 2025-12-08
**Problema**: URI configurada para IP privado da AWS
**Solução**: Usar Ngrok para exposição externa

**URL de Produção**:
- Ngrok: `https://jacquetta-unsombre-gingelly.ngrok-free.dev`
- Callback: `https://jacquetta-unsombre-gingelly.ngrok-free.dev/api/auth/google/callback`

**⚠️ IMPORTANTE**: 
- URLs do Ngrok podem mudar se reiniciar o serviço
- Se Ngrok mudar, atualizar todas as configurações acima
```

## 🔍 Verificação Final

Após implementar todos os passos:
- [ ] Credenciais JSON atualizada
- [ ] Variável GOOGLE_REDIRECT_URI configurada
- [ ] Google Cloud Console atualizado
- [ ] Ngrok acessível e funcionando
- [ ] Teste OAuth realizado com sucesso

## 🆘 Solução de Problemas

**Erro: "redirect_uri_mismatch"**
- ✅ Verificar se URI no Google Cloud Console está exatamente igual
- ✅ Verificar se Ngrok está rodando e URL acessível

**Erro: "access_denied"**
- ✅ Verificar se usuário está na lista de testadores
- ✅ Verificar se APIs Google Sheets e Drive estão habilitadas

**Ngrok não acessível**
- ✅ Verificar se Ngrok está rodando: `ps aux | grep ngrok`
- ✅ Reiniciar Ngrok se necessário