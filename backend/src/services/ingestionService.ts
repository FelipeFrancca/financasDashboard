/**
 * Serviço de Ingestão Financeira
 * Implementa pipeline híbrido: Regex (custo zero) + Google Gemini AI
 * Inclui retry com exponential backoff para resiliência
 */

import { aiConfig } from '../config/ai';
import {
    InternalServerError,
    ValidationError,
    AIExtractionError,
    AIServiceUnavailableError,
    DocumentParseError,
    AITimeoutError,
} from '../utils/AppError';
import { logger } from '../utils/logger';
import type {
    ExtractionResult,
    RegexExtractionResult,
    GeminiFinancialData,
    SupportedMimeType,
    ExtractedTransaction,
    StatementInfo,
} from '../types/ingestion.types';

/**
 * Resposta estruturada do Gemini para faturas de cartão
 */
interface GeminiStatementResponse {
    isMultiTransaction: boolean;
    transactions: ExtractedTransaction[];
    statementInfo: StatementInfo;
}

/**
 * Códigos de erro do Gemini que são retryable
 */
const RETRYABLE_ERROR_CODES = [
    'RESOURCE_EXHAUSTED',
    'UNAVAILABLE',
    'DEADLINE_EXCEEDED',
    'INTERNAL',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
];

/**
 * Classe principal de serviço de ingestão
 */
export class IngestionService {
    // Threshold de confiança para aceitar resultado do Regex
    private static readonly CONFIDENCE_THRESHOLD = 0.8;

    // Configurações de retry
    private static readonly MAX_RETRIES = 3;
    private static readonly BASE_DELAY_MS = 1000;
    private static readonly REQUEST_TIMEOUT_MS = 90000; // 90 segundos para PDFs multi-página

