# 💰 Finanças 360° - Dashboard Financeiro Completo

> Sistema completo e moderno de controle financeiro pessoal com dashboards compartilháveis, múltiplos usuários e autenticação robusta.

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Bun](https://img.shields.io/badge/Bun-1.0-black) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue) ![Material--UI](https://img.shields.io/badge/Material--UI-5-blue)

---

## 📖 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Como Instalar e Rodar](#-como-instalar-e-rodar)
- [Docker](#-docker)
- [Deploy](#-deploy)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Sobre o Projeto

**Finanças 360°** é uma aplicação web full-stack para gestão financeira pessoal que permite:

- ✅ **Controle total** de receitas e despesas
- ✅ **Múltiplos dashboards** financeiros isolados
- ✅ **Compartilhamento** de dashboards com outros usuários
- ✅ **Colaboração** com permissões (Visualizador/Editor/Proprietário)
- ✅ **Autenticação completa** com login, registro e OAuth Google
- ✅ **Visualizações inteligentes** com gráficos e métricas
- ✅ **Import/Export** de planilhas CSV
- ✅ **Tema claro/escuro** com persistência

---

## ✨ Funcionalidades Principais

### 1. 🏠 Gestão de Dashboards
- **Meus Dashboards**: Lista todos os dashboards que você criou
- **Compartilhados Comigo**: Dashboards compartilhados por outros usuários
- **Permissões**: OWNER (Proprietário), EDITOR (Pode editar), VIEWER (Apenas visualização)

### 2. 💳 Controle Financeiro Completo
- **Métricas em Tempo Real**: Receitas, Despesas, Saldo, Margem
- **Gráficos Interativos**: Evolução mensal, Distribuição por categorias
- **Tabela de Transações**: Filtros avançados, ordenação, paginação
- **Gestão**: Criar, Editar, Deletar, Parcelas
- **Import/Export**: CSV

### 3. 🔐 Sistema de Autenticação
- Login/Registro com email e senha
- **Google OAuth 2.0**
- Recuperação de senha por email
- Segurança com JWT e Refresh Tokens

### 4. 🔔 Notificações Push
- **Notificações nativas** do navegador/dispositivo
- Alertas de orçamento em tempo real
- Marcos de metas financeiras
- Atividade de dashboards compartilhados
- Configurável por preferências do usuário

### 5. 🎨 Interface e UX
- Design moderno com Material-UI
- Temas Claro/Escuro
- Responsivo (Mobile-first)

---

## 🚀 Tecnologias

### Frontend
- **React 18**, **TypeScript**, **Vite**
- **Material-UI**, **Recharts**
- **React Query**, **React Router**, **React Hook Form**

### Backend
- **Bun** (Runtime), **Express**
- **Prisma ORM**, **PostgreSQL**
- **JWT**, **Zod**, **Nodemailer**

---

## 📦 Como Instalar e Rodar

### Pré-requisitos
- **Bun** 1.0+ (ou Node.js 18+)
- **PostgreSQL** 14+
- **Git**

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd financasDashboard
```

### 2. Configurar o Backend

```bash
cd backend
bun install
```

**Configurar Variáveis de Ambiente:**
Copie o arquivo de exemplo:
```bash
# Windows
Copy-Item .env.example .env
# Linux/Mac
cp .env.example .env
```

Edite o `.env` com suas credenciais do banco de dados e segredos JWT:
```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/financas_dashboard"
JWT_SECRET="gere_uma_chave_segura"
JWT_REFRESH_SECRET="gere_outra_chave_segura"
```

**Configurar Push Notifications (opcional):**

Para habilitar notificações push nativas, gere as chaves VAPID:
```bash
npx web-push generate-vapid-keys
```

Adicione as chaves geradas ao `.env`:
```env
VAPID_PUBLIC_KEY=sua_chave_publica_gerada
VAPID_PRIVATE_KEY=sua_chave_privada_gerada
VAPID_SUBJECT=mailto:seu-email@exemplo.com
```

> ⚠️ **Importante**: Uma vez configuradas, NÃO altere as chaves VAPID ou as subscriptions existentes deixarão de funcionar.

**Configurar Banco de Dados:**
```bash
# Gerar cliente Prisma
bun prisma generate

# Criar tabelas (migrations)
bun prisma migrate dev --name init
```

**Iniciar Servidor:**
```bash
bun run dev
# Backend rodando em: http://localhost:5000
```

### 3. Configurar o Frontend

Abra um **novo terminal**:

```bash
cd frontend
bun install
bun run dev
# Frontend rodando em: http://localhost:5173
```

---

## 🐳 Docker

Para rodar a aplicação completa (Frontend + Backend + Banco) usando Docker:

### 1. Configurar Ambiente
```bash
Copy-Item .env.docker.example .env  # Windows
cp .env.docker.example .env         # Linux/Mac
```
Edite o `.env` definindo `DB_PASSWORD` e `JWT_SECRET`.

### 2. Iniciar
```bash
docker-compose up -d
```
Acesse: **http://localhost:5000**

### 3. Parar
```bash
docker-compose down
```

---

## 🌐 Deploy

A aplicação é containerizada com Docker, facilitando o deploy em qualquer plataforma que suporte containers.

### Opções de Deploy
- **VPS (DigitalOcean, AWS, etc)**: Use o `docker-compose.yml`.
- **PaaS (Railway, Fly.io)**: Deploy via Dockerfile.

---

## 🐛 Troubleshooting

### "Cannot find module 'bun'"
Instale o Bun: `irm bun.sh/install.ps1 | iex` (Windows) ou `curl -fsSL https://bun.sh/install | bash` (Linux/Mac).

### "Port 5000 already in use"
Verifique se já existe um processo rodando ou altere a porta no `.env`.

### "Error connecting to database"
1. Verifique se o PostgreSQL está rodando.
2. Verifique se a `DATABASE_URL` no `.env` está correta (usuário, senha, porta, nome do banco).
3. Tente conectar manualmente: `psql -U postgres`.

### "Prisma Client did not initialize yet"
Execute `cd backend && bun prisma generate`.

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'feat: adiciona funcionalidade X'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com 💜 por Kronn**
