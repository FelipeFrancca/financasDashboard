# 🚀 Guia de Instalação - Finanças 360°

Este guia mostra como instalar e executar a aplicação localmente em seu computador.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

### Obrigatórios
- ✅ **Bun** 1.0+ (recomendado) ou **Node.js** 18+
- ✅ **PostgreSQL** 14+
- ✅ **Git**

### Opcionais
- **Conta Google** (para OAuth)
- **Conta Gmail** (para envio de emails)

---

## 🪟 Instalação no Windows

### 1. Instalar Bun

```powershell
# Abra o PowerShell como Administrador e execute:
irm bun.sh/install.ps1 | iex

# Verifique a instalação:
bun --version
```

### 2. Instalar PostgreSQL

**Opção A: Via Chocolatey**
```powershell
# Instalar Chocolatey (se não tiver):
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar PostgreSQL:
choco install postgresql
```

**Opção B: Instalador**
1. Baixe em: https://www.postgresql.org/download/windows/
2. Execute o instalador
3. Anote a senha do usuário `postgres`

### 3. Configurar PostgreSQL

```powershell
# Criar database
psql -U postgres -c "CREATE DATABASE financas_dashboard;"

# Verificar se foi criado:
psql -U postgres -l
```

---

## 🐧 Instalação no Linux/Mac

### 1. Instalar Bun

```bash
curl -fsSL https://bun.sh/install | bash

# Verifique:
bun --version
```

### 2. Instalar PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**MacOS (com Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

### 3. Configurar PostgreSQL

```bash
# Criar database
sudo -u postgres createdb financas_dashboard

# Ou via psql:
sudo -u postgres psql
CREATE DATABASE financas_dashboard;
\q
```

---

## 📦 Instalação da Aplicação

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd financasDashboard
```

### 2. Configurar o Backend

#### a) Instalar Dependências

```bash
cd backend
bun install
```

#### b) Configurar Variáveis de Ambiente

```bash
# Windows:
Copy-Item .env.example .env

# Linux/Mac:
cp .env.example .env
```

Edite o arquivo `.env` com seus dados:

```env
# Database
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/financas_dashboard"

# Server
PORT=5000
CORS_ORIGIN=http://localhost:5173

# JWT Secrets (gere chaves aleatórias!)
JWT_SECRET=sua_chave_secreta_aqui_muito_segura_123456
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=sua_refresh_secret_diferente_654321
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth (opcional - configure depois se quiser)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (opcional - configure depois se quiser)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app
EMAIL_FROM=noreply@financas360.com

# Frontend
FRONTEND_URL=http://localhost:5173
```

**⚠️ IMPORTANTE**: 
- Substitua `SUA_SENHA` pela senha do PostgreSQL
- Gere chaves seguras para `JWT_SECRET` e `JWT_REFRESH_SECRET`
- Google OAuth e Email são opcionais para começar

#### c) Gerar Prisma Client

```bash
bun prisma generate
```

#### d) Executar Migrations

```bash
bun prisma migrate dev --name init
```

#### e) Iniciar Servidor de Desenvolvimento

```bash
bun run dev
```

**✅ Backend rodando em: http://localhost:5000**  
**📚 API Docs: http://localhost:5000/api-docs**  
**🏥 Health Check: http://localhost:5000/health**

### 3. Configurar o Frontend

Abra um **novo terminal** e execute:

#### a) Instalar Dependências

```bash
cd frontend
bun install
```

#### b) Iniciar Servidor de Desenvolvimento

```bash
bun run dev
```

**✅ Frontend rodando em: http://localhost:5173**

---

## 🎯 Primeiro Uso

1. **Abra o navegador**: http://localhost:5173
2. **Crie uma conta**: Clique em "Criar Conta" e cadastre-se
3. **Crie seu primeiro dashboard**: Clique em "Novo Dashboard"
4. **Importe dados** (opcional):
   - Use o arquivo `assets/template_financas.csv` como modelo
   - Clique em "Importar Planilha"
   - Selecione o arquivo CSV

---

## ⚙️ Configurações Opcionais

### Google OAuth

Para habilitar login com Google:

1. **Acesse Google Cloud Console**: https://console.cloud.google.com/
2. **Crie um projeto** ou selecione um existente
3. **Ative a Google+ API**:
   - Menu → APIs & Services → Library
   - Busque "Google+ API" e ative
4. **Configure OAuth Consent Screen**:
   - Menu → APIs & Services → OAuth consent screen
   - Tipo: External
   - Preencha: Nome do app, email de suporte
5. **Crie credenciais OAuth 2.0**:
   - Menu → APIs & Services → Credentials
   - "Create Credentials" → "OAuth client ID"
   - Tipo: Web application
   - Nome: Finanças 360
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
6. **Copie as credenciais**:
   - Client ID → cole em `GOOGLE_CLIENT_ID` no `.env`
   - Client Secret → cole em `GOOGLE_CLIENT_SECRET` no `.env`
7. **Reinicie o backend**

### Email (Gmail)

Para habilitar recuperação de senha por email:

1. **Ative verificação em 2 etapas** na sua conta Google
2. **Gere uma senha de app**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione: "Mail" e "Other (Custom name)"
   - Nome: "Finanças 360"
   - Copie a senha gerada
3. **Configure no `.env`**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=seu-email@gmail.com
   EMAIL_PASSWORD=senha_de_app_copiada
   EMAIL_FROM=noreply@financas360.com
   ```
4. **Reinicie o backend**

---

## 📝 Scripts Disponíveis

### Backend