    /**
     * Processa um arquivo e extrai dados financeiros
     */
    async processFile(
        fileBuffer: Buffer,
        mimeType: SupportedMimeType,
        availableCategories: string[] = []
    ): Promise<ExtractionResult> {
        logger.info('Iniciando processamento de arquivo', 'IngestionService', {
            mimeType,
            sizeBytes: fileBuffer.length,
            availableCategoriesCount: availableCategories.length,
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
                throw new AIServiceUnavailableError(
                    'Serviço de IA não configurado. Configure a chave GOOGLE_AI_API_KEY.'
                );
            }

            // Usa retry com exponential backoff
            const aiResult = await this.extractWithAIRetry(fileBuffer, mimeType, availableCategories);
            return aiResult;
        } catch (error) {
            logger.error('Erro no processamento do arquivo', error, 'IngestionService');

            // Preserva erros já tipados
            if (
                error instanceof AIExtractionError ||
                error instanceof AIServiceUnavailableError ||
                error instanceof DocumentParseError ||
                error instanceof AITimeoutError ||
                error instanceof ValidationError
            ) {
                throw error;
            }

            // Erro genérico - transforma em erro mais amigável
            throw new InternalServerError(
                'Ocorreu um erro inesperado ao processar o documento. Tente novamente.',
                { originalError: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Extrai dados com IA usando retry e exponential backoff
     */
    private async extractWithAIRetry(
        buffer: Buffer,
        mimeType: SupportedMimeType,
        availableCategories: string[]
    ): Promise<ExtractionResult> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= IngestionService.MAX_RETRIES; attempt++) {
            try {
                logger.info(`Tentativa ${attempt}/${IngestionService.MAX_RETRIES} de extração via IA`, 'IngestionService');

                const result = await this.extractWithAI(buffer, mimeType, availableCategories);

                if (attempt > 1) {
                    logger.info(`Extração bem-sucedida após ${attempt} tentativas`, 'IngestionService');
                }

                return result;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Se não é um erro retryable, falha imediatamente
                if (!this.isRetryableError(error)) {
                    logger.warn(`Erro não-retryable na tentativa ${attempt}`, 'IngestionService', {
                        error: lastError.message,
                    });
                    throw error;
                }

                // Última tentativa - não faz retry
                if (attempt === IngestionService.MAX_RETRIES) {
                    logger.error(
                        `Todas as ${IngestionService.MAX_RETRIES} tentativas falharam`,
                        lastError,
                        'IngestionService'
                    );
                    break;
                }

                // Calcula delay com exponential backoff
                const delay = IngestionService.BASE_DELAY_MS * Math.pow(2, attempt - 1);
                logger.warn(
                    `Tentativa ${attempt} falhou, aguardando ${delay}ms antes de retry`,
                    'IngestionService',
                    { error: lastError.message }
                );

                await this.sleep(delay);
            }
        }

        // Todas as tentativas falharam - lança erro apropriado
        throw new AIServiceUnavailableError(
            'O serviço de análise está temporariamente sobrecarregado. Por favor, tente novamente em alguns minutos.'
        );
    }

    /**
     * Verifica se o erro é retryable
     */
    private isRetryableError(error: unknown): boolean {
        if (!error || typeof error !== 'object') return false;

        // Erros tipados NUNCA são retryable (já foram classificados)
        if (
            error instanceof AIExtractionError ||
            error instanceof DocumentParseError ||
            error instanceof AITimeoutError ||
            error instanceof AIServiceUnavailableError // Já tratou rotação interna, não retry!
        ) {
            return false;
        }

        const err = error as any;

        // Verifica código de erro
        if (err.code && RETRYABLE_ERROR_CODES.includes(err.code)) {
            return true;
        }

        // Verifica status HTTP
        const status = err.status || err.statusCode;
        if (status && [429, 500, 502, 503, 504].includes(status)) {
            return true;
        }

        // Verifica mensagem de erro
        const message = (err.message || '').toLowerCase();
        if (
            message.includes('timeout') ||
            message.includes('rate limit') ||
            message.includes('quota') ||
            message.includes('overloaded') ||
            message.includes('temporarily unavailable') ||
            message.includes('econnreset') ||
            message.includes('socket hang up')
        ) {
            return true;
        }

        return false;
    }

    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Extrai dados de PDF usando pdf-parse + Regex
     */
    private async extractFromPDF(buffer: Buffer): Promise<RegexExtractionResult> {
        try {
            // Dynamic import for pdf-parse module
            const pdfParseModule = await import('pdf-parse') as any;
            const pdfParse = pdfParseModule.default || pdfParseModule;
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
    /**
     * Extrai dados usando Google Gemini AI (Vision/Multimodal)
     * Com suporte a rotação de chaves e modelos
     */
    private async extractWithAI(
        buffer: Buffer,
        mimeType: SupportedMimeType,
        availableCategories: string[]
    ): Promise<ExtractionResult> {
        let attempts = 0;
        const maxTotalAttempts = 15; // Limite de segurança para evitar loops infinitos

        while (attempts < maxTotalAttempts) {
            attempts++;
            const currentConfig = aiConfig.getCurrentConfig();
            const model = aiConfig.getModel();

            // Prepara o conteúdo para o Gemini
            const imagePart = {
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: mimeType,
                },
            };

            // Prompt otimizado para extração financeira
            const prompt = this.buildFinancialExtractionPrompt(availableCategories);

            logger.info(
                `Tentativa de IA (Key: ${currentConfig.keyIndex + 1}, Model: ${currentConfig.model})`,
                'IngestionService'
            );

            try {
                // Cria promise com timeout
                const resultPromise = model.generateContent([prompt, imagePart]);
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new AITimeoutError()), IngestionService.REQUEST_TIMEOUT_MS);
                });

                const result = await Promise.race([resultPromise, timeoutPromise]);
                const response = await result.response;
                const text = response.text();

                logger.debug('Resposta bruta do Gemini:', 'IngestionService', { text });

                // Parse do JSON com tratamento robusto (pode ser single ou multi)
                const parsed = this.parseGeminiResponse(text);

                // Verifica se é resposta multi-transação
                if ('isMultiTransaction' in parsed && parsed.isMultiTransaction) {
                    const multiData = parsed as GeminiStatementResponse;
                    logger.info('Extração multi-transação via IA concluída', 'IngestionService', {
                        transactionCount: multiData.transactions?.length || 0,
                        institution: multiData.statementInfo?.institution,
                    });

                    return {
                        merchant: multiData.statementInfo?.institution || 'Fatura de Cartão',
                        date: multiData.statementInfo?.dueDate || new Date().toISOString(),
                        amount: multiData.statementInfo?.totalAmount || 0,
                        confidence: 0.95,
                        extractionMethod: 'ai',
                        isMultiTransaction: true,
                        transactions: multiData.transactions,
                        statementInfo: multiData.statementInfo,
                    };
                }

                // Resposta single-transaction (comportamento original)
                const data = parsed as GeminiFinancialData;
                logger.info('Extração via IA concluída com sucesso', 'IngestionService', {
                    merchant: data.merchant,
                    amount: data.amount,
                    category: data.category,
                });

                return {
                    merchant: data.merchant,
                    date: data.date,
                    amount: data.amount ?? 0,
                    category: data.category,
                    items: data.items,
                    confidence: 0.95,
                    extractionMethod: 'ai',
                };

            } catch (error: any) {
                logger.warn(
                    `Falha na extração com Key ${currentConfig.keyIndex + 1} / Model ${currentConfig.model}`,
                    'IngestionService',
                    { error: error.message }
                );

                // Verifica se é erro de quota ou permissão
                const isQuotaError = error.message?.includes('429') ||
                    error.message?.includes('quota') ||
                    error.message?.includes('limit') ||
                    error.message?.includes('404') || // Modelo não encontrado
                    error.message?.includes('503');   // Serviço indisponível

                if (isQuotaError) {
                    logger.warn('Erro de cota/limite detectado. Tentando rotacionar estratégia...', 'IngestionService');

                    const rotated = aiConfig.rotateStrategy();
                    if (rotated) {
                        // Continua o loop com a nova configuração
                        continue;
                    } else {
                        logger.error('Todas as estratégias de rotação falharam.', 'IngestionService');
                        throw new AIServiceUnavailableError(
                            'Todos os modelos e chaves de API estão esgotados ou indisponíveis no momento.'
                        );
                    }
                }

                // Se não for erro de cota, lança o erro original (pode ser erro de parse, timeout real, etc)
                throw error;
            }
        }

