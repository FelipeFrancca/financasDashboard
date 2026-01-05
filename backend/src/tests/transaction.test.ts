/**
 * Testes para o serviço de transações (transacoesServico)
 * Testa validações de entrada, sanitização e segurança
 */

import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { ValidationError } from '../utils/AppError';

describe('Sanitização de Strings', () => {
    // Função de sanitização igual à implementada
    const sanitizeString = (input: string | null | undefined, maxLength: number = 500): string => {
        if (!input) return '';
        const cleaned = input
            .replace(/<[^>]*>/g, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();
        return cleaned.substring(0, maxLength);
    };

    test('deve remover tags HTML', () => {
        const input = '<script>alert("xss")</script>Texto seguro';
        const result = sanitizeString(input);
        expect(result).toBe('alert("xss")Texto seguro');
        expect(result).not.toContain('<script>');
    });

    test('deve remover múltiplas tags HTML', () => {
        const input = '<div><p>Parágrafo</p></div>';
        const result = sanitizeString(input);
        expect(result).toBe('Parágrafo');
    });

    test('deve decodificar entidades HTML', () => {
        const input = '&lt;script&gt;teste&lt;/script&gt;';
        const result = sanitizeString(input);
        expect(result).toBe('<script>teste</script>');
    });

    test('deve limitar tamanho da string', () => {
        const longInput = 'a'.repeat(1000);
        const result = sanitizeString(longInput, 500);
        expect(result.length).toBe(500);
    });

    test('deve retornar string vazia para null', () => {
        expect(sanitizeString(null)).toBe('');
    });

    test('deve retornar string vazia para undefined', () => {
        expect(sanitizeString(undefined)).toBe('');
    });

    test('deve fazer trim de espaços', () => {
        const input = '   texto com espaços   ';
        const result = sanitizeString(input);
        expect(result).toBe('texto com espaços');
    });

    test('deve preservar caracteres especiais brasileiros', () => {
        const input = 'Açaí, café, pão, coração';
        const result = sanitizeString(input);
        expect(result).toBe('Açaí, café, pão, coração');
    });
});

describe('Validação de Transação', () => {
    // Simula validação do createTransaction
    const validateTransactionInput = (data: any) => {
        if (!data.description || typeof data.description !== 'string') {
            throw new ValidationError('Descrição é obrigatória');
        }
        if (typeof data.amount !== 'number' || isNaN(data.amount)) {
            throw new ValidationError('Valor da transação é inválido');
        }
        if (!data.date) {
            throw new ValidationError('Data da transação é obrigatória');
        }
        if (!data.entryType || !['Receita', 'Despesa'].includes(data.entryType)) {
            throw new ValidationError('Tipo de entrada deve ser "Receita" ou "Despesa"');
        }
        return true;
    };

    test('deve aceitar transação válida', () => {
        const validTransaction = {
            description: 'Compra de supermercado',
            amount: 150.00,
            date: '2025-01-15',
            entryType: 'Despesa'
        };
        expect(validateTransactionInput(validTransaction)).toBe(true);
    });

    test('deve rejeitar transação sem descrição', () => {
        const invalidTransaction = {
            amount: 150.00,
            date: '2025-01-15',
            entryType: 'Despesa'
        };
        expect(() => validateTransactionInput(invalidTransaction)).toThrow(ValidationError);
    });

    test('deve rejeitar transação com descrição vazia', () => {
        const invalidTransaction = {
            description: '',
            amount: 150.00,
            date: '2025-01-15',
            entryType: 'Despesa'
        };
        expect(() => validateTransactionInput(invalidTransaction)).toThrow(ValidationError);
    });

    test('deve rejeitar transação com amount inválido (string)', () => {
        const invalidTransaction = {
            description: 'Teste',
            amount: '150.00' as any,
            date: '2025-01-15',
            entryType: 'Despesa'
        };
        expect(() => validateTransactionInput(invalidTransaction)).toThrow(ValidationError);
    });

    test('deve rejeitar transação com amount NaN', () => {
        const invalidTransaction = {
            description: 'Teste',
            amount: NaN,
            date: '2025-01-15',
            entryType: 'Despesa'
        };
        expect(() => validateTransactionInput(invalidTransaction)).toThrow(ValidationError);
    });

    test('deve rejeitar transação sem data', () => {
        const invalidTransaction = {
            description: 'Teste',
            amount: 150.00,
            entryType: 'Despesa'
        };
        expect(() => validateTransactionInput(invalidTransaction)).toThrow(ValidationError);
    });

    test('deve rejeitar transação com entryType inválido', () => {
        const invalidTransaction = {
            description: 'Teste',
            amount: 150.00,
            date: '2025-01-15',
            entryType: 'Income' // Em inglês, deveria ser português
        };
        expect(() => validateTransactionInput(invalidTransaction)).toThrow(ValidationError);
    });

    test('deve aceitar Receita como entryType', () => {
        const validTransaction = {
            description: 'Salário',
            amount: 5000.00,
            date: '2025-01-15',
            entryType: 'Receita'
        };
        expect(validateTransactionInput(validTransaction)).toBe(true);
    });

    test('deve aceitar Despesa como entryType', () => {
        const validTransaction = {
            description: 'Aluguel',
            amount: 2000.00,
            date: '2025-01-15',
            entryType: 'Despesa'
        };
        expect(validateTransactionInput(validTransaction)).toBe(true);
    });
});

describe('Limite de Transações em Lote', () => {
    const MAX_BATCH_SIZE = 500;

    const validateBatchSize = (transactions: any[]) => {
        if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
            throw new Error('Array de transações é obrigatório');
        }
        if (transactions.length > MAX_BATCH_SIZE) {
            throw new Error(`Máximo de ${MAX_BATCH_SIZE} transações por lote`);
        }
        return true;
    };

    test('deve aceitar lote com 1 transação', () => {
        expect(validateBatchSize([{ id: 1 }])).toBe(true);
    });

    test('deve aceitar lote com 500 transações', () => {
        const batch = Array.from({ length: 500 }, (_, i) => ({ id: i }));
        expect(validateBatchSize(batch)).toBe(true);
    });

    test('deve rejeitar lote com 501 transações', () => {
        const batch = Array.from({ length: 501 }, (_, i) => ({ id: i }));
        expect(() => validateBatchSize(batch)).toThrow();
    });

    test('deve rejeitar lote vazio', () => {
        expect(() => validateBatchSize([])).toThrow();
    });

    test('deve rejeitar null', () => {
        expect(() => validateBatchSize(null as any)).toThrow();
    });

    test('deve rejeitar undefined', () => {
        expect(() => validateBatchSize(undefined as any)).toThrow();
    });
});