```bash
# Desenvolvimento (hot-reload)
bun run dev

# Build para produção
bun run build

# Executar build
bun run start

# Prisma Studio (interface visual do banco)
bun prisma studio

# Gerar Prisma Client
bun prisma generate

# Criar migration
bun prisma migrate dev --name nome_da_migration

# Aplicar migrations (produção)
bun prisma migrate deploy

# Resetar database (CUIDADO: apaga tudo)
bun prisma migrate reset
```

### Frontend

```bash
# Desenvolvimento
bun run dev

# Build para produção
bun run build

# Preview do build
bun run preview

# Linter
bun run lint
```

---

## 🐛 Troubleshooting

### Problema: "Cannot find module 'bun'"

**Solução**: Reinstale as dependências
```bash
bun install
```

### Problema: "Port 5000 already in use"

**Solução Windows**:
```powershell
# Ver processo na porta 5000
netstat -ano | findstr :5000

# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

**Solução Linux/Mac**:
```bash
# Ver processo
lsof -i :5000

# Matar processo
kill -9 <PID>
```

### Problema: "Error connecting to database"

**Soluções**:

1. **Verifique se PostgreSQL está rodando**:
```powershell
# Windows:
Get-Service postgresql*

# Se não estiver rodando:
Start-Service postgresql-x64-14
```

```bash
# Linux:
sudo systemctl status postgresql

# Iniciar:
sudo systemctl start postgresql
```

2. **Verifique a DATABASE_URL no `.env`**:
   - Senha está correta?
   - Nome do database está certo?
   - Porta é 5432?

3. **Teste a conexão**:
```bash
psql postgresql://postgres:senha@localhost:5432/financas_dashboard
```

### Problema: "Prisma Client did not initialize yet"

**Solução**:
```bash
cd backend
bun prisma generate
```

### Problema: Google OAuth retorna erro

**Soluções**:
1. Verifique se `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão corretos
2. Confirme que a URL de callback está cadastrada no Google Cloud Console
3. Verifique se Google+ API está ativada
4. Limpe o cache do navegador e tente novamente

### Problema: Email não enviado

**Soluções**:
1. **Gmail**: Use "Senha de app", não a senha normal
2. Verifique se `EMAIL_USER` e `EMAIL_PASSWORD` estão corretos
3. Teste as credenciais com um client SMTP
4. Verifique se a porta 587 não está bloqueada

### Problema: Frontend não conecta no backend

**Soluções**:
1. Confirme que backend está rodando em `http://localhost:5000`
2. Verifique CORS no backend (`.env` → `CORS_ORIGIN`)
3. Abra console do navegador para ver erros
4. Tente acessar diretamente: http://localhost:5000/health

### Problema: Erro de CORS

**Solução**:
Verifique no backend (`.env`):
```env
CORS_ORIGIN=http://localhost:5173
```

### Problema: Build falha

**Solução**:
```bash
# Limpe node_modules e reinstale
rm -rf node_modules
bun install
```

---

## 🔒 Segurança em Produção

Antes de fazer deploy em produção:

1. **Mude as secrets do JWT**:
   - Gere chaves fortes e aleatórias
   - Use variáveis de ambiente do servidor

2. **Configure HTTPS**:
   - Use certificado SSL/TLS
   - Force HTTPS no backend

3. **Configure CORS adequadamente**:
   - Liste apenas domínios autorizados
   - Não use wildcard (`*`) em produção

4. **Database seguro**:
   - Use conexão SSL/TLS
   - Senha forte para usuário do banco
   - Backup automático

5. **Variáveis de ambiente**:
   - Nunca commite `.env` no git
   - Use serviços de secrets (AWS Secrets, etc.)

6. **Rate limiting**:
   - Implemente limite de requisições
   - Proteja contra brute force

---

## 📊 Verificar Instalação

Execute este checklist:

- [ ] Bun instalado: `bun --version`
- [ ] PostgreSQL rodando: `psql -U postgres -l`
- [ ] Database criado: `financas_dashboard` aparece na lista
- [ ] Backend instalado: `cd backend && bun install`
- [ ] `.env` configurado com DATABASE_URL correto
- [ ] Prisma Client gerado: `bun prisma generate`
- [ ] Migrations aplicadas: `bun prisma migrate dev`
- [ ] Backend rodando: http://localhost:5000/health retorna OK
- [ ] Frontend instalado: `cd frontend && bun install`
- [ ] Frontend rodando: http://localhost:5173 abre
- [ ] Login funciona: Crie uma conta de teste
- [ ] Dashboard carrega: Veja a tela inicial com tabs

---

## 🆘 Ainda com Problemas?

1. **Verifique os logs**:
   - Backend: Terminal onde rodou `bun run dev`
   - Frontend: Console do navegador (F12)

2. **Limpe tudo e recomece**:
```bash
# Backend
cd backend
rm -rf node_modules
bun install
bun prisma generate
bun prisma migrate dev

# Frontend
cd frontend
rm -rf node_modules
bun install
```

3. **Database do zero**:
```bash
cd backend
bun prisma migrate reset
```

4. **Verifique versões**:
```bash
bun --version  # Deve ser 1.0+
psql --version # Deve ser 14+
```

---

## 🎉 Pronto!

Sua aplicação está rodando!

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs
- **Prisma Studio**: `bun prisma studio` (porta 5555)

**Próximos passos**:
1. Crie sua conta
2. Crie seu primeiro dashboard
3. Adicione algumas transações
4. Explore os gráficos e filtros
5. Compartilhe com amigos!

---

**💜 Desenvolvido com carinho usando React, Bun e PostgreSQL**