        throw new AIServiceUnavailableError('Limite máximo de tentativas de rotação atingido.');
    }

    /**
     * Parse robusto da resposta do Gemini
     * Suporta tanto respostas single-transaction quanto multi-transaction
     */
    private parseGeminiResponse(text: string): GeminiFinancialData | GeminiStatementResponse {
        // Remove blocos de código markdown
        let cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

        // Tenta encontrar JSON no texto se não começar com {
        if (!cleanedText.startsWith('{')) {
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedText = jsonMatch[0];
            }
        }

        logger.debug('Texto limpo para parse:', 'IngestionService', { cleanedText: cleanedText.substring(0, 500) });

        try {
            const data = JSON.parse(cleanedText);

            // Verifica se é resposta multi-transação
            if (data.isMultiTransaction === true && Array.isArray(data.transactions)) {
                // Normaliza valores das transações
                data.transactions = data.transactions.map((t: any) => ({
                    ...t,
                    amount: this.normalizeAmount(t.amount),
                }));

                // Normaliza valor total da fatura
                if (data.statementInfo?.totalAmount) {
                    data.statementInfo.totalAmount = this.normalizeAmount(data.statementInfo.totalAmount);
                }

                return data as GeminiStatementResponse;
            }

            // Resposta single-transaction - normaliza amount
            data.amount = this.normalizeAmount(data.amount);
            return data as GeminiFinancialData;
        } catch (parseError) {
            logger.error('Erro ao fazer parse do JSON do Gemini', parseError, 'IngestionService', {
                originalText: cleanedText.substring(0, 500),
            });

            throw new DocumentParseError(
                'Não foi possível interpretar a resposta da IA. O documento pode estar ilegível.',
                { parseError: (parseError as Error).message }
            );
        }
    }

    /**
     * Normaliza valor monetário para número
     */
    private normalizeAmount(amount: any): number {
        if (typeof amount === 'number') return amount;
        if (amount === null || amount === undefined) return 0;
        if (typeof amount === 'string') {
            const parsed = parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.'));
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    /**
     * Cria o prompt otimizado para o Gemini
     * Detecta automaticamente se é fatura de cartão (múltiplas transações) ou documento único
     */
    private buildFinancialExtractionPrompt(availableCategories: string[]): string {
        const categoriesStr = availableCategories.length > 0
            ? `\nCategorias disponíveis: ${availableCategories.join(', ')}`
            : '';

        return `Você é um especialista em extração de dados financeiros de documentos brasileiros.
${categoriesStr}

REGRAS DE CATEGORIA:
- SEMPRE sugira categorias em PORTUGUÊS BRASILEIRO
- Se não houver categorias disponíveis, use uma destas: Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Compras, Assinaturas, Serviços, Outros
- NUNCA use categorias em inglês (ex: Shopping, Food, Transport, Entertainment, etc.)
- Para compras online (Amazon, Mercado Livre, etc.), use "Compras"
- Para streaming/apps (Netflix, Spotify, etc.), use "Assinaturas"

ANALISE O DOCUMENTO E DETERMINE O TIPO:

**TIPO 1 - FATURA DE CARTÃO DE CRÉDITO**
Se o documento for uma fatura de cartão de crédito (contém múltiplas compras, lista de transações, data de vencimento, limite de crédito), retorne:

{
  "isMultiTransaction": true,
  "statementInfo": {
    "institution": "Nome do banco/emissor (ex: Inter, Nubank, Itaú)",
    "cardLastDigits": "Últimos 4 dígitos do cartão (ex: 2440)",
    "dueDate": "Data de vencimento em ISO 8601",
    "totalAmount": Valor total da fatura como número,
    "holderName": "Nome do titular"
  },
  "transactions": [
    {
      "merchant": "Nome do estabelecimento",
      "date": "Data da compra em ISO 8601",
      "amount": Valor como número decimal,
      "category": "Categoria sugerida",
      "description": "Descrição adicional se houver",
      "installmentInfo": "Parcela X de Y (se aplicável, senão null)",
      "cardLastDigits": "Últimos 4 dígitos do cartão desta compra (se houver múltiplos cartões)"
    }
  ]
}

**TIPO 2 - DOCUMENTO ÚNICO (nota fiscal, comprovante, boleto)**
Se for um documento com apenas UMA transação, retorne:

{
  "isMultiTransaction": false,
  "merchant": "Nome do estabelecimento",
  "date": "Data em ISO 8601",
  "amount": Valor como número decimal,
  "category": "Categoria sugerida",
  "items": [{"description": "Item", "totalPrice": valor}] ou null
}

REGRAS IMPORTANTES:
1. Converta R$ para números: "R$ 1.200,50" → 1200.50
2. Datas DD/MM/YYYY → ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
3. Se não tiver hora, use T00:00:00.000Z
4. EXTRAIA TODAS as transações da fatura, não apenas algumas
5. Inclua pagamentos (valores positivos com +) como transações negativas (crédito)
6. Ignore linhas de total/subtotal, extraia apenas transações individuais
7. Para categoria: use uma das disponíveis ou sugira uma apropriada
8. Retorne APENAS o JSON, sem texto adicional

Extraia os dados agora:`;
    }
}
