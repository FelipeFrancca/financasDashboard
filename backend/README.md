# 🔧 API - Estrutura e Melhorias

## 📁 Nova Estrutura de Diretórios

```
backend/src/
├── index.ts                      # Entrada principal da aplicação
├── middleware/
│   ├── auth.ts                   # Autenticação JWT (melhorado)
│   ├── errorHandler.ts           # ✨ NOVO: Tratamento centralizado de erros
│   ├── rateLimiter.ts            # ✨ NOVO: Proteção contra abuso
│   ├── requestLogger.ts          # ✨ NOVO: Log automático de requisições
│   └── validation.ts             # ✨ NOVO: Helpers de validação Zod
├── routes/
│   ├── auth.ts                   # Rotas de autenticação
│   ├── transactions.ts           # Rotas de transações
│   ├── dashboards.ts             # Rotas de dashboards
│   └── EXAMPLE_ROUTE_PATTERN.ts  # ✨ NOVO: Exemplo de uso dos novos recursos
├── services/
│   ├── authService.ts            # Lógica de autenticação
│   ├── transactionService.ts     # Lógica de transações
│   └── dashboardService.ts       # Lógica de dashboards
├── validators/                   # ✨ NOVO: Validação com Zod
│   ├── authValidator.ts          # Schemas de auth
│   ├── transactionValidator.ts   # Schemas de transactions
│   └── dashboardValidator.ts     # Schemas de dashboards
├── utils/                        # ✨ NOVO: Utilitários
│   ├── AppError.ts               # Classes de erro customizadas
│   └── logger.ts                 # Sistema de logging
├── types/
│   └── index.ts                  # Tipos TypeScript
└── prisma/
    └── schema.prisma             # Schema do banco de dados
```

---

## 🎯 Principais Melhorias Implementadas

### 1. Sistema de Erros Customizados (`utils/AppError.ts`)

**Classes disponíveis:**
- `AppError` - Erro base
- `ValidationError` - Erros de validação (400)
- `AuthenticationError` - Não autenticado (401)
- `ForbiddenError` - Sem permissão (403)
- `NotFoundError` - Recurso não encontrado (404)
- `ConflictError` - Conflito de dados (409)
- `RateLimitError` - Limite excedido (429)
- `InternalServerError` - Erro interno (500)
- `DatabaseError` - Erro de banco de dados (500)

**Uso:**
```typescript
import { NotFoundError, ValidationError } from '../utils/AppError';

// Em um service
if (!user) {
  throw new NotFoundError('Usuário');
}

if (amount < 0) {
  throw new ValidationError('Valor deve ser positivo', { field: 'amount' });
}
```

### 2. Sistema de Logging (`utils/logger.ts`)

**Níveis:**
- `error` - Erros críticos (salvos em arquivo)
- `warn` - Avisos importantes
- `info` - Informações gerais
- `http` - Requisições HTTP (automático)
- `debug` - Apenas em desenvolvimento

**Uso:**
```typescript
import { logger } from '../utils/logger';

logger.info('Usuário criado', 'AuthService', { userId: user.id });
logger.error('Falha ao conectar ao banco', error, 'Database');
logger.warn('Tentativa de acesso não autorizado', 'Auth', { ip: req.ip });
```

**Arquivos de log:**
- `logs/error-YYYY-MM-DD.log`
- `logs/warn-YYYY-MM-DD.log`
- Rotação automática (remove logs > 7 dias)

### 3. Middleware de Erro Central (`middleware/errorHandler.ts`)

**Funcionalidades:**
- Captura TODOS os erros da aplicação
- Converte erros Zod em ValidationError
- Converte erros Prisma em erros apropriados
- Log automático de erros
- Respostas padronizadas
- Oculta detalhes sensíveis em produção

**Setup global:**
```typescript
import { setupGlobalErrorHandlers } from './middleware/errorHandler';

// No index.ts
setupGlobalErrorHandlers(); // Captura uncaught exceptions, etc
```

**asyncHandler:**
```typescript
import { asyncHandler } from '../middleware/errorHandler';

router.get('/example', authenticateToken, asyncHandler(async (req, res) => {
  // Qualquer erro aqui é automaticamente capturado e tratado
  const data = await someAsyncOperation();
  res.json(data);
}));
```

### 4. Rate Limiting (`middleware/rateLimiter.ts`)

**Presets disponíveis:**

```typescript
import { 
  generalLimiter,      // 100 req / 15 min (padrão)
  authLimiter,         // 5 req / 15 min (login)
  strictLimiter,       // 10 req / hora
  bulkOperationLimiter // 3 req / minuto
} from '../middleware/rateLimiter';

// Uso
router.post('/login', authLimiter, loginHandler);
router.post('/bulk', bulkOperationLimiter, bulkCreateHandler);
```

**Headers de resposta:**
- `X-RateLimit-Limit` - Limite total
- `X-RateLimit-Remaining` - Requisições restantes
- `X-RateLimit-Reset` - Quando reseta
- `Retry-After` - Segundos até poder tentar novamente (se limite excedido)

### 5. Request Logging (`middleware/requestLogger.ts`)

**Automático:** Loga todas as requisições

```typescript
// No index.ts
import { requestLogger, slowRequestLogger } from './middleware/requestLogger';

app.use(requestLogger);
app.use(slowRequestLogger(1000)); // Alerta se > 1 segundo
```

