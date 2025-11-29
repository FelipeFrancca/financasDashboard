import { describe, test, expect } from "bun:test";
import {
    AppError,
    ValidationError,
    AuthenticationError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    InternalServerError,
    DatabaseError
} from "./AppError";

describe("AppError", () => {
    test("deve criar erro com valores padrão", () => {
        const error = new AppError("Test error");
        expect(error.message).toBe("Test error");
        expect(error.statusCode).toBe(500);
        expect(error.isOperational).toBe(true);
        expect(error.code).toBeUndefined();
        expect(error.details).toBeUndefined();
    });

    test("deve criar erro com todos os parâmetros", () => {
        const error = new AppError(
            "Custom error",
            400,
            false,
            "CUSTOM_CODE",
            { field: "value" }
        );

        expect(error.message).toBe("Custom error");
        expect(error.statusCode).toBe(400);
        expect(error.isOperational).toBe(false);
        expect(error.code).toBe("CUSTOM_CODE");
        expect(error.details).toEqual({ field: "value" });
    });

    test("deve converter para JSON corretamente", () => {
        const error = new AppError("Test", 404, true, "NOT_FOUND");
        const json = error.toJSON();

        expect(json).toEqual({
            error: {
                message: "Test",
                code: "NOT_FOUND",
                statusCode: 404,
                details: undefined,
            },
        });
    });

    test("deve manter stack trace", () => {
        const error = new AppError("Test");
        expect(error.stack).toBeDefined();
    });
});

describe("ValidationError", () => {
    test("deve criar erro com status 400", () => {
        const error = new ValidationError("Validation failed");

        expect(error.statusCode).toBe(400);
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.isOperational).toBe(true);
    });

    test("deve incluir detalhes de validação", () => {
        const details = [
            { field: "email", message: "Email inválido" },
            { field: "password", message: "Senha muito curta" },
        ];
        const error = new ValidationError("Dados inválidos", details);

        expect(error.details).toEqual(details);
    });
});

describe("AuthenticationError", () => {
    test("deve criar erro com status 401", () => {
        const error = new AuthenticationError();

        expect(error.statusCode).toBe(401);
        expect(error.code).toBe("AUTHENTICATION_ERROR");
        expect(error.message).toBe("Não autorizado");
    });

    test("deve aceitar mensagem customizada", () => {
        const error = new AuthenticationError("Token inválido");
        expect(error.message).toBe("Token inválido");
    });
});

describe("ForbiddenError", () => {
    test("deve criar erro com status 403", () => {
        const error = new ForbiddenError();

        expect(error.statusCode).toBe(403);
        expect(error.code).toBe("FORBIDDEN_ERROR");
        expect(error.message).toBe("Acesso negado");
    });

    test("deve aceitar mensagem customizada", () => {
        const error = new ForbiddenError("Sem permissão");
        expect(error.message).toBe("Sem permissão");
    });
});

describe("NotFoundError", () => {
    test("deve criar erro com status 404", () => {
        const error = new NotFoundError();

        expect(error.statusCode).toBe(404);
        expect(error.code).toBe("NOT_FOUND_ERROR");
        expect(error.message).toBe("Recurso não encontrado");
    });

    test("deve aceitar nome do recurso", () => {
        const error = new NotFoundError("Usuário");
        expect(error.message).toBe("Usuário não encontrado");
    });
});

describe("ConflictError", () => {
    test("deve criar erro com status 409", () => {
        const error = new ConflictError("Email já existe");

        expect(error.statusCode).toBe(409);
        expect(error.code).toBe("CONFLICT_ERROR");
        expect(error.message).toBe("Email já existe");
    });

    test("deve incluir detalhes", () => {
        const details = { email: "test@example.com" };
        const error = new ConflictError("Conflito", details);

        expect(error.details).toEqual(details);
    });
});

describe("RateLimitError", () => {
    test("deve criar erro com status 429", () => {
        const error = new RateLimitError();

        expect(error.statusCode).toBe(429);
        expect(error.code).toBe("RATE_LIMIT_ERROR");
        expect(error.message).toContain("Muitas requisições");
    });
});

describe("InternalServerError", () => {
    test("deve criar erro com status 500", () => {
        const error = new InternalServerError();

        expect(error.statusCode).toBe(500);
        expect(error.code).toBe("INTERNAL_SERVER_ERROR");
        expect(error.isOperational).toBe(false);
    });

    test("deve usar mensagem padrão", () => {
        const error = new InternalServerError();
        expect(error.message).toBe("Erro interno do servidor");
    });
});

describe("DatabaseError", () => {
    test("deve criar erro com status 500", () => {
        const error = new DatabaseError();

        expect(error.statusCode).toBe(500);
        expect(error.code).toBe("DATABASE_ERROR");
        expect(error.isOperational).toBe(false);
    });

    test("deve incluir detalhes do erro", () => {
        const details = { query: "SELECT * FROM users" };
        const error = new DatabaseError("Query failed", details);

        expect(error.message).toBe("Query failed");
        expect(error.details).toEqual(details);
    });
});
