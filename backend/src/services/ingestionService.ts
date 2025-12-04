/**
 * Serviço de Ingestão Financeira
 * Implementa pipeline híbrido: Regex (custo zero) + Google Gemini AI
 */


import { aiConfig } from '../config/ai';
import { InternalServerError, ValidationError } from '../utils/AppError';
import { logger } from '../utils/logger';
import type {
    ExtractionResult,
    RegexExtractionResult,
    GeminiFinancialData,
    SupportedMimeType,
} from '../types/ingestion.types';

/**
 * Classe principal de serviço de ingestão
 */
export class IngestionService {
    // Threshold de confiança para aceitar resultado do Regex
    private static readonly CONFIDENCE_THRESHOLD = 0.8;

    /**
     * Processa um arquivo e extrai dados financeiros
     */
    async processFile(
        fileBuffer: Buffer,
        mimeType: SupportedMimeType
    ): Promise<ExtractionResult> {
        logger.info('Iniciando processamento de arquivo', 'IngestionService', {
            mimeType,
            sizeBytes: fileBuffer.length,
        });

        try {
            // Estratégia 1: PDF com extração de texto (Custo Zero)
            if (mimeType === 'application/pdf') {
                const regexResult = await this.extractFromPDF(fileBuffer);

                if (regexResult.confidence >= IngestionService.CONFIDENCE_THRESHOLD) {
                    logger.info(
                        'Extração via Regex bem-sucedida (custo zero)',
                        'IngestionService',
                        { confidence: regexResult.confidence }
                    );

                    return {
                        merchant: regexResult.merchant || 'Não identificado',
                        date: regexResult.date || new Date().toISOString(),
                        amount: regexResult.amount || 0,
                        confidence: regexResult.confidence,
                        extractionMethod: 'regex',
                        rawData: regexResult,
                    };
                }

                logger.info(
                    'Confiança do Regex baixa, enviando para IA',
                    'IngestionService',
                    { confidence: regexResult.confidence }
                );
            }

            // Estratégia 2: Imagem OU PDF com baixa confiança -> IA
            if (!aiConfig.isAvailable()) {
                throw new InternalServerError(
                    'Serviço de IA não disponível e extração local falhou'
                );
            }

            const aiResult = await this.extractWithAI(fileBuffer, mimeType);
            return aiResult;
        } catch (error) {
            logger.error('Erro no processamento do arquivo', error, 'IngestionService');
            throw error instanceof InternalServerError || error instanceof ValidationError
                ? error
                : new InternalServerError('Falha ao processar arquivo financeiro');
        }
    }

    /**
     * Extrai dados de PDF usando pdf-parse + Regex
     */
    private async extractFromPDF(buffer: Buffer): Promise<RegexExtractionResult> {
        try {
            // Dynamic import for CommonJS module
            const pdfParseModule = await import('pdf-parse');
            const pdfParse = pdfParseModule.default;
            const data = await pdfParse(buffer);
            const text = data.text;

            return this.extractWithRegex(text);
        } catch (error) {
            logger.warn('Erro ao extrair texto do PDF', 'IngestionService', { error });
            return {
                confidence: 0,
                matchedPatterns: [],
            };
        }
    }

    /**
     * Aplica padrões Regex para extração de dados financeiros brasileiros
     */
    private extractWithRegex(text: string): RegexExtractionResult {
        const result: RegexExtractionResult = {
            confidence: 0,
            matchedPatterns: [],
        };

        // Padrão: CNPJ (XX.XXX.XXX/XXXX-XX)
        const cnpjPattern = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;
        const cnpjMatch = text.match(cnpjPattern);
        if (cnpjMatch) {
            result.cnpj = cnpjMatch[0];
            result.matchedPatterns.push('cnpj');
        }

        // Padrão: Moeda brasileira (R$ X.XXX,XX ou R$X.XXX,XX)
        const currencyPattern = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/g;
        const currencyMatches = [...text.matchAll(currencyPattern)];
        if (currencyMatches.length > 0) {
            // Pega o maior valor encontrado (provavelmente o total)
            const amounts = currencyMatches.map((m) => this.parseBRLCurrency(m[1]));
            result.amount = Math.max(...amounts);
            result.matchedPatterns.push('currency');
        }

        // Padrão: Data brasileira (DD/MM/YYYY ou DD-MM-YYYY)
        const datePattern = /(\d{2})[/-](\d{2})[/-](\d{4})/;
        const dateMatch = text.match(datePattern);
        if (dateMatch) {
            const [, day, month, year] = dateMatch;
            result.date = this.normalizeDate(`${day}/${month}/${year}`);
            result.matchedPatterns.push('date');
        }

        // Padrão: Linha digitável de boleto (47 dígitos)
        const boletoPattern = /\d{5}\.\d{5}\s\d{5}\.\d{6}\s\d{5}\.\d{6}\s\d\s\d{14}/;
        const boletoMatch = text.match(boletoPattern);
        if (boletoMatch) {
            result.boletoCode = boletoMatch[0].replace(/\s/g, '');
            result.matchedPatterns.push('boleto');
        }

        // Tentar extrair nome do comerciante (heurística simples)
        // Procura por linhas com palavras em maiúsculas no início do documento
        const lines = text.split('\n').slice(0, 10); // Primeiras 10 linhas
        const merchantPattern = /^([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ\s]{5,})/;
        for (const line of lines) {
            const merchantMatch = line.trim().match(merchantPattern);
            if (merchantMatch && !result.merchant) {
                result.merchant = merchantMatch[1].trim();
                result.matchedPatterns.push('merchant');
                break;
            }
        }

        // Calcula confiança baseado nos padrões encontrados
        result.confidence = this.calculateConfidence(result.matchedPatterns);

        return result;
    }

