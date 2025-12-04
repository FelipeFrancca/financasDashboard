/**
 * Tipos para o módulo de ingestão financeira
 */

/**
 * Item de linha em uma transação financeira
 */
export interface TransactionItem {
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice: number;
}

/**
 * Resultado da extração de dados financeiros
 */
export interface ExtractionResult {
    merchant: string | null;
    date: string | null; // ISO 8601 format
    amount: number;
    category?: string | null;
    items?: TransactionItem[] | null;
    confidence: number; // 0-1
    extractionMethod: 'regex' | 'ai';
    rawData?: any; // Dados brutos opcionais para debug
}

/**
 * Resultado da extração via Regex
 */
export interface RegexExtractionResult {
    merchant?: string | null;
    date?: string | null;
    amount?: number;
    cnpj?: string;
    boletoCode?: string;
    confidence: number;
    matchedPatterns: string[];
}

/**
 * Resposta esperada do Google Gemini
 */
export interface GeminiFinancialData {
    merchant: string | null;
    date: string | null;
    amount: number;
    category?: string | null;
    items?: TransactionItem[] | null;
}

/**
 * Metadados de confiança da extração
 */
export interface ConfidenceMetadata {
    score: number;
    method: 'regex' | 'ai';
    reasons: string[];
}

/**
 * Tipos de arquivo suportados
 */
export type SupportedMimeType = 'application/pdf' | 'image/jpeg' | 'image/png';
