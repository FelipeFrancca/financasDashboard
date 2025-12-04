import { describe, it, expect, mock, beforeAll, spyOn } from 'bun:test';
import { IngestionService } from '../src/services/ingestionService';

// Mock GoogleGenerativeAI
const mockGenerateContent = mock(async () => {
    return {
        response: {
            text: () => JSON.stringify({
                merchant: "MOCK STORE",
                date: "2025-12-03T00:00:00.000Z",
                amount: 150.00,
                category: "Test",
                items: []
            })
        }
    };
});

mock.module('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: class {
            getGenerativeModel() {
                return {
                    generateContent: mockGenerateContent
                };
            }
        }
    };
});

// Mock aiConfig module
mock.module('../src/config/ai', () => {
    return {
        aiConfig: {
            isAvailable: () => true,
            getModel: () => ({
                generateContent: mockGenerateContent
            })
        }
    };
});

describe('IngestionService', () => {
    let service: IngestionService;
    let extractFromPDFSpy: any;

    beforeAll(() => {
        service = new IngestionService();
        // Spy on extractFromPDF
        extractFromPDFSpy = spyOn(IngestionService.prototype as any, 'extractFromPDF');
    });

    describe('Regex Extraction (PDF)', () => {
        it('should use Regex result when confidence is high', async () => {
            // Mock high confidence result
            extractFromPDFSpy.mockResolvedValue({
                confidence: 0.9,
                matchedPatterns: ['cnpj', 'currency', 'date'],
                cnpj: '12.345.678/0001-90',
                amount: 100.00,
                date: '2025-12-01T00:00:00.000Z',
                merchant: 'LOJA TESTE'
            });

            const buffer = Buffer.from('dummy pdf content');
            const result = await service.processFile(buffer, 'application/pdf');

            expect(result.extractionMethod).toBe('regex');
            expect(result.merchant).toBe('LOJA TESTE');
            expect(result.confidence).toBe(0.9);
        });

        it('should fallback to AI when Regex confidence is low', async () => {
            // Mock low confidence result
            extractFromPDFSpy.mockResolvedValue({
                confidence: 0.4,
                matchedPatterns: ['cnpj'],
                cnpj: '12.345.678/0001-90'
            });

            const buffer = Buffer.from('dummy pdf content');
            const result = await service.processFile(buffer, 'application/pdf');

            expect(result.extractionMethod).toBe('ai');
            expect(result.merchant).toBe('MOCK STORE'); // From AI mock
        });
    });

    describe('AI Extraction (Image)', () => {
        it('should use AI directly for image files', async () => {
            const buffer = Buffer.from('fake-image-data');
            const result = await service.processFile(buffer, 'image/jpeg');

            expect(result.extractionMethod).toBe('ai');
            expect(result.amount).toBe(150.00);
        });
    });
});
