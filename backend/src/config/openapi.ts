/**
 * Configuração completa do OpenAPI/Swagger
 */

export const openApiConfig = {
    openapi: "3.0.0",
    info: {
        title: "Finanças Dashboard API",
        version: "1.0.0",
        description: `
API REST completa para gerenciamento de finanças pessoais.

## Funcionalidades
- Autenticação com JWT e Google OAuth
- Gerenciamento de transações financeiras
- Compartilhamento de dashboards
- Estatísticas e relatórios

## Rate Limiting
- Geral: 100 requisições / 15 minutos
- Autenticação: 5 requisições / 15 minutos  
- Operações em massa: 3 requisições / minuto

## Autenticação
A maioria dos endpoints requer autenticação via Bearer Token (JWT).
Use o endpoint \`/api/auth/login\` para obter o token.
    `,
        contact: {
            name: "API Support",
            email: "support@example.com",
        },
        license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT",
        },
    },
    servers: [
        {
            url: "http://localhost:3001",
            description: "Servidor de Desenvolvimento",
        },
        {
            url: "http://localhost:3001",
            description: "Servidor de Produção (configurar antes do deploy)",
        },
    ],
    tags: [
        {
            name: "Auth",
            description: "Operações de autenticação e gerenciamento de usuários",
        },
        {
            name: "Transactions",
            description: "Operações relacionadas a transações financeiras (CRUD, estatísticas)",
        },
        {
            name: "Dashboards",
            description: "Gerenciamento de dashboards e compartilhamento",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "JWT token obtido através do login",
            },
        },
        schemas: {
            // Error Schemas
            Error: {
                type: "object",
                properties: {
                    error: {
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                description: "Mensagem de erro",
                            },
                            code: {
                                type: "string",
                                description: "Código do erro",
                            },
                            details: {
                                type: "object",
                                description: "Detalhes adicionais do erro",
                            },
                        },
                    },
                },
            },
            ValidationError: {
                type: "object",
                properties: {
                    error: {
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                example: "Erro de validação nos dados enviados",
                            },
                            code: {
                                type: "string",
                                example: "VALIDATION_ERROR",
                            },
                            details: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        field: {
                                            type: "string",
                                        },
                                        message: {
                                            type: "string",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            // Success Response
            SuccessResponse: {
                type: "object",
                properties: {
                    success: {
                        type: "boolean",
                        example: true,
                    },
                    message: {
                        type: "string",
                    },
                    data: {
                        type: "object",
                    },
                },
            },
            // User Schema
            User: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        description: "ID único do usuário",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        description: "Email do usuário",
                    },
                    name: {
                        type: "string",
                        description: "Nome do usuário",
                    },
                    avatar: {
                        type: "string",
                        format: "uri",
                        description: "URL do avatar",
                    },
                    emailVerified: {
                        type: "boolean",
                        description: "Se o email foi verificado",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },
            // Auth Schemas
            RegisterRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: {
                        type: "string",
                        format: "email",
                        example: "usuario@example.com",
                    },
                    password: {
                        type: "string",
                        minLength: 8,
                        example: "SenhaSegura123",
                        description: "Mínimo 8 caracteres, incluindo maiúscula, minúscula e número",
                    },
                    name: {
                        type: "string",
                        example: "João Silva",
                    },
                },
            },
            LoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: {
                        type: "string",
                        format: "email",
                    },
                    password: {
                        type: "string",
                    },
                },
            },
            AuthResponse: {
                type: "object",
                properties: {
                    success: {
                        type: "boolean",
                        example: true,
                    },
                    data: {
                        type: "object",
                        properties: {
                            accessToken: {
                                type: "string",
                                description: "JWT access token",
                            },
                            refreshToken: {
                                type: "string",
                                description: "JWT refresh token",
                            },
                            user: {
                                $ref: "#/components/schemas/User",
                            },
                        },
                    },
                },
            },
            // Transaction Schema
            Transaction: {
                type: "object",
                required: ["date", "entryType", "flowType", "category", "description", "amount"],
                properties: {
                    id: {
                        type: "string",
                        description: "ID único da transação",
                    },
                    date: {
                        type: "string",
                        format: "date",
                        example: "2025-01-15",
                    },
                    entryType: {
                        type: "string",
                        enum: ["Receita", "Despesa"],
                        description: "Tipo de lançamento",
                    },
                    flowType: {
                        type: "string",
                        enum: ["Fixa", "Variável"],
                        description: "Tipo de fluxo",
                    },
                    category: {
                        type: "string",
                        example: "Alimentação",
                    },
                    subcategory: {
                        type: "string",
                        example: "Supermercado",
                    },
                    description: {
                        type: "string",
                        example: "Compras do mês",
                    },
                    amount: {
                        type: "number",
                        format: "double",
                        minimum: 0.01,
                        example: 500.00,
                    },
                    paymentMethod: {
                        type: "string",
                        example: "Cartão de Crédito",
                    },
                    institution: {
                        type: "string",
                        example: "Banco XYZ",
                    },
                    cardBrand: {
                        type: "string",
                        example: "Visa",
                    },
                    installmentTotal: {
                        type: "integer",
                        minimum: 0,
                        default: 0,
                    },
                    installmentNumber: {
                        type: "integer",
                        minimum: 0,
                        default: 0,
                    },
                    installmentStatus: {
                        type: "string",
                        enum: ["N/A", "Paga", "Pendente"],
                        default: "N/A",
                    },
                    notes: {
                        type: "string",
                    },
                    isTemporary: {
                        type: "boolean",
                        default: false,
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },
            TransactionList: {
                type: "object",
                properties: {
                    success: {
                        type: "boolean",
                        example: true,
                    },
                    data: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Transaction",
                        },
                    },
                    count: {
                        type: "integer",
                    },
                },
            },
            // Stats Schema
            TransactionStats: {
                type: "object",
                properties: {
                    success: {
                        type: "boolean",
                        example: true,
                    },
                    data: {
                        type: "object",
                        properties: {
                            totalIncome: {
                                type: "number",
                                description: "Total de receitas",
                            },
                            totalExpense: {
                                type: "number",
                                description: "Total de despesas",
                            },
                            netResult: {
                                type: "number",
                                description: "Resultado líquido (receitas - despesas)",
                            },
                            savingsRate: {
                                type: "number",
                                description: "Taxa de economia (%)",
                            },
                            transactionCount: {
                                type: "integer",
                                description: "Número de transações",
                            },
                        },
                    },
                },
            },
        },
        responses: {
            UnauthorizedError: {
                description: "Token de autenticação não fornecido ou inválido",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/Error",
                        },
                        example: {
                            error: {
                                message: "Token de autenticação não fornecido",
                                code: "AUTHENTICATION_ERROR",
                            },
                        },
                    },
                },
            },
            ForbiddenError: {
                description: "Acesso negado",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/Error",
                        },
                        example: {
                            error: {
                                message: "Token inválido ou expirado",
                                code: "FORBIDDEN_ERROR",
                            },
                        },
                    },
                },
            },
            NotFoundError: {
                description: "Recurso não encontrado",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/Error",
                        },
                        example: {
                            error: {
                                message: "Transação não encontrada",
                                code: "NOT_FOUND_ERROR",
                            },
                        },
                    },
                },
            },
            ValidationError: {
                description: "Erro de validação nos dados enviados",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/ValidationError",
                        },
                    },
                },
            },
            RateLimitError: {
                description: "Limite de requisições excedido",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/Error",
                        },
                        example: {
                            error: {
                                message: "Muitas requisições. Tente novamente mais tarde",
                                code: "RATE_LIMIT_ERROR",
                            },
                        },
                    },
                },
            },
            InternalServerError: {
                description: "Erro interno do servidor",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/Error",
                        },
                        example: {
                            error: {
                                message: "Erro interno do servidor",
                                code: "INTERNAL_SERVER_ERROR",
                            },
                        },
                    },
                },
            },
        },
    },
};
