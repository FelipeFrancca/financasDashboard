/**
 * Helpers e utilitários para testes
 */

import { PrismaClient } from "@prisma/client";

/**
 * Mock do PrismaClient para testes
 */
export const createMockPrismaClient = () => {
    const mockClient = {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        transaction: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        dashboard: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        dashboardMember: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        dashboardInvite: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        $queryRaw: jest.fn(),
        $disconnect: jest.fn(),
    };

    return mockClient as unknown as PrismaClient;
};

/**
 * Mock de usuário para testes
 */
export const mockUser = {
    id: "test-user-id-123",
    email: "test@example.com",
    name: "Test User",
    password: "$2a$10$hashedpassword",
    googleId: null,
    avatar: null,
    emailVerified: true,
    verificationToken: null,
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
};

/**
 * Mock de transação para testes
 */
export const mockTransaction = {
    id: "test-transaction-id-123",
    userId: "test-user-id-123",
    date: new Date("2025-01-15"),
    entryType: "Despesa",
    flowType: "Fixa",
    category: "Alimentação",
    subcategory: "Supermercado",
    description: "Compras do mês",
    amount: 500.00,
    paymentMethod: "Cartão de Crédito",
    institution: "Banco XYZ",
    cardBrand: "Visa",
    installmentTotal: 1,
    installmentNumber: 1,
    installmentStatus: "Paga",
    notes: null,
    isTemporary: false,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
};

/**
 * Mock de dashboard para testes
 */
export const mockDashboard = {
    id: "test-dashboard-id-123",
    title: "Dashboard de Testes",
    description: "Dashboard para testes automatizados",
    ownerId: "test-user-id-123",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
};

/**
 * Limpa todos os mocks
 */
export const clearAllMocks = () => {
    jest.clearAllMocks();
};

/**
 * Aguarda tempo (helper para testes assíncronos)
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gera string aleatória
 */
export const randomString = (length: number = 10): string => {
    return Math.random().toString(36).substring(2, length + 2);
};

/**
 * Gera email aleatório
 */
export const randomEmail = (): string => {
    return `test-${randomString()}@example.com`;
};

/**
 * Cria mock de Request do Express
 */
export const mockRequest = (overrides: any = {}) => {
    return {
        body: {},
        query: {},
        params: {},
        headers: {},
        user: null,
        ip: "127.0.0.1",
        path: "/test",
        method: "GET",
        ...overrides,
    };
};

/**
 * Cria mock de Response do Express
 */
export const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
};

/**
 * Cria mock de NextFunction do Express
 */
export const mockNext = () => jest.fn();

/**
 * Mock de JWT Token válido
 */
export const mockValidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQtMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.signature";

/**
 * Mock de JWT Token expirado
 */
export const mockExpiredToken = "expired-token";

/**
 * Expectativa de erro customizado
 */
export const expectAppError = (error: any, statusCode: number, code?: string) => {
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(statusCode);
    if (code) {
        expect(error.code).toBe(code);
    }
};
