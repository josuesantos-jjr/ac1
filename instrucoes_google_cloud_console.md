# 🚨 AÇÃO MANUAL NECESSÁRIA: Google Cloud Console

## 📋 O QUE FAZER AGORA

As configurações de arquivo já foram aplicadas, mas você precisa fazer uma **ALTERAÇÃO MANUAL** no Google Cloud Console:

### 🔗 PASSO 3: Google Cloud Console (MANUAL)

**URL**: https://console.cloud.google.com/

**AÇÕES OBRIGATÓRIAS**:

1. **Fazer login** no Google Cloud Console
2. **Ir para**: `APIs & Services` → `Credentials`
3. **Localizar ID OAuth**: `621017169530-5rvf55fm48j4ar16mfso18e73rn6vdup.apps.googleusercontent.com`
4. **Clicar no nome** para abrir detalhes
5. **Clicar em EDITAR** (ícone lápis ✏️)
6. **Em "Authorized redirect URIs"**:
   - ❌ **REMOVER**: `http://172-31-30-168:3000/api/auth/google/callback`
   - ✅ **ADICIONAR**: `https://jacquetta-unsombre-gingelly.ngrok-free.dev/api/auth/google/callback`
7. **Clicar SALVAR**

### ✅ VERIFICAÇÕES JÁ REALIZADAS

- [x] ✅ Arquivo JSON atualizado com nova URI
- [x] ✅ Variável GOOGLE_REDIRECT_URI configurada no .env
- [x] ✅ Ngrok funcionando e acessível (HTTP 200 OK)

### 🧪 TESTE APÓS CONFIGURAR

Após fazer a alteração no Google Cloud Console:

1. **Abrir**: https://jacquetta-unsombre-gingelly.ngrok-free.dev
2. **Clicar**: Botão "🔗 Conectar Google Sheets"
3. **Esperado**: Redirecionamento para Google OAuth → Autorização → Retorno para aplicação

### ⚠️ IMPORTANTE

- **A alteração no Google Cloud Console é OBRIGATÓRIA**
- Sem ela, você receberá erro: `redirect_uri_mismatch`
- As alterações nos arquivos já estão aplicadas e funcionando

---

**Data da correção**: 2025-12-08 22:42
**URL de produção**: https://jacquetta-unsombre-gingelly.ngrok-free.dev
**Status**: Aguardando configuração manual no Google Cloud Console