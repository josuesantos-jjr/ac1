# 🔐 Configuração do Google OAuth para CRM

## Como Funcionam as Credenciais do Google

**IMPORTANTE**: Não é login e senha pessoal! São credenciais técnicas da aplicação.

## 📋 Passo a Passo para Configurar

### 1. Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em "Criar Projeto" ou selecione um existente
3. Anote o **Project ID**

### 2. Habilitar APIs Necessárias

1. No menu lateral: "APIs e Serviços" → "Biblioteca"
2. Procure e habilite:
   - **Google Sheets API**
   - **Google Drive API**

### 3. Criar Credenciais OAuth

1. Vá para: "APIs e Serviços" → "Credenciais"
2. Clique: "Criar Credenciais" → "ID do Cliente OAuth"
3. Tipo: **Aplicativo Web**
4. Nome: "CRM Sistema"
5. URIs de redirecionamento autorizados:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
   ⚠️ Para produção, adicione sua URL real

### 4. Baixar e Configurar Credenciais

Após criar, baixe o arquivo JSON e coloque na raiz do projeto como `credentials.json`

**OU** configure via variáveis de ambiente no arquivo `.env`:

```env
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## 🔑 Onde Encontrar as Credenciais

No arquivo `credentials.json` baixado, você encontrará:

```json
{
  "client_id": "123456789-abcdefghijklmnop.apps.googleusercontent.com",
  "client_secret": "GOCSPX-abcdefghijklmnopqrstuvwx",
  "redirect_uris": ["http://localhost:3000/api/auth/google/callback"]
}
```

## 🚀 Como Usar no Sistema

1. **Arquivo**: Coloque `credentials.json` na raiz do projeto
   **OU**
2. **Variáveis**: Configure no `.env`

3. **Execute**: `npm run dev`

4. **Clique**: Botão "📊" no dashboard → "🔗 Conectar Google Sheets"

5. **Autorize**: O Google pedirá permissão para acessar Sheets

## ⚠️ Segurança Importante

- ✅ **Nunca** compartilhe `credentials.json`
- ✅ **Nunca** commite credenciais no Git
- ✅ Use `.env` para produção
- ✅ Configure restrições de domínio nas credenciais OAuth

## 🔍 Verificação

Após configurar, o sistema deve:
- ✅ Detectar credenciais automaticamente
- ✅ Mostrar botão "🔗 Conectar Google Sheets"
- ✅ Permitir sincronização bidirecional com planilhas

## ❓ Problemas Comuns

**Erro: "Credenciais não encontradas"**
- Verifique se `credentials.json` existe na raiz
- Ou se variáveis de ambiente estão configuradas

**Erro: "Redirect URI mismatch"**
- Verifique se a URI no Google Console matches exatamente

**Erro: "Access denied"**
- Certifique-se de que as APIs estão habilitadas
- Verifique permissões do usuário do Google

## ⚠️ Problema: "Acesso bloqueado - App não verificado"

### ❌ **Erro:** `Erro 403: access_denied`
```
AC-Local não concluiu o processo de verificação do Google.
Ele está em fase de testes e só pode ser acessado por testadores aprovados pelo desenvolvedor.
```

### ✅ **Soluções Rápidas:**

#### **1. Adicionar Testadores (Recomendado)**
1. Acesse: https://console.cloud.google.com/
2. **APIs → Credenciais** → Selecionar seu ID OAuth
3. **"Usuários de teste"** → **+ Adicionar usuários**
4. Adicione: `s.onpublicidade@gmail.com`
5. **Salvar**

#### **2. Usar Conta do Desenvolvedor**
- Faça login com a conta que criou o projeto Google Cloud
- Ela tem acesso automático como desenvolvedor

#### **3. Verificação Completa (Difícil)**
- Requer site público, política de privacidade
- Processo de 4-6 semanas
- Gratuito, mas burocrático

## 📞 Suporte

Se tiver dúvidas, verifique:
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Sheets API Docs](https://developers.google.com/sheets/api)

### 💡 **Dica**: Use a conta que criou o projeto para testar!