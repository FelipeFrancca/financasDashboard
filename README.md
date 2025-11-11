# 💰 Finanças 360° - Dashboard Financeiro Completo

> Sistema completo e moderno de controle financeiro pessoal com dashboards compartilháveis, múltiplos usuários e autenticação robusta.

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Bun](https://img.shields.io/badge/Bun-1.0-black) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue) ![Material--UI](https://img.shields.io/badge/Material--UI-5-blue)

---

## 📖 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Como Instalar](#-como-instalar)
- [Documentação Técnica](#-documentação-técnica)
- [Docker](#-docker)

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
- ✅ **Atalhos de teclado** para produtividade

---

## ✨ Funcionalidades Principais

### 1. 🏠 Gestão de Dashboards

#### Interface com Tabs
- **Meus Dashboards**: Lista todos os dashboards que você criou
- **Compartilhados Comigo**: Dashboards compartilhados por outros usuários
- Cards visuais organizados em grid responsivo (1-4 colunas)
- Criação rápida de novos dashboards
- Hover effects e animações suaves

#### Compartilhamento Inteligente
- Gere links de convite com código único
- Configure **permissões**: Visualizador ou Editor
- Defina **expiração** do convite (opcional)
- **Uso único** ou múltiplos usos
- Fluxo completo: visitante → login/cadastro → acesso automático ao dashboard

#### Permissões por Role
- **OWNER (Proprietário)**: Controle total, pode compartilhar e gerenciar
- **EDITOR**: Pode adicionar/editar/deletar transações
- **VIEWER**: Apenas visualização, sem edição

### 2. 💳 Controle Financeiro Completo

#### Dashboard Financeiro por Dashboard
- **Métricas em Tempo Real**:
  - Total de Receitas
  - Total de Despesas
  - Saldo Atual
  - Margem Saudável (%)
  
- **Gráficos Interativos**:
  - Evolução mensal (gráfico de linha)
  - Distribuição por categorias (gráfico de pizza)
  - Hover com detalhes
  - Cores personalizadas por tema

- **Tabela de Transações**:
  - Visualização completa e filtrada
  - Ordenação por coluna
  - Ações: editar, deletar
  - Paginação responsiva

#### Filtros Avançados
- 📅 **Período**: Data inicial e final
- 💵 **Tipo**: Receita ou Despesa
- 📊 **Fluxo**: Fixa ou Variável
- 🏷️ **Categoria**: Categorização customizada
- 🏦 **Instituição**: Banco ou fonte
- 🔍 **Busca textual**: Pesquisa na descrição

#### Gestão de Transações
- **Criar**: Formulário completo com validação
- **Editar**: Atualização em tempo real
- **Deletar**: Confirmação com SweetAlert
- **Entrada Rápida**: Card para lançamento ágil
- **Parcelas**: Controle de prestações
- **Status**: Paga, Pendente ou N/A

#### Import/Export
- **Importar CSV**: Upload com preview e validação
- **Exportar CSV**: Download com dados filtrados
- Template incluído: `assets/template_financas.csv`

### 3. 🔐 Sistema de Autenticação

#### Registro e Login
- Cadastro com email e senha
- Login tradicional
- **Login com Google OAuth 2.0**
- Validação de formulários
- Feedback visual de erros

#### Recuperação de Senha
- Fluxo "Esqueci minha senha"
- Email com link de reset
- Token com expiração de 1 hora
- Redefinição segura

#### Segurança
- Senhas com **hash bcrypt** (10 rounds)
- **JWT** (JSON Web Tokens)
- **Refresh tokens** (renovação automática)
- Middleware de autenticação
- Proteção de rotas privadas
- Axios interceptors para auto-refresh

### 4. 🎨 Interface e UX

#### Design Moderno
- **Material-UI (MUI)** components
- Layout responsivo (mobile-first)
- Cards com hover effects
- Animações suaves
- Feedback visual com SweetAlert2

#### Temas
- 🌞 **Tema Claro**: Interface clean e luminosa
- 🌙 **Tema Escuro**: Modo noturno confortável
- Alternância com um clique
- Persistência no localStorage
- Gradiente roxo customizado no AppBar

#### Atalhos de Teclado
| Tecla | Ação |
|-------|------|
| `G` | Abrir seção de filtros |
| `N` | Nova transação |
| `E` | Exportar dados |
| `T` | Alternar tema |
| `?` | Ver lista de atalhos |

---

## 🚀 Tecnologias

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 18 | UI Library |
| **TypeScript** | 5 | Type Safety |
| **Material-UI** | 5 | UI Components |
| **Recharts** | 2 | Gráficos |
| **React Query** | 5 | Server State |
| **React Router** | 6 | Roteamento |
| **React Hook Form** | 7 | Formulários |
| **Axios** | 1 | HTTP Client |
| **SweetAlert2** | 11 | Alertas |
| **Vite** | 5 | Build Tool |

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Bun** | 1.0+ | Runtime |
| **Node.js** | 18+ | Alternativa |
| **Express** | 4 | Web Framework |
| **TypeScript** | 5 | Type Safety |
| **Prisma ORM** | 5 | Database ORM |
| **PostgreSQL** | 14+ | Database |
| **JWT** | 9 | Auth Tokens |
| **bcrypt** | 5 | Password Hash |
| **Passport.js** | 0.7 | OAuth |
| **Nodemailer** | 6 | Email |
| **Zod** | 3 | Validation |
| **Swagger** | 5 | API Docs |

---

## 🏗️ Arquitetura

### Estrutura de Pastas

```
financasDashboard/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Express App
│   │   ├── middleware/
│   │   │   └── auth.ts              # JWT Middleware
│   │   ├── routes/
│   │   │   ├── transactions.ts      # Transações
│   │   │   ├── auth.ts              # Autenticação
│   │   │   └── dashboards.ts        # Dashboards
│   │   └── services/
│   │       ├── transactionService.ts
│   │       ├── authService.ts
│   │       └── dashboardService.ts
│   ├── prisma/
│   │   ├── schema.prisma            # Schema do Banco
│   │   └── migrations/              # SQL Migrations
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Componentes React
│   │   │   ├── MetricsCards.tsx
│   │   │   ├── ChartsSection.tsx
│   │   │   ├── TransactionsTable.tsx
│   │   │   ├── ShareDialog.tsx
│   │   │   └── ...
│   │   ├── pages/                   # Páginas
│   │   │   ├── HomePage.tsx         # Dashboards com tabs
│   │   │   ├── DashboardFinancial.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SharedPreviewPage.tsx
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx      # Estado global de auth
│   │   ├── services/
│   │   │   └── api.ts               # Axios + API calls
│   │   ├── theme/
│   │   │   └── theme.ts             # MUI Theme
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── assets/
│   └── template_financas.csv        # Template de importação
├── README.md                        # Este arquivo
├── SETUP.md                         # Guia de instalação
└── .gitignore
```

### Modelo de Dados (Prisma)

#### User (Usuário)
```prisma
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  password          String?
  name              String?
  googleId          String?  @unique
  avatar            String?
  emailVerified     Boolean  @default(false)
  resetToken        String?
  resetTokenExpiry  DateTime?
  
  transactions      Transaction[]
  dashboardsOwned   Dashboard[]
  dashboardMemberships DashboardMember[]
  invitesCreated    DashboardInvite[]
  invitesUsed       DashboardInvite[]
}
```

#### Dashboard
```prisma
model Dashboard {
  id          String   @id @default(uuid())
  title       String
  description String?
  ownerId     String
  
  owner       User     @relation(fields: [ownerId], references: [id])
  members     DashboardMember[]
  invites     DashboardInvite[]
}
```

#### DashboardMember
```prisma
model DashboardMember {
  id          String        @id @default(uuid())
  dashboardId String
  userId      String
  role        DashboardRole // OWNER | EDITOR | VIEWER
  
  @@unique([dashboardId, userId])
}
```

#### Transaction (Transação)
```prisma
model Transaction {
  id                String   @id @default(uuid())
  userId            String
  date              DateTime
  entryType         String   // "Receita" | "Despesa"
  flowType          String   // "Fixa" | "Variável"
  category          String
  subcategory       String?
  description       String
  amount            Float
  paymentMethod     String?
  institution       String?
  installmentTotal  Int      @default(1)
  installmentNumber Int      @default(1)
  installmentStatus String   @default("N/A")
  notes             String?
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### API Endpoints

#### Autenticação (`/api/auth`)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/register` | Criar nova conta |
| POST | `/login` | Login com email/senha |
| GET | `/google` | Iniciar OAuth Google |
| GET | `/google/callback` | Callback Google |
| POST | `/forgot-password` | Solicitar reset de senha |
| POST | `/reset-password` | Redefinir senha |
| POST | `/refresh` | Renovar access token |
| GET | `/me` | Dados do usuário atual |

#### Dashboards (`/api/dashboards`)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar dashboards do usuário |
| POST | `/` | Criar novo dashboard |
| POST | `/:id/invites` | Criar convite de compartilhamento |
| POST | `/accept-invite` | Aceitar convite |
| GET | `/shared/:code` | Preview público de convite |

#### Transações (`/api/transactions`)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar com filtros |
| GET | `/:id` | Buscar por ID |
| POST | `/` | Criar nova |
| POST | `/bulk` | Criar múltiplas |
| PUT | `/:id` | Atualizar |
| DELETE | `/:id` | Deletar |
| GET | `/stats/summary` | Estatísticas |

**Documentação completa**: http://localhost:5000/api-docs

---

## 📦 Como Instalar

Veja o guia completo de instalação em **[SETUP.md](SETUP.md)**

**Resumo rápido:**

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd financasDashboard

# 2. Backend
cd backend
bun install
cp .env.example .env  # Configure DATABASE_URL e secrets
bun prisma generate
bun prisma migrate dev
bun run dev           # Roda em http://localhost:5000

# 3. Frontend (novo terminal)
cd frontend
bun install
bun run dev           # Roda em http://localhost:5173
```

---

## 📚 Documentação Técnica

### Fluxos Principais

#### Fluxo de Compartilhamento
```
1. Usuário A cria dashboard
2. Usuário A clica em "Compartilhar"
3. Sistema gera código único e link
4. Usuário B recebe link
5. Usuário B acessa /shared/:code (preview público)
6. Se não autenticado: localStorage guarda código pendente
7. Usuário B faz login/cadastro
8. AuthContext detecta código pendente e aceita automaticamente
9. Dashboard aparece em "Compartilhados Comigo"
10. Usuário B tem acesso conforme permissão (VIEWER/EDITOR)
```

#### Fluxo de Autenticação JWT
```
1. Login → Backend gera accessToken + refreshToken
2. Frontend armazena em localStorage
3. Toda requisição: Axios adiciona "Authorization: Bearer <token>"
4. Middleware valida JWT
5. Se válido: req.user = { userId, email }
6. Se inválido (401): Interceptor tenta renovar com refreshToken
7. Se renovação OK: repete requisição original
8. Se falha: redireciona para /login
```

### Segurança

- ✅ Senhas com **bcrypt** (10 rounds)
- ✅ JWT com expiração: 7 dias (access) / 30 dias (refresh)
- ✅ Tokens de reset com expiração de 1 hora
- ✅ CORS configurado
- ✅ Helmet para security headers
- ✅ Validação com Zod
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection (React escape)

### Performance

- ⚡ **Bun runtime**: até 3x mais rápido que Node
- ⚡ **React Query**: cache inteligente e invalidação
- ⚡ **Code splitting**: páginas carregadas sob demanda
- ⚡ **Lazy loading**: componentes pesados carregados quando necessário
- ⚡ **Memoization**: React.memo e useMemo para evitar re-renders

---

## 🐳 Docker

Execute a aplicação completa com Docker e Docker Compose:

```bash
# 1. Copiar arquivo de configuração
cp .env.docker.example .env

# 2. Configurar variáveis (DB_PASSWORD, JWT_SECRET)
nano .env

# 3. Iniciar aplicação + PostgreSQL
docker-compose up -d

# 4. Acessar
# Frontend: http://localhost:5000
# API: http://localhost:5000/api
```

**Documentação completa**: [README_DOCKER.md](./README_DOCKER.md)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'feat: adiciona funcionalidade X'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

**Convenção de commits**: Seguimos [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

## 👨‍💻 Autor

Desenvolvido com 💜 por **Kronn**

- Frontend: React + TypeScript + Material-UI
- Backend: Bun + Express + Prisma
- Database: PostgreSQL

---

## 🌟 Próximos Passos

- [ ] Dashboard analytics avançado
- [ ] Exportar gráficos como imagem
- [ ] Categorias customizáveis por usuário
- [ ] Notificações por email
- [ ] App mobile (React Native)
- [ ] Importação de extrato bancário (OFX)
- [ ] Metas financeiras e alertas
- [ ] Modo offline (PWA)

---

**🚀 Pronto para transformar sua gestão financeira!**

Para começar, veja o guia de instalação em **[SETUP.md](SETUP.md)**
