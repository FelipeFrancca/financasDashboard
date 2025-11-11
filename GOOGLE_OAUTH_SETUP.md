# 🔐 Configuração do Google OAuth

Este guia explica como configurar o login com Google na aplicação Finanças Dashboard.

## ⚠️ IMPORTANTE

O Google OAuth **NÃO funcionará** sem configuração adequada. Você verá o erro:
> "A solicitação é inválida e não pôde ser processada pelo servidor"

Isso acontece porque as credenciais no `.env` são placeholders. Siga os passos abaixo.

---

## 📋 Passo a Passo

### 1️⃣ Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Nome sugerido: `Financas Dashboard`

### 2️⃣ Ativar Google+ API

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Procure por "Google+ API"
3. Clique em **Enable**

### 3️⃣ Configurar OAuth Consent Screen

1. Vá em **APIs & Services** > **OAuth consent screen**
2. Escolha **External** (para testes pessoais)
3. Clique em **Create**
4. Preencha:
   - **App name**: `Financas Dashboard`
   - **User support email**: seu email
   - **Developer contact**: seu email
5. Clique em **Save and Continue**
6. Em **Scopes**, clique em **Add or Remove Scopes**
7. Adicione:
   - `userinfo.email`
   - `userinfo.profile`
8. Clique em **Save and Continue**
9. Em **Test users**, adicione seu email do Google
10. Clique em **Save and Continue**

### 4️⃣ Criar Credenciais OAuth

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **+ Create Credentials** > **OAuth client ID**
3. Escolha **Web application**
4. Configure:
   - **Name**: `Financas Dashboard Web Client`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://localhost:5000
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:5000/api/auth/google/callback
     ```
5. Clique em **Create**
6. **COPIE** o `Client ID` e `Client Secret` que aparecem

### 5️⃣ Atualizar o arquivo .env

1. Abra `backend/.env`
2. Substitua as linhas:

```env
# Antes (placeholders - NÃO FUNCIONAM)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Depois (cole suas credenciais)
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789
```

### 6️⃣ Reiniciar o Backend

No terminal do backend, pare o servidor (`Ctrl+C`) e reinicie:

```bash
bun run dev
```

---

## ✅ Testar o Google OAuth

1. Acesse http://localhost:5173/login
2. Clique no botão **"Continuar com Google"**
3. Escolha sua conta Google
4. Aceite as permissões
5. Você será redirecionado para o dashboard

---

## 🐛 Troubleshooting

### Erro: "A solicitação é inválida"
- **Causa**: Credenciais não configuradas ou inválidas
- **Solução**: Verifique se copiou corretamente o Client ID e Secret

### Erro: "redirect_uri_mismatch"
- **Causa**: URL de callback não autorizada
- **Solução**: No Google Console, verifique se `http://localhost:5000/api/auth/google/callback` está nas **Authorized redirect URIs**

### Erro: "access_denied"
- **Causa**: Usuário não está na lista de test users
- **Solução**: Adicione seu email em **OAuth consent screen** > **Test users**

### Backend não reinicia
- **Causa**: Porta 5000 ainda em uso
- **Solução**: Pare o processo: `npx kill-port 5000` ou `taskkill /F /IM bun.exe` no Windows

---

## 📝 Notas Importantes

- ⚠️ As credenciais são **sensíveis** - nunca faça commit do `.env` com valores reais
- 🔒 No ambiente de produção, use URLs HTTPS
- 👥 Enquanto em modo "Testing", apenas test users podem fazer login
- 🚀 Para publicar para todos os usuários, submeta o app para verificação do Google

---

## 🔗 Links Úteis

- [Google Cloud Console](https://console.cloud.google.com/)
- [Documentação OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Passport Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)

