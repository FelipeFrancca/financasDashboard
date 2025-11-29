import { describe, test, expect } from "bun:test";
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema,
    updateProfileSchema,
    changePasswordSchema
} from "./authValidator";

describe("authValidator - registerSchema", () => {
    test("deve validar registro correto", () => {
        const validData = {
            email: "test@example.com",
            password: "Password123",
            name: "Test User",
        };

        const result = registerSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.email).toBe("test@example.com");
            expect(result.data.name).toBe("Test User");
        }
    });

    test("deve converter email para lowercase", () => {
        const data = {
            email: "TEST@EXAMPLE.COM",
            password: "Password123",
        };

        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.email).toBe("test@example.com");
        }
    });

    test("deve falhar com email inválido", () => {
        const invalidData = {
            email: "not-an-email",
            password: "Password123",
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.errors[0].message).toContain("inválido");
        }
    });

    test("deve falhar com senha curta", () => {
        const invalidData = {
            email: "test@example.com",
            password: "Short1",
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.errors[0].message).toContain("8 caracteres");
        }
    });

    test("deve falhar com senha sem maiúscula", () => {
        const invalidData = {
            email: "test@example.com",
            password: "password123",
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    test("deve falhar com senha sem número", () => {
        const invalidData = {
            email: "test@example.com",
            password: "PasswordOnly",
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    test("deve aceitar registro sem nome", () => {
        const data = {
            email: "test@example.com",
            password: "Password123",
        };

        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(true);
    });
});

describe("authValidator - loginSchema", () => {
    test("deve validar login correto", () => {
        const validData = {
            email: "test@example.com",
            password: "anypassword",
        };

        const result = loginSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    test("deve falhar sem email", () => {
        const invalidData = {
            password: "password",
        };

        const result = loginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    test("deve falhar sem senha", () => {
        const invalidData = {
            email: "test@example.com",
        };

        const result = loginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});

describe("authValidator - forgotPasswordSchema", () => {
    test("deve validar email correto", () => {
        const validData = {
            email: "test@example.com",
        };

        const result = forgotPasswordSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    test("deve falhar com email inválido", () => {
        const invalidData = {
            email: "not-an-email",
        };

        const result = forgotPasswordSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});

describe("authValidator - resetPasswordSchema", () => {
    test("deve validar reset correto", () => {
        const validData = {
            token: "valid-token-123",
            password: "NewPassword123",
        };

        const result = resetPasswordSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    test("deve falhar sem token", () => {
        const invalidData = {
            password: "NewPassword123",
        };

        const result = resetPasswordSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    test("deve falhar com senha fraca", () => {
        const invalidData = {
            token: "valid-token",
            password: "weak",
        };

        const result = resetPasswordSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});

describe("authValidator - refreshTokenSchema", () => {
    test("deve validar refresh token", () => {
        const validData = {
            refreshToken: "valid-refresh-token",
        };

        const result = refreshTokenSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    test("deve falhar sem refresh token", () => {
        const invalidData = {};

        const result = refreshTokenSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});

describe("authValidator - updateProfileSchema", () => {
    test("deve validar atualização de perfil", () => {
        const validData = {
            name: "Updated Name",
            avatar: "https://example.com/avatar.jpg",
        };

        const result = updateProfileSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    test("deve aceitar apenas nome", () => {
        const validData = {
            name: "Only Name",
        };

        const result = updateProfileSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    test("deve falhar com avatar inválido", () => {
        const invalidData = {
            avatar: "not-a-url",
        };

        const result = updateProfileSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});

describe("authValidator - changePasswordSchema", () => {
    test("deve validar mudança de senha", () => {
        const validData = {
            currentPassword: "OldPassword123",
            newPassword: "NewPassword456",
        };

        const result = changePasswordSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    test("deve falhar sem senha atual", () => {
        const invalidData = {
            newPassword: "NewPassword123",
        };

        const result = changePasswordSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    test("deve falhar com nova senha fraca", () => {
        const invalidData = {
            currentPassword: "OldPassword123",
            newPassword: "weak",
        };

        const result = changePasswordSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});
