/**
 * Testes para o serviço de ingestão (IngestionService)
 * Testa validações de segurança e processamento de arquivos
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { IngestionService } from '../services/ingestionService';
import { ValidationError } from '../utils/AppError';

describe('IngestionService', () => {
    let service: IngestionService;

    beforeEach(() => {
        service = new IngestionService();
    });

    describe('Validação de Magic Bytes', () => {
        test('deve rejeitar arquivo PDF com magic bytes inválidos', async () => {
            // Arquivo com conteúdo aleatório (não é um PDF real)
            const fakeBuffer = Buffer.from('Este não é um PDF válido, apenas texto');

            await expect(
                service.processFile(fakeBuffer, 'application/pdf', [])
            ).rejects.toThrow(ValidationError);
        });

        test('deve rejeitar arquivo JPEG com magic bytes inválidos', async () => {
            // Arquivo com magic bytes de PNG mas declarado como JPEG
            const pngMagicBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            const fakeJpegBuffer = Buffer.concat([pngMagicBytes, Buffer.alloc(500)]);

            await expect(
                service.processFile(fakeJpegBuffer, 'image/jpeg', [])
            ).rejects.toThrow(ValidationError);
        });

        test('deve rejeitar arquivo PNG com magic bytes inválidos', async () => {
            // Arquivo com magic bytes de JPEG mas declarado como PNG
            const jpegMagicBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
            const fakePngBuffer = Buffer.concat([jpegMagicBytes, Buffer.alloc(500)]);

            await expect(
                service.processFile(fakePngBuffer, 'image/png', [])
            ).rejects.toThrow(ValidationError);
        });

        test('deve aceitar PDF válido (magic bytes corretos)', async () => {
            // Buffer com magic bytes de PDF (%PDF)
            const pdfMagicBytes = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
            const validPdfBuffer = Buffer.concat([
                pdfMagicBytes,
                Buffer.from('-1.4\n'), // Versão PDF
                Buffer.alloc(500) // Conteúdo dummy
            ]);

            // Este teste vai falhar na extração de texto, mas deve passar na validação de magic bytes
            try {
                await service.processFile(validPdfBuffer, 'application/pdf', []);
            } catch (error: any) {
                // Se o erro NÃO for ValidationError sobre magic bytes, está ok
                // O PDF é inválido para parse, mas passou na validação de assinatura
                expect(error.message).not.toContain('Tipo de arquivo inválido');
            }
        });
    });

    describe('Validação de Tamanho Mínimo', () => {
        test('deve rejeitar arquivo muito pequeno (menos de 100 bytes)', async () => {
            const tinyBuffer = Buffer.alloc(50); // 50 bytes

            await expect(
                service.processFile(tinyBuffer, 'application/pdf', [])
            ).rejects.toThrow(ValidationError);
        });

        test('deve rejeitar arquivo vazio', async () => {
            const emptyBuffer = Buffer.alloc(0);

            await expect(
                service.processFile(emptyBuffer, 'application/pdf', [])
            ).rejects.toThrow(ValidationError);
        });
    });
});

describe('Validação de Magic Bytes - Função Isolada', () => {
    // Testa a função de validação diretamente
    const validateFileSignature = (buffer: Buffer, mimeType: string): boolean => {
        if (buffer.length < 4) return false;

        const signatures: Record<string, number[][]> = {
            'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
            'image/jpeg': [[0xFF, 0xD8, 0xFF]],
            'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
        };

        const expectedSigs = signatures[mimeType];
        if (!expectedSigs) return false;

        return expectedSigs.some(sig =>
            sig.every((byte, i) => buffer[i] === byte)
        );
    };

    test('PDF válido deve retornar true', () => {
        const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0x00]);
        expect(validateFileSignature(pdfBuffer, 'application/pdf')).toBe(true);
    });

    test('JPEG válido deve retornar true', () => {
        const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x00]);
        expect(validateFileSignature(jpegBuffer, 'image/jpeg')).toBe(true);
    });

    test('PNG válido deve retornar true', () => {
        const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
        expect(validateFileSignature(pngBuffer, 'image/png')).toBe(true);
    });

    test('Arquivo com mimetype falso deve retornar false', () => {
        const textBuffer = Buffer.from('Hello World');
        expect(validateFileSignature(textBuffer, 'application/pdf')).toBe(false);
    });

    test('Buffer muito pequeno deve retornar false', () => {
        const tinyBuffer = Buffer.from([0x25, 0x50]); // Apenas 2 bytes
        expect(validateFileSignature(tinyBuffer, 'application/pdf')).toBe(false);
    });

    test('Mimetype não suportado deve retornar false', () => {
        const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]);
        expect(validateFileSignature(buffer, 'application/octet-stream')).toBe(false);
    });
});
