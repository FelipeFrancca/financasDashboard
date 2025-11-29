import { describe, test, expect } from "bun:test";
import {
    createTransactionSchema,
    updateTransactionSchema,
    transactionQuerySchema,
    bulkCreateTransactionSchema
} from "./transactionValidator";

describe("transactionValidator - createTransactionSchema", () => {
    const validTransaction = {
        date: new Date(),
        entryType: "Receita",
        flowType: "Fixa",
        category: "Alimentação",
        description: "Compras do mês",
        amount: 500.00,
    };

    test("deve validar transação correta", () => {
        const result = createTransactionSchema.safeParse(validTransaction);
        expect(result.success).toBe(true);
    });

    test("deve converter string de data para Date", () => {
        const result = createTransactionSchema.safeParse({
            ...validTransaction,
            date: "2025-01-01"
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.date).toBeInstanceOf(Date);
        }
    });

    test("deve aceitar apenas campos obrigatórios", () => {
        const minimal = {
            date: new Date(),
            entryType: "Receita",
            flowType: "Variável",
            category: "Salário",
            description: "Pagamento mensal",
            amount: 5000,
        };

        const result = createTransactionSchema.safeParse(minimal);
        expect(result.success).toBe(true);
    });

    test("deve aceitar campos opcionais", () => {
        const complete = {
            ...validTransaction,
            subcategory: "Supermercado",
            paymentMethod: "Cartão de Crédito",
            institution: "Banco XYZ",
            cardBrand: "Visa",
            installmentTotal: 3,
            installmentNumber: 1,
            installmentStatus: "Paga",
            notes: "Parcela 1 de 3",
            isTemporary: false,
            dashboardId: "dashboard-123",
        };

        const result = createTransactionSchema.safeParse(complete);
        expect(result.success).toBe(true);
    });

    test("deve falhar com tipo de entrada inválido", () => {
        const invalid = {
            ...validTransaction,
            entryType: "TipoInvalido",
        };

        const result = createTransactionSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    test("deve falhar com tipo de fluxo inválido", () => {
        const invalid = {
            ...validTransaction,
            flowType: "FluxoInválido",
        };

        const result = createTransactionSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    test("deve falhar com valor negativo", () => {
        const invalid = {
            ...validTransaction,
            amount: -100,
        };

        const result = createTransactionSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    test("deve falhar com valor zero", () => {
        // Zod positive() não aceita zero
        const invalid = {
            ...validTransaction,
            amount: 0,
        };

        const result = createTransactionSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    test("deve falhar sem data", () => {
        const invalid = {
            entryType: "Despesa",
            flowType: "Fixa",
            category: "Test",
            description: "Test",
            amount: 100,
        };

        const result = createTransactionSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    test("deve aplicar valores padrão", () => {
        const result = createTransactionSchema.safeParse(validTransaction);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.installmentTotal).toBe(0);
            expect(result.data.installmentNumber).toBe(0);
            expect(result.data.installmentStatus).toBe("N/A");
            expect(result.data.isTemporary).toBe(false);
        }
    });
});

describe("transactionValidator - updateTransactionSchema", () => {
    test("deve permitir atualização parcial", () => {
        const partial = {
            amount: 600,
        };

        const result = updateTransactionSchema.safeParse(partial);
        expect(result.success).toBe(true);
    });

    test("deve permitir atualizar múltiplos campos", () => {
        const partial = {
            amount: 600,
            description: "Descrição atualizada",
            category: "Nova Categoria",
        };

        const result = updateTransactionSchema.safeParse(partial);
        expect(result.success).toBe(true);
    });

    test("deve validar campos mesmo em update parcial", () => {
        const invalid = {
            amount: -100, // Valor negativo inválido
        };

        const result = updateTransactionSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });
});

describe("transactionValidator - transactionQuerySchema", () => {
    test("deve validar query sem filtros", () => {
        const query = {};

        const result = transactionQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.page).toBe(1);
            expect(result.data.limit).toBe(50);
            expect(result.data.sortBy).toBe("date");
            expect(result.data.sortOrder).toBe("desc");
        }
    });

    test("deve validar query com filtros", () => {
        const query = {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            entryType: "Despesa",
            category: "Alimentação",
            page: "2",
            limit: "20",
        };

        const result = transactionQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.startDate).toBeInstanceOf(Date);
            expect(result.data.endDate).toBeInstanceOf(Date);
            expect(result.data.page).toBe(2);
            expect(result.data.limit).toBe(20);
        }
    });

    test("deve converter strings para números (coerce)", () => {
        const query = {
            page: "5",
            limit: "100",
            minAmount: "100.50",
            maxAmount: "500.75",
        };

        const result = transactionQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.page).toBe(5);
            expect(result.data.limit).toBe(100);
            expect(result.data.minAmount).toBe(100.50);
            expect(result.data.maxAmount).toBe(500.75);
        }
    });

    test("deve falhar se startDate > endDate", () => {
        const query = {
            startDate: "2025-01-31",
            endDate: "2025-01-01",
        };

        const result = transactionQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.errors[0].message).toContain("posterior");
        }
    });

    test("deve falhar se minAmount > maxAmount", () => {
        const query = {
            minAmount: "1000",
            maxAmount: "500",
        };

        const result = transactionQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.errors[0].message).toContain("maior");
        }
    });

    test("deve limitar limit máximo a 100", () => {
        const query = {
            limit: "150",
        };

        const result = transactionQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
    });
});

describe("transactionValidator - bulkCreateTransactionSchema", () => {
    const validTransaction = {
        date: new Date(),
        entryType: "Despesa",
        flowType: "Fixa",
        category: "Test",
        description: "Test",
        amount: 100,
    };

    test("deve validar array de transações", () => {
        const bulk = [validTransaction, { ...validTransaction }];

        const result = bulkCreateTransactionSchema.safeParse(bulk);
        expect(result.success).toBe(true);
    });

    test("deve falhar com array vazio", () => {
        const bulk: any[] = [];

        const result = bulkCreateTransactionSchema.safeParse(bulk);
        expect(result.success).toBe(false);
    });

    test("deve falhar com mais de 100 transações", () => {
        const bulk = Array(101).fill(validTransaction);

        const result = bulkCreateTransactionSchema.safeParse(bulk);
        expect(result.success).toBe(false);
    });

    test("deve validar cada transação no array", () => {
        const bulk = [
            validTransaction,
            { ...validTransaction, amount: -100 }, // Inválido
        ];

        const result = bulkCreateTransactionSchema.safeParse(bulk);
        expect(result.success).toBe(false);
    });
});
