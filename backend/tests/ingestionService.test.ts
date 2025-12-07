import { describe, it, expect, mock, beforeAll, beforeEach, spyOn } from 'bun:test';
import { IngestionService } from '../src/services/ingestionService';

// Mock dos erros
const mockErrors = {
    retryable: { code: 'RESOURCE_EXHAUSTED', message: 'Rate limit exceeded' },
    timeout: { code: 'DEADLINE_EXCEEDED', message: 'Request timed out' },
    permanent: { code: 'INVALID_ARGUMENT', message: 'Invalid request' },
    safety: { message: 'Response blocked due to SAFETY' },
};

// Mock response de sucesso
const mockSuccessResponse = {
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

// Mock response com JSON formatado markdown
const mockMarkdownResponse = {
    response: {
        text: () => '```json\n{"merchant": "LOJA TESTE", "date": "2025-12-06T00:00:00.000Z", "amount": 250.00, "category": null, "items": null}\n```'
    }
};

// Create mock container object (using object property allows reassignment to work)
const mockContainer = {
    generateContent: mock(async () => mockSuccessResponse)
};

// Mock aiConfig module
mock.module('../src/config/ai', () => {
    return {
        aiConfig: {
            isAvailable: () => true,
            getModel: () => ({
                generateContent: (...args: any[]) => mockContainer.generateContent(...args)
            })
        }
    };
});

describe('IngestionService', () => {
    let service: IngestionService;
    let extractFromPDFSpy: any;

    beforeEach(() => {
        service = new IngestionService();
        // Reset mock
        mockContainer.generateContent = mock(async () => mockSuccessResponse);
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

        it('should handle zero amount from extraction', async () => {
            extractFromPDFSpy.mockResolvedValue({
                confidence: 0.9,
                matchedPatterns: ['cnpj', 'date'],
                cnpj: '12.345.678/0001-90',
                amount: 0,
                date: '2025-12-01T00:00:00.000Z',
                merchant: 'LOJA TESTE'
            });

            const buffer = Buffer.from('dummy pdf content');
            const result = await service.processFile(buffer, 'application/pdf');

            expect(result.amount).toBe(0);
            expect(result.extractionMethod).toBe('regex');
        });
    });

    describe('AI Extraction (Image)', () => {
        it('should use AI directly for image files', async () => {
            const buffer = Buffer.from('fake-image-data');
            const result = await service.processFile(buffer, 'image/jpeg');

            expect(result.extractionMethod).toBe('ai');
            expect(result.amount).toBe(150.00);
        });

        it('should parse markdown-wrapped JSON from Gemini', async () => {
            mockContainer.generateContent = mock(async () => mockMarkdownResponse);

            const buffer = Buffer.from('fake-image-data');
            const result = await service.processFile(buffer, 'image/jpeg');

            expect(result.extractionMethod).toBe('ai');
            expect(result.merchant).toBe('LOJA TESTE');
            expect(result.amount).toBe(250.00);
        });

        it('should handle amount as string from Gemini', async () => {
            mockContainer.generateContent = mock(async () => ({
                response: {
                    text: () => JSON.stringify({
                        merchant: "STORE",
                        date: "2025-12-06T00:00:00.000Z",
                        amount: "R$ 1.234,56",
                        category: null,
                        items: null
                    })
                }
            }));

            const buffer = Buffer.from('fake-image-data');
            const result = await service.processFile(buffer, 'image/jpeg');

            expect(result.amount).toBe(1234.56);
        });
    });

    describe('Retry Logic', () => {
        it('should retry on transient errors and succeed', async () => {
            let callCount = 0;
            mockContainer.generateContent = mock(async () => {
                callCount++;
                if (callCount < 3) {
                    throw mockErrors.retryable;
                }
                return mockSuccessResponse;
            });

            const buffer = Buffer.from('fake-image-data');
            const result = await service.processFile(buffer, 'image/jpeg');

            expect(callCount).toBe(3);
            expect(result.extractionMethod).toBe('ai');
            expect(result.merchant).toBe('MOCK STORE');
        });

        it('should fail after max retries on persistent errors', async () => {
            mockContainer.generateContent = mock(async () => {
                throw mockErrors.retryable;
            });

            const buffer = Buffer.from('fake-image-data');

            await expect(service.processFile(buffer, 'image/jpeg'))
                .rejects.toThrow('temporariamente');
        });

        it('should not retry on permanent errors', async () => {
            let callCount = 0;
            mockContainer.generateContent = mock(async () => {
                callCount++;
                throw mockErrors.safety;
            });

            const buffer = Buffer.from('fake-image-data');

            await expect(service.processFile(buffer, 'image/jpeg'))
                .rejects.toThrow();

            expect(callCount).toBe(1); // Should not retry
        });
    });

    describe('Error Classification', () => {
        it('should throw AIExtractionError for safety blocked content', async () => {
            mockContainer.generateContent = mock(async () => {
                throw mockErrors.safety;
            });

            const buffer = Buffer.from('fake-image-data');

            try {
                await service.processFile(buffer, 'image/jpeg');
                expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
                expect(error.code).toBe('AI_EXTRACTION_ERROR');
            }
        });

        it('should throw DocumentParseError for invalid JSON', async () => {
            mockContainer.generateContent = mock(async () => ({
                response: {
                    text: () => 'This is not valid JSON at all'
                }
            }));

            const buffer = Buffer.from('fake-image-data');

            await expect(service.processFile(buffer, 'image/jpeg'))
                .rejects.toMatchObject({ code: 'DOCUMENT_PARSE_ERROR' });
        });
    });

    describe('JSON Parsing', () => {
        it('should extract JSON from mixed content', async () => {
            mockContainer.generateContent = mock(async () => ({
                response: {
                    text: () => 'Here is the extracted data:\n{"merchant": "TEST", "date": null, "amount": 100, "category": null, "items": null}\nThank you!'
                }
            }));

            const buffer = Buffer.from('fake-image-data');
            const result = await service.processFile(buffer, 'image/jpeg');

            expect(result.merchant).toBe('TEST');
            expect(result.amount).toBe(100);
        });

        it('should handle null amount gracefully', async () => {
            mockContainer.generateContent = mock(async () => ({
                response: {
                    text: () => JSON.stringify({
                        merchant: "STORE",
                        date: null,
                        amount: null,
                        category: null,
                        items: null
                    })
                }
            }));

            const buffer = Buffer.from('fake-image-data');
            const result = await service.processFile(buffer, 'image/jpeg');

            expect(result.amount).toBe(0);
        });
    });
});