**O que é logado:**
- Método, URL, status code
- Duração da requisição
- IP, User Agent
- User ID (se autenticado)
- Tamanho da resposta

### 6. Validação com Zod (`validators/*`)

**Schemas por módulo:**
- `authValidator.ts` - Registro, login, senha, etc
- `transactionValidator.ts` - CRUD de transações, filtros, bulk
- `dashboardValidator.ts` - Dashboards, convites, membros

**Uso:**
```typescript
import { validateBody, validateQuery } from '../middleware/validation';
import { createTransactionSchema } from '../validators/transactionValidator';

router.post(
  '/transactions',
  authenticateToken,
  validateBody(createTransactionSchema), // Valida e transforma
  async (req, res) => {
    // req.body já está validado e tipado!
    const transaction = await createTransaction(req.body);
    res.json(transaction);
  }
);
```

**Benefícios:**
- Validação automática
- Mensagens de erro em português
- Transformação de dados (coerce, trim, lowercase)
- Type safety com TypeScript
- Regras de negócio (startDate <= endDate, etc)

### 7. Middleware de Auth Melhorado

**Antes:**
```typescript
res.status(401).json({ error: "Token não fornecido" });
```

**Agora:**
```typescript
throw new AuthenticationError("Token de autenticação não fornecido");
// Tratado automaticamente pelo errorHandler
// Logado automaticamente
// Resposta padronizada
```

---

## 🚀 Como Usar Tudo Junto

### Exemplo de Rota Completa

```typescript
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { validateBody, validateParams, idParamSchema } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { strictLimiter } from "../middleware/rateLimiter";
import { createUserSchema } from "../validators/userValidator";
import { NotFoundError } from "../utils/AppError";
import { logger } from "../utils/logger";
import * as userService from "../services/userService";

const router = Router();

router.post(
  "/users",
  authenticateToken,              // 1. Verifica autenticação
  strictLimiter,                  // 2. Aplica rate limit
  validateBody(createUserSchema), // 3. Valida e transforma dados
  asyncHandler(async (req, res) => {  // 4. Captura erros async
    const userId = req.user.userId;
    const data = req.body; // Já validado!

    logger.info("Creating user", "UserRoute", { userId });

    const user = await userService.createUser(data);

    res.status(201).json({
      success: true,
      data: user,
      message: "Usuário criado com sucesso"
    });
  })
);

router.get(
  "/users/:id",
  authenticateToken,
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userService.getUser(id);
    
    if (!user) {
      throw new NotFoundError("Usuário"); // Tratado automaticamente!
    }

    res.json({
      success: true,
      data: user
    });
  })
);

export default router;
```

### Exemplo de Service

```typescript
import { PrismaClient } from "@prisma/client";
import { NotFoundError, ConflictError } from "../utils/AppError";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export async function createUser(data: CreateUserInput) {
  try {
    // Verifica se já existe
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      throw new ConflictError("Email já cadastrado", { email: data.email });
    }

    const user = await prisma.user.create({
      data,
    });

    logger.info("User created successfully", "UserService", { userId: user.id });

    return user;
  } catch (error) {
    // Se for AppError, só repassa
    if (error instanceof AppError) {
      throw error;
    }

    // Se for erro inesperado, loga e lança InternalServerError
    logger.error("Failed to create user", error as Error, "UserService", { data });
    throw new InternalServerError("Erro ao criar usuário");
  }
}
```

---

## 📊 Padrões de Resposta

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação bem-sucedida" // Opcional
}
```

### Erro (4xx/5xx)
```json
{
  "error": {
    "message": "Descrição do erro",
    "code": "ERROR_CODE",
    "details": { ... } // Opcional
  }
}
```

### Erro de Validação
```json
{
  "error": {
    "message": "Erro de validação nos dados enviados",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Email inválido"
      },
      {
        "field": "password",
        "message": "Senha deve ter no mínimo 8 caracteres"
      }
    ]
  }
}
```

---

## 🔍 Health Check Avançado

Agora o `/health` retorna informações detalhadas:

```json
{
  "status": "OK",
  "timestamp": "2025-11-28T21:30:00.000Z",
  "environment": "development",
  "uptime": "5m 30s",
  "memory": {
    "rss": "150MB",
    "heapUsed": "80MB",
    "heapTotal": "120MB"
  },
  "database": "connected",
  "version": "1.0.0"
}
```

---

## 📝 Checklist para Refatorar Rotas Antigas

Ao atualizar rotas existentes:

- [ ] Substituir try-catch por `asyncHandler`
- [ ] Adicionar validadores (validateBody, validateQuery, validateParams)
- [ ] Usar classes de erro customizadas (throw new NotFoundError(...))
- [ ] Adicionar logging apropriado (logger.info, logger.error)
- [ ] Adicionar rate limiting se necessário
- [ ] Padronizar respostas ({ success: true, data: ... })
- [ ] Remover res.status().json() de erros (deixar errorHandler tratar)
- [ ] Testar se a validação está funcionando

---

## 🎓 Referências

- Ver `EXAMPLE_ROUTE_PATTERN.ts` para exemplos práticos
- Ver `PLANO_DE_MELHORIAS.md` para roadmap completo
- Ver `PROGRESSO_FASE1.md` para status atual

---

**Criado:** 2025-11-28  
**Última atualização:** 2025-11-28 21:30
