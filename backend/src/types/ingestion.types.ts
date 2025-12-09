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
 * Transação individual extraída de uma fatura
 */
export interface ExtractedTransaction {
    merchant: string | null;
    date: string | null; // ISO 8601 format
    amount: number;
    category?: string | null;
    description?: string | null;
    installmentInfo?: string | null; // Ex: "Parcela 02 de 12", "6/10", "1 de 2"
    cardLastDigits?: string | null; // Últimos 4 dígitos do cartão
    isRefund?: boolean; // True se for estorno/reembolso (aparece com "+" na fatura)
}

/**
 * Metadados de uma fatura de cartão de crédito
 */
export interface StatementInfo {
    institution?: string | null;
    cardLastDigits?: string | null;
    dueDate?: string | null;
    totalAmount?: number | null;
    creditLimit?: number | null; // Limite total do cartão
    periodStart?: string | null;
    periodEnd?: string | null;
    holderName?: string | null;
}

/**
 * Resultado da extração de dados financeiros
 * Suporta tanto documentos simples (1 transação) quanto faturas (múltiplas)
 */
export interface ExtractionResult {
    // Campos para extração simples (nota fiscal, comprovante)
    merchant: string | null;
    date: string | null; // ISO 8601 format
    amount: number;
    category?: string | null;
    items?: TransactionItem[] | null;
    confidence: number; // 0-1
    extractionMethod: 'regex' | 'ai';
    rawData?: any; // Dados brutos opcionais para debug

    // Campos para extração multi-transação (fatura de cartão)
    isMultiTransaction?: boolean;
    transactions?: ExtractedTransaction[];
    statementInfo?: StatementInfo;
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
