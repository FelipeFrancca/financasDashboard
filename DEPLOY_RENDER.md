# 🚀 Guia de Deploy no Render.com - Finanças 360°

Este guia te ajuda a fazer deploy da aplicação completa no Render.com de forma gratuita.

## 📋 Pré-requisitos

1. Conta no [Render.com](https://render.com) (gratuita)
2. Repositório GitHub com o código
3. *(Opcional)* Credenciais do Google OAuth configuradas
4. *(Opcional)* Credenciais de email (Gmail App Password)

---

## 🎯 Opção 1: Deploy Automático com Blueprint (Recomendado)

### Passo 1: Preparar o Repositório

Certifique-se de que o arquivo `render.yaml` está no root do repositório.

### Passo 2: Conectar no Render

1. Acesse https://render.com e faça login
2. Clique em **"New +"** → **"Blueprint"**
3. Conecte seu repositório GitHub
4. Selecione o repositório `financasDashboard`
5. O Render vai detectar automaticamente o `render.yaml`

### Passo 3: Configurar Variáveis Sensíveis

O Render vai criar o banco de dados e a aplicação automaticamente, mas você precisa adicionar manualmente:

#### Variáveis Obrigatórias:
- Nenhuma! O `render.yaml` já configura tudo automaticamente

#### Variáveis Opcionais (para Google OAuth):
1. No dashboard do Render, vá em **Environment**
2. Adicione:
   ```
   GOOGLE_CLIENT_ID=seu-client-id-aqui
   GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
   GOOGLE_CALLBACK_URL=https://SEU-APP.onrender.com/api/auth/google/callback
   ```

#### Variáveis Opcionais (para Email):
```
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app-aqui
```

### Passo 4: Deploy

1. Clique em **"Apply"**
2. Aguarde o build (5-10 minutos)
3. Acesse sua aplicação em: `https://SEU-APP.onrender.com`

---

## 🎯 Opção 2: Deploy Manual

### Passo 1: Criar o Banco de Dados

1. No dashboard do Render, clique em **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `financas360-db`
   - **Database**: `financas360`
   - **Plan**: Free
3. Clique em **"Create Database"**
4. Copie a **Internal Database URL** (será algo como `postgresql://...`)

### Passo 2: Criar o Web Service

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `financas360-app`
   - **Environment**: Docker
   - **Plan**: Free
   - **Dockerfile Path**: `./Dockerfile`

### Passo 3: Configurar Variáveis de Ambiente

Na seção **Environment Variables**, adicione:

```bash
# Obrigatórias
NODE_ENV=production
PORT=5000
DATABASE_URL=<cole-a-url-do-banco-aqui>
CORS_ORIGIN=*

# JWT (gere chaves seguras!)
JWT_SECRET=<gerar-chave-forte-64-chars>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<gerar-outra-chave-forte-64-chars>
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_CALLBACK_URL=https://SEU-APP.onrender.com/api/auth/google/callback

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app
EMAIL_FROM=noreply@financas360.com
```

### Passo 4: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build
3. Acesse `https://SEU-APP.onrender.com`

---

## 🔐 Gerando Chaves Seguras

Para gerar `JWT_SECRET` e `JWT_REFRESH_SECRET`:

### No Terminal:
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))

# Online
# https://generate-secret.vercel.app/64
```

---

## 🔧 Configurações Importantes

### 1. Google OAuth

Se quiser usar login com Google:

1. Acesse https://console.cloud.google.com/
2. Crie um novo projeto ou use existente
3. Vá em **APIs & Services** → **Credentials**
4. Crie **OAuth 2.0 Client ID**
5. Adicione em **Authorized redirect URIs**:
   ```
   https://SEU-APP.onrender.com/api/auth/google/callback
   ```
6. Copie Client ID e Client Secret para as variáveis de ambiente

### 2. Gmail App Password

Para envio de emails:

1. Acesse https://myaccount.google.com/security
2. Ative **Verificação em duas etapas**
3. Vá em **Senhas de app**
4. Gere uma senha para "Mail"
5. Use essa senha em `EMAIL_PASSWORD`

### 3. CORS

Para produção, é recomendado especificar o domínio:

```bash
# Desenvolvimento
CORS_ORIGIN=*

# Produção (mais seguro)
CORS_ORIGIN=https://seu-app.onrender.com
```

---

## 📊 Monitoramento

### Logs

No dashboard do Render, vá em **Logs** para ver:
- Build logs
- Application logs
- Erros de runtime

### Health Check

Teste se está tudo funcionando:
```bash
curl https://SEU-APP.onrender.com/health
```

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "2025-11-11T04:00:00.000Z",
  "environment": "production"
}
```

---

## 🚨 Troubleshooting

### Erro: "Application failed to respond"
- Verifique se `PORT` está definida como `5000`
- Confirme que `NODE_ENV=production`
- Veja os logs para erros de conexão com banco

### Erro: Migrations não aplicadas
- As migrations são aplicadas automaticamente no start
- Verifique os logs: deve aparecer "No pending migrations to apply"

### Erro: Frontend não carrega
- Confirme que `NODE_ENV=production`
- Verifique se os arquivos foram copiados: veja logs de build
- Teste acessando `/health` para ver se backend responde

### Erro: Prisma não encontra o Query Engine
- Já está configurado no `schema.prisma`:
  ```prisma
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
  ```

---

## 💡 Dicas

1. **Free Tier**: Render sleep após 15 minutos de inatividade. Primeiro acesso pode demorar ~30s
2. **Banco de Dados**: Free tier tem limite de 90 dias, depois precisa upgrade
3. **Logs**: Render mantém logs por 7 dias no plano gratuito
4. **SSL**: HTTPS é automático e gratuito
5. **Domínio customizado**: Disponível nos planos pagos

---

## 🔄 Deploy Contínuo

Após configurar, toda vez que você fizer push para o GitHub, o Render fará deploy automaticamente!

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
# Render vai detectar e fazer deploy automático
```

---

## 📚 Referências

- [Documentação Render - Docker](https://render.com/docs/docker)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Deploy from GitHub](https://render.com/docs/github)
- [PostgreSQL no Render](https://render.com/docs/databases)

---

## ❓ Suporte

- **Documentação do Projeto**: [README.md](./README.md)
- **Setup Local**: [SETUP.md](./SETUP.md)
- **Docker**: [README_DOCKER.md](./README_DOCKER.md)
- **Render Support**: https://render.com/docs