    /**
     * Converte moeda BRL para número
     * "1.200,50" -> 1200.50
     */
    private parseBRLCurrency(value: string): number {
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    }

    /**
     * Normaliza data brasileira para ISO 8601
     * "03/12/2025" -> "2025-12-03T00:00:00.000Z"
     */
    private normalizeDate(dateStr: string): string {
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month}-${day}`).toISOString();
    }

    /**
     * Calcula score de confiança baseado nos padrões encontrados
     */
    private calculateConfidence(patterns: string[]): number {
        const weights: Record<string, number> = {
            cnpj: 0.2,
            currency: 0.4,
            date: 0.2,
            merchant: 0.15,
            boleto: 0.05,
        };

        let score = 0;
        for (const pattern of patterns) {
            score += weights[pattern] || 0;
        }

        return Math.min(score, 1.0);
    }

    /**
     * Extrai dados usando Google Gemini AI (Vision/Multimodal)
     */
    private async extractWithAI(
        buffer: Buffer,
        mimeType: SupportedMimeType
    ): Promise<ExtractionResult> {
        try {
            const model = aiConfig.getModel();

            // Prepara o conteúdo para o Gemini
            const imagePart = {
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: mimeType,
                },
            };

            // Prompt otimizado para extração financeira
            const prompt = this.buildFinancialExtractionPrompt();

            logger.info('Enviando para Google Gemini AI', 'IngestionService');

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();
            logger.debug('Resposta bruta do Gemini:', 'IngestionService', { text });

            // Limpa o texto de blocos de código markdown (```json ... ```)
            const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
            logger.debug('Texto limpo para parse:', 'IngestionService', { cleanedText });

            // Parse da resposta JSON
            const data: GeminiFinancialData = JSON.parse(cleanedText);
            logger.debug('Dados parseados do Gemini:', 'IngestionService', { data });

            logger.info('Extração via IA concluída', 'IngestionService', {
                merchant: data.merchant,
                amount: data.amount,
            });

            return {
                merchant: data.merchant,
                date: data.date,
                amount: data.amount,
                category: data.category,
                items: data.items,
                confidence: 0.95, // Alta confiança para IA
                extractionMethod: 'ai',
            };
        } catch (error) {
            logger.error('Erro na extração com IA', error, 'IngestionService');
            throw new InternalServerError('Falha ao processar com Google AI', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    /**
     * Cria o prompt otimizado para o Gemini
     */
    private buildFinancialExtractionPrompt(): string {
        return `Você é um especialista em extração de dados financeiros de documentos brasileiros.

Analise a imagem ou PDF e extraia as seguintes informações em formato JSON:

{
  "merchant": "Nome do estabelecimento/comerciante",
  "date": "Data da transação no formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)",
  "amount": Valor total como número decimal (ex: 1200.50),
  "category": "Categoria da despesa (opcional)",
  "items": [
    {
      "description": "Descrição do item",
      "quantity": Quantidade (opcional),
      "unitPrice": Preço unitário (opcional),
      "totalPrice": Preço total do item
    }
  ]
}

REGRAS IMPORTANTES:
1. Converta valores em Real (R$) para números decimais: "R$ 1.200,50" → 1200.50
2. Converta datas brasileiras (DD/MM/YYYY) para ISO 8601
3. Se a data não tiver hora, use 00:00:00
4. Use apenas números para "amount", sem símbolos de moeda
5. Se não encontrar algum campo, use null
6. Retorne APENAS o JSON, sem texto adicional

Extraia os dados agora:`;
    }
}
