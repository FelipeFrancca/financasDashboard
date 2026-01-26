import ExcelJS from 'exceljs';
import { parse } from 'csv-parse/sync';
import { prisma } from '../database/conexao';

// ============================================
// TYPES
// ============================================

export type CostCenterType = 'Essencial' | 'Não essencial' | 'Despesa Fixa' | null;

export interface ParsedTransaction {
    date: Date;
    dueDate?: Date;
    entryType: 'Receita' | 'Despesa';
    flowType: 'Fixa' | 'Variável';
    costCenter?: CostCenterType;
    category: string;
    subcategory?: string;
    description: string;
    amount: number;
    paymentMethod?: string;
    institution?: string;
    cardBrand?: string;
    installmentNumber?: number;
    installmentTotal?: number;
    notes?: string;
    isThirdParty?: boolean;
    thirdPartyName?: string;
    sourceTab?: string; // Aba de origem
    sourceRow?: number; // Linha de origem
}

export interface ParsedInstallment {
    year?: number;
    month?: string;
    day?: number;
    description: string;
    installmentNumber: number;
    installmentTotal: number;
    totalAmount: number;
    installmentAmount: number;
    category?: string;
    costCenter?: CostCenterType;
    paymentMethod?: string;
    monthlyAmounts: { [month: string]: number };
    sourceRow?: number;
}

export interface ParsedRecurring {
    description: string;
    amount: number;
    category?: string;
    frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
    sourceRow?: number;
}

export interface ParsedDebtor {
    name: string;
    description: string;
    amount: number;
    date?: Date;
    sourceRow?: number;
}

export interface ImportPreview {
    summary: {
        totalTransactions: number;
        totalIncome: number;
        totalExpense: number;
        byMonth: { [month: string]: { income: number; expense: number; count: number } };
        installmentsCount: number;
        debtorsCount: number;
        recurringCount: number;
    };
    transactions: ParsedTransaction[];
    installments: ParsedInstallment[];
    debtors: ParsedDebtor[];
    recurring: ParsedRecurring[];
    duplicates: {
        transaction: ParsedTransaction;
        existingId: string;
        existingDescription: string;
        existingDate: Date;
        existingAmount: number;
    }[];
    errors: {
        row: number;
        tab: string;
        message: string;
        data?: unknown;
    }[];
}

export interface ImportOptions {
    dashboardId: string;
    userId: string;
    skipDuplicates?: boolean;
    selectedTransactions?: number[]; // Índices das transações a importar
}

// ============================================
// PARSING HELPERS
// ============================================

const MONTH_NAMES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
                     'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

const MONTH_ABBREV: { [key: string]: number } = {
    'JAN': 0, 'FEV': 1, 'MAR': 2, 'ABR': 3, 'MAI': 4, 'JUN': 5,
    'JUL': 6, 'AGO': 7, 'SET': 8, 'OUT': 9, 'NOV': 10, 'DEZ': 11,
    'JANEIRO': 0, 'FEVEREIRO': 1, 'MARÇO': 2, 'ABRIL': 3, 'MAIO': 4, 'JUNHO': 5,
    'JULHO': 6, 'AGOSTO': 7, 'SETEMBRO': 8, 'OUTUBRO': 9, 'NOVEMBRO': 10, 'DEZEMBRO': 11
};

/**
 * Parse Brazilian currency format to number
 * Examples: "R$ 1.234,56" -> 1234.56, "1234,56" -> 1234.56
 */
function parseBRCurrency(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    
    const cleanValue = value
        .toString()
        .replace(/R\$\s*/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')  // Remove thousand separators
        .replace(',', '.');   // Replace decimal separator
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse Brazilian date format to Date
 * Examples: "21/01/2026" -> Date, "2026-01-21" -> Date
 * Also handles Date objects and JavaScript date strings
 */
function parseBRDate(value: string | Date | null | undefined): Date | undefined {
    if (!value) return undefined;
    
    // If it's already a valid Date object
    if (value instanceof Date) {
        if (!isNaN(value.getTime())) {
            return value;
        }
        return undefined;
    }
    
    const str = value.toString().trim();
    
    // Try DD/MM/YYYY format
    const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
        const [, day, month, year] = brMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Try YYYY-MM-DD format (ISO date part)
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Try parsing JavaScript Date string like "Tue Jan 20 2026 21:00:00..."
    // Pattern: Day Mon DD YYYY
    const jsDateMatch = str.match(/^\w{3}\s+(\w{3})\s+(\d{1,2})\s+(\d{4})/i);
    if (jsDateMatch) {
        const [, monthName, day, year] = jsDateMatch;
        const monthMap: { [key: string]: number } = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        const monthIndex = monthMap[monthName.toLowerCase()];
        if (monthIndex !== undefined) {
            return new Date(parseInt(year), monthIndex, parseInt(day));
        }
    }
    
    // Try parsing as Excel serial date
    const serial = parseFloat(str);
    if (!isNaN(serial) && serial > 25569) { // Excel epoch starts at 1900-01-01
        const utc = (serial - 25569) * 86400 * 1000;
        return new Date(utc);
    }
    
    // Try generic Date parsing as last resort
    const genericDate = new Date(str);
    if (!isNaN(genericDate.getTime())) {
        return genericDate;
    }
    
    return undefined;
}

/**
 * Normalize payment method from spreadsheet
 */
function normalizePaymentMethod(value: string | null | undefined): { method?: string; institution?: string } {
    if (!value) return {};
    
    const normalized = value.toString().trim().toLowerCase();
    
    // Known payment methods with institutions
    const methodMap: { [key: string]: { method: string; institution?: string } } = {
        'amazon': { method: 'Cartão de Crédito', institution: 'Amazon' },
        'inter': { method: 'Cartão de Crédito', institution: 'Inter' },
        'nubank': { method: 'Cartão de Crédito', institution: 'Nubank' },
        'nubank c f': { method: 'Cartão de Crédito', institution: 'Nubank' },
        'nubank c e': { method: 'Cartão de Crédito', institution: 'Nubank' },
        'pix': { method: 'PIX' },
        'débito': { method: 'Débito' },
        'debito': { method: 'Débito' },
        'dinheiro': { method: 'Dinheiro' },
        'transferência': { method: 'Transferência' },
        'transferencia': { method: 'Transferência' },
        'boleto': { method: 'Boleto' },
    };
    
    for (const [key, value] of Object.entries(methodMap)) {
        if (normalized.includes(key)) {
            return value;
        }
    }
    
    // If contains bank name, assume credit card
    if (normalized.includes('nuban') || normalized.includes('inter') || 
        normalized.includes('amazon') || normalized.includes('itau') ||
        normalized.includes('bradesco') || normalized.includes('santander')) {
        return { method: 'Cartão de Crédito', institution: value };
    }
    
    return { method: value };
}

/**
 * Normalize cost center value
 */
function normalizeCostCenter(value: string | null | undefined): CostCenterType {
    if (!value) return null;
    
    const normalized = value.toString().trim().toLowerCase();
    
    if (normalized.includes('essencial') && !normalized.includes('não')) {
        return 'Essencial';
    }
    if (normalized.includes('não essencial') || normalized.includes('nao essencial')) {
        return 'Não essencial';
    }
    if (normalized.includes('fixa') || normalized.includes('despesa fixa')) {
        return 'Despesa Fixa';
    }
    
    return null;
}

/**
 * Get cell value from ExcelJS
 */
function getCellValue(cell: ExcelJS.Cell | undefined): string {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    
    if (typeof cell.value === 'object') {
        if ('result' in cell.value) return String(cell.value.result ?? '');
        if ('text' in cell.value) return String(cell.value.text ?? '');
        if ('richText' in cell.value) {
            return (cell.value.richText as Array<{ text: string }>)
                .map(rt => rt.text)
                .join('');
        }
    }
    
    return String(cell.value);
}

/**
 * Get cell value as Date if possible, or raw value
 */
function getCellDateValue(cell: ExcelJS.Cell | undefined): Date | string | undefined {
    if (!cell || cell.value === null || cell.value === undefined) return undefined;
    
    // If it's already a Date object, return it
    if (cell.value instanceof Date) {
        return cell.value;
    }
    
    // If it's an object with result (formula), get the result
    if (typeof cell.value === 'object') {
        if ('result' in cell.value) {
            const result = cell.value.result;
            if (result instanceof Date) return result;
            return String(result ?? '');
        }
    }
    
    // Return as string for further parsing
    return String(cell.value);
}

// ============================================
// MONTHLY TAB PARSER (JAN, FEV, MAR, etc.)
// ============================================

interface MonthlyTabColumns {
    dateCol?: number;
    costCenterCol?: number;
    importantCol?: number;
    categoryCol?: number;
    descriptionCol?: number;
    paymentMethodCol?: number;
    valueCol?: number;
    // Receitas section
    receitaDateCol?: number;
    receitaDescCol?: number;
    receitaValueCol?: number;
}

function detectMonthlyColumns(worksheet: ExcelJS.Worksheet): MonthlyTabColumns {
    const columns: MonthlyTabColumns = {};
    
    // Scan first 5 rows for headers - check all columns up to 20
    for (let rowNum = 1; rowNum <= 5; rowNum++) {
        const row = worksheet.getRow(rowNum);
        
        for (let colNumber = 1; colNumber <= 20; colNumber++) {
            const cell = row.getCell(colNumber);
            const value = getCellValue(cell).toLowerCase().trim();
            
            // Skip empty cells
            if (!value) continue;
            
            // Despesas columns (usually on the left side, col 5-11)
            if (value === 'data' && !columns.dateCol) columns.dateCol = colNumber;
            if ((value.includes('centro') && value.includes('custo')) || value === 'centro d custo') {
                if (!columns.costCenterCol) columns.costCenterCol = colNumber;
            }
            if (value === 'importantes' || value === 'importancia') columns.importantCol = colNumber;
            if (value === 'categoria' && !columns.categoryCol) columns.categoryCol = colNumber;
            if ((value === 'descrição' || value === 'descricao' || value === 'descriçao') && !columns.descriptionCol) {
                columns.descriptionCol = colNumber;
            }
            if ((value === 'meio pg' || value === 'meio' || value === 'pagamento') && !columns.paymentMethodCol) {
                columns.paymentMethodCol = colNumber;
            }
            if (value === 'valor' && !columns.valueCol) columns.valueCol = colNumber;
            
            // Receitas section (usually starts around column 13)
            // Look for "Receitas" header in row 1 or 2
            if (value === 'receitas') {
                // Look for date, description and value columns in the next row
                const nextRow = worksheet.getRow(rowNum + 1);
                for (let c = colNumber; c <= colNumber + 5; c++) {
                    const headerVal = getCellValue(nextRow.getCell(c)).toLowerCase().trim();
                    if (headerVal === 'data' && !columns.receitaDateCol) columns.receitaDateCol = c;
                    if ((headerVal === 'descrição' || headerVal === 'descricao' || headerVal === 'descriçao') && !columns.receitaDescCol) {
                        columns.receitaDescCol = c;
                    }
                    if (headerVal === 'valor' && !columns.receitaValueCol) columns.receitaValueCol = c;
                }
            }
        }
    }
    
    // If we found dateCol and valueCol in different sections, fix potential mixups
    // Receita columns should be after valueCol (despesas)
    if (columns.dateCol && columns.valueCol && columns.receitaDateCol) {
        // Make sure receitaDateCol comes after despesas columns
        if (columns.receitaDateCol <= columns.valueCol) {
            // Reset receita columns if they're in wrong position
            columns.receitaDateCol = undefined;
            columns.receitaDescCol = undefined;
            columns.receitaValueCol = undefined;
        }
    }
    
    return columns;
}

function parseMonthlyTab(
    worksheet: ExcelJS.Worksheet, 
    tabName: string, 
    year: number
): { transactions: ParsedTransaction[]; errors: { row: number; tab: string; message: string }[] } {
    const transactions: ParsedTransaction[] = [];
    const errors: { row: number; tab: string; message: string }[] = [];
    const columns = detectMonthlyColumns(worksheet);
    
    // Determine month from tab name
    const monthIndex = MONTH_ABBREV[tabName.toUpperCase()] ?? -1;
    
    // Find data start row (after headers "Data")
    let dataStartRow = 3;
    if (columns.dateCol) {
        for (let i = 1; i <= 5; i++) {
            const cell = worksheet.getRow(i).getCell(columns.dateCol);
            const value = getCellValue(cell).toLowerCase().trim();
            if (value === 'data') {
                dataStartRow = i + 1;
                break;
            }
        }
    }
    
    // Parse Despesas
    if (columns.dateCol && columns.valueCol) {
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber < dataStartRow) return;
            
            // Use getCellDateValue for date columns to properly handle Date objects
            const rawDateValue = getCellDateValue(row.getCell(columns.dateCol!));
            const valueStr = getCellValue(row.getCell(columns.valueCol!));
            const description = getCellValue(row.getCell(columns.descriptionCol || columns.categoryCol || columns.dateCol! + 4));
            
            // Skip rows without date or value
            if (!rawDateValue || !valueStr) return;
            
            // Skip header-like rows
            const dateValueStr = typeof rawDateValue === 'string' ? rawDateValue.toLowerCase().trim() : '';
            if (dateValueStr === 'data' || dateValueStr.includes('total') || dateValueStr.includes('saldo')) return;
            
            const date = parseBRDate(rawDateValue);
            const amount = parseBRCurrency(valueStr);
            
            // Skip invalid dates or zero amounts
            if (!date || amount === 0) return;
            
            // Skip if description looks like a summary row
            if (!description || description.toLowerCase().includes('total')) return;
            
            const category = columns.categoryCol ? getCellValue(row.getCell(columns.categoryCol)) : 'Outros';
            
            // Skip "Devedores" category as these are tracked separately
            if (category.toLowerCase() === 'devedores') return;
            
            const costCenter = columns.costCenterCol 
                ? normalizeCostCenter(getCellValue(row.getCell(columns.costCenterCol)))
                : (columns.importantCol ? normalizeCostCenter(getCellValue(row.getCell(columns.importantCol))) : null);
            const paymentInfo = normalizePaymentMethod(
                columns.paymentMethodCol ? getCellValue(row.getCell(columns.paymentMethodCol)) : undefined
            );
            
            transactions.push({
                date,
                entryType: 'Despesa',
                flowType: costCenter === 'Despesa Fixa' ? 'Fixa' : 'Variável',
                costCenter,
                category: category || 'Outros',
                description,
                amount,
                paymentMethod: paymentInfo.method,
                institution: paymentInfo.institution,
                sourceTab: tabName,
                sourceRow: rowNumber,
            });
        });
    }
    
    // Parse Receitas (if columns found)
    if (columns.receitaDateCol && columns.receitaValueCol) {
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber < dataStartRow) return;
            
            // Use getCellDateValue for date columns to properly handle Date objects
            const rawDateValue = getCellDateValue(row.getCell(columns.receitaDateCol!));
            const valueStr = getCellValue(row.getCell(columns.receitaValueCol!));
            const description = columns.receitaDescCol 
                ? getCellValue(row.getCell(columns.receitaDescCol))
                : 'Receita';
            
            // Skip rows without date or value
            if (!rawDateValue || !valueStr) return;
            
            // Skip header rows
            const dateValueStr = typeof rawDateValue === 'string' ? rawDateValue.toLowerCase().trim() : '';
            if (dateValueStr === 'data' || dateValueStr.includes('total')) return;
            
            const date = parseBRDate(rawDateValue);
            const amount = parseBRCurrency(valueStr);
            
            // Skip invalid dates or zero amounts
            if (!date || amount === 0) return;
            
            transactions.push({
                date,
                entryType: 'Receita',
                flowType: 'Variável',
                category: 'Salário',
                description,
                amount,
                sourceTab: tabName,
                sourceRow: rowNumber,
            });
        });
    }
    
    return { transactions, errors };
}

// ============================================
// PARCELAMENTOS TAB PARSER
// ============================================

interface InstallmentColumns {
    yearCol?: number;
    monthCol?: number;
    dayCol?: number;
    descriptionCol?: number;
    installmentCol?: number;
    totalValueCol?: number;
    installmentValueCol?: number;
    categoryCol?: number;
    costCenterCol?: number;
    paymentMethodCol?: number;
    monthStartCol?: number; // First month column (FEVEREIRO, MARÇO, etc.)
}

function detectInstallmentColumns(worksheet: ExcelJS.Worksheet): InstallmentColumns {
    const columns: InstallmentColumns = {};
    
    // Scan first 3 rows for headers
    for (let rowNum = 1; rowNum <= 3; rowNum++) {
        const row = worksheet.getRow(rowNum);
        
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const value = getCellValue(cell).toLowerCase().trim();
            
            if (value === 'ano') columns.yearCol = colNumber;
            if (value === 'mês' || value === 'mes') columns.monthCol = colNumber;
            if (value === 'data' || value === 'dia') columns.dayCol = colNumber;
            if (value === 'descrição' || value === 'descricao') columns.descriptionCol = colNumber;
            if (value === 'q. prcl' || value === 'parcelas' || value === 'qtd') columns.installmentCol = colNumber;
            if (value === 'total') columns.totalValueCol = colNumber;
            if (value === 'parcela' || value === 'vlr parcela') columns.installmentValueCol = colNumber;
            if (value === 'categoria') columns.categoryCol = colNumber;
            if (value.includes('centro') && value.includes('custo')) columns.costCenterCol = colNumber;
            if (value === 'meio' || value === 'pagamento') columns.paymentMethodCol = colNumber;
            
            // Detect month columns
            if (MONTH_NAMES.includes(value.toUpperCase())) {
                if (!columns.monthStartCol || colNumber < columns.monthStartCol) {
                    columns.monthStartCol = colNumber;
                }
            }
        });
    }
    
    return columns;
}

function parseInstallmentsTab(
    worksheet: ExcelJS.Worksheet
): { installments: ParsedInstallment[]; errors: { row: number; tab: string; message: string }[] } {
    const installments: ParsedInstallment[] = [];
    const errors: { row: number; tab: string; message: string }[] = [];
    const columns = detectInstallmentColumns(worksheet);
    
    // Find data start row
    let dataStartRow = 2;
    for (let i = 1; i <= 3; i++) {
        const row = worksheet.getRow(i);
        let hasHeader = false;
        row.eachCell((cell) => {
            const val = getCellValue(cell).toLowerCase();
            if (val === 'descrição' || val === 'descricao' || val === 'total') hasHeader = true;
        });
        if (hasHeader) {
            dataStartRow = i + 1;
            break;
        }
    }
    
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber < dataStartRow) return;
        
        const description = columns.descriptionCol 
            ? getCellValue(row.getCell(columns.descriptionCol))
            : '';
        
        if (!description || description.trim() === '') return;
        
        const totalValue = columns.totalValueCol 
            ? parseBRCurrency(getCellValue(row.getCell(columns.totalValueCol)))
            : 0;
        const installmentValue = columns.installmentValueCol
            ? parseBRCurrency(getCellValue(row.getCell(columns.installmentValueCol)))
            : 0;
        const installmentTotal = columns.installmentCol
            ? parseInt(getCellValue(row.getCell(columns.installmentCol))) || 0
            : 0;
        
        if (totalValue === 0 && installmentValue === 0) return;
        
        // Parse monthly values
        const monthlyAmounts: { [month: string]: number } = {};
        if (columns.monthStartCol) {
            MONTH_NAMES.forEach((month, index) => {
                const cell = row.getCell(columns.monthStartCol! + index);
                const value = parseBRCurrency(getCellValue(cell));
                if (value > 0) {
                    monthlyAmounts[month] = value;
                }
            });
        }
        
        const paymentInfo = columns.paymentMethodCol 
            ? normalizePaymentMethod(getCellValue(row.getCell(columns.paymentMethodCol)))
            : {};
        
        installments.push({
            year: columns.yearCol ? parseInt(getCellValue(row.getCell(columns.yearCol))) || undefined : undefined,
            month: columns.monthCol ? getCellValue(row.getCell(columns.monthCol)) : undefined,
            day: columns.dayCol ? parseInt(getCellValue(row.getCell(columns.dayCol))) || undefined : undefined,
            description,
            installmentNumber: 1,
            installmentTotal,
            totalAmount: totalValue,
            installmentAmount: installmentValue || (installmentTotal > 0 ? totalValue / installmentTotal : totalValue),
            category: columns.categoryCol ? getCellValue(row.getCell(columns.categoryCol)) : undefined,
            costCenter: columns.costCenterCol 
                ? normalizeCostCenter(getCellValue(row.getCell(columns.costCenterCol))) 
                : undefined,
            paymentMethod: paymentInfo.method,
            monthlyAmounts,
            sourceRow: rowNumber,
        });
    });
    
    return { installments, errors };
}

// ============================================
// DEVEDORES TAB PARSER
// ============================================

function parseDebtorsTab(
    worksheet: ExcelJS.Worksheet
): { debtors: ParsedDebtor[]; errors: { row: number; tab: string; message: string }[] } {
    const debtors: ParsedDebtor[] = [];
    const errors: { row: number; tab: string; message: string }[] = [];
    
    // Detect columns
    let nameCol = 0, descCol = 0, valueCol = 0, dateCol = 0;
    
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
        const value = getCellValue(cell).toLowerCase();
        if (value === 'nome' || value === 'devedor') nameCol = colNumber;
        if (value === 'descrição' || value === 'descricao' || value === 'motivo') descCol = colNumber;
        if (value === 'valor' || value === 'quantia') valueCol = colNumber;
        if (value === 'data') dateCol = colNumber;
    });
    
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        
        const name = nameCol ? getCellValue(row.getCell(nameCol)) : '';
        const description = descCol ? getCellValue(row.getCell(descCol)) : '';
        const amount = valueCol ? parseBRCurrency(getCellValue(row.getCell(valueCol))) : 0;
        
        if (!name || amount === 0) return;
        
        debtors.push({
            name,
            description,
            amount,
            date: dateCol ? parseBRDate(getCellValue(row.getCell(dateCol))) : undefined,
            sourceRow: rowNumber,
        });
    });
    
    return { debtors, errors };
}

// ============================================
// D. FIXA (DESPESA FIXA) TAB PARSER
// ============================================

function parseRecurringTab(
    worksheet: ExcelJS.Worksheet
): { recurring: ParsedRecurring[]; errors: { row: number; tab: string; message: string }[] } {
    const recurring: ParsedRecurring[] = [];
    const errors: { row: number; tab: string; message: string }[] = [];
    
    // Detect columns
    let descCol = 0, valueCol = 0, categoryCol = 0;
    
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
        const value = getCellValue(cell).toLowerCase();
        if (value === 'descrição' || value === 'descricao' || value === 'despesa') descCol = colNumber;
        if (value === 'valor' || value === 'quantia') valueCol = colNumber;
        if (value === 'categoria') categoryCol = colNumber;
    });
    
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        
        const description = descCol ? getCellValue(row.getCell(descCol)) : '';
        const amount = valueCol ? parseBRCurrency(getCellValue(row.getCell(valueCol))) : 0;
        
        if (!description || amount === 0) return;
        
        recurring.push({
            description,
            amount,
            category: categoryCol ? getCellValue(row.getCell(categoryCol)) : undefined,
            frequency: 'MONTHLY',
            sourceRow: rowNumber,
        });
    });
    
    return { recurring, errors };
}

// ============================================
// GERAL TAB PARSER (Summary)
// ============================================

interface GeralData {
    incomeBySource: { [source: string]: { [month: string]: number } };
    expenseByCategory: { [category: string]: { [month: string]: number } };
    totals: {
        totalIncome: { [month: string]: number };
        totalExpense: { [month: string]: number };
        balance: { [month: string]: number };
    };
}

function parseGeralTab(worksheet: ExcelJS.Worksheet): GeralData {
    const data: GeralData = {
        incomeBySource: {},
        expenseByCategory: {},
        totals: {
            totalIncome: {},
            totalExpense: {},
            balance: {},
        }
    };
    
    let currentSection = '';
    let monthColumns: { [col: number]: string } = {};
    
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const firstCell = getCellValue(row.getCell(1)).trim();
        const secondCell = getCellValue(row.getCell(2)).trim().toUpperCase();
        
        // Detect section
        if (secondCell === 'ENTRADA' || firstCell === 'ENTRADA') {
            currentSection = 'ENTRADA';
            return;
        }
        if (secondCell === 'SAÍDA' || firstCell === 'SAÍDA') {
            currentSection = 'SAIDA';
            return;
        }
        if (secondCell === 'SALDO' || firstCell === 'SALDO') {
            currentSection = 'SALDO';
            return;
        }
        
        // Detect month columns from header row
        row.eachCell((cell, colNumber) => {
            const value = getCellValue(cell).toUpperCase().trim();
            if (MONTH_NAMES.includes(value)) {
                monthColumns[colNumber] = value;
            }
        });
        
        // Parse data based on section
        const rowLabel = secondCell || firstCell;
        if (!rowLabel) return;
        
        if (currentSection === 'ENTRADA') {
            if (rowLabel !== 'ENTRADA' && !rowLabel.includes('RENDA MENSAL')) {
                data.incomeBySource[rowLabel] = {};
                for (const [col, month] of Object.entries(monthColumns)) {
                    const value = parseBRCurrency(getCellValue(row.getCell(parseInt(col))));
                    if (value > 0) {
                        data.incomeBySource[rowLabel][month] = value;
                    }
                }
            }
            if (rowLabel.includes('RENDA MENSAL TOTAL')) {
                for (const [col, month] of Object.entries(monthColumns)) {
                    const value = parseBRCurrency(getCellValue(row.getCell(parseInt(col))));
                    data.totals.totalIncome[month] = value;
                }
            }
        }
        
        if (currentSection === 'SAIDA') {
            if (rowLabel !== 'SAÍDA' && !rowLabel.includes('TOTAL SAÍDAS')) {
                data.expenseByCategory[rowLabel] = {};
                for (const [col, month] of Object.entries(monthColumns)) {
                    const value = parseBRCurrency(getCellValue(row.getCell(parseInt(col))));
                    if (value > 0) {
                        data.expenseByCategory[rowLabel][month] = value;
                    }
                }
            }
            if (rowLabel.includes('TOTAL SAÍDAS')) {
                for (const [col, month] of Object.entries(monthColumns)) {
                    const value = parseBRCurrency(getCellValue(row.getCell(parseInt(col))));
                    data.totals.totalExpense[month] = value;
                }
            }
        }
    });
    
    return data;
}

// ============================================
// MAIN PARSING FUNCTIONS
// ============================================

/**
 * Parse XLSX file with multiple tabs
 */
export async function parseXLSXFile(buffer: Buffer | ArrayBuffer): Promise<ImportPreview> {
    const workbook = new ExcelJS.Workbook();
    // @ts-ignore - Buffer type compatibility
    await workbook.xlsx.load(buffer);
    
    const preview: ImportPreview = {
        summary: {
            totalTransactions: 0,
            totalIncome: 0,
            totalExpense: 0,
            byMonth: {},
            installmentsCount: 0,
            debtorsCount: 0,
            recurringCount: 0,
        },
        transactions: [],
        installments: [],
        debtors: [],
        recurring: [],
        duplicates: [],
        errors: [],
    };
    
    const currentYear = new Date().getFullYear();
    
    // Process each worksheet
    workbook.eachSheet((worksheet, sheetId) => {
        const tabName = worksheet.name.toUpperCase().trim();
        
        // Skip empty worksheets
        if (worksheet.rowCount === 0) return;
        
        try {
            // Monthly tabs (JAN, FEV, MAR, etc.)
            if (MONTH_ABBREV[tabName] !== undefined) {
                const { transactions, errors } = parseMonthlyTab(worksheet, tabName, currentYear);
                preview.transactions.push(...transactions);
                preview.errors.push(...errors);
            }
            // PARCELAMENTOS tab
            else if (tabName.includes('PARCELAMENTO') || tabName.includes('PARCELA')) {
                const { installments, errors } = parseInstallmentsTab(worksheet);
                preview.installments.push(...installments);
                preview.errors.push(...errors);
            }
            // DEVEDORES tab
            else if (tabName.includes('DEVEDOR')) {
                const { debtors, errors } = parseDebtorsTab(worksheet);
                preview.debtors.push(...debtors);
                preview.errors.push(...errors);
            }
            // D. FIXA or DESPESA FIXA tab
            else if (tabName.includes('FIXA') || tabName === 'D. FIXA') {
                const { recurring, errors } = parseRecurringTab(worksheet);
                preview.recurring.push(...recurring);
                preview.errors.push(...errors);
            }
            // GERAL tab - parse for reference but don't create transactions
            else if (tabName === 'GERAL') {
                const geralData = parseGeralTab(worksheet);
                // Use GERAL data to fill in missing totals in summary
                for (const [month, value] of Object.entries(geralData.totals.totalIncome)) {
                    if (!preview.summary.byMonth[month]) {
                        preview.summary.byMonth[month] = { income: 0, expense: 0, count: 0 };
                    }
                    // This is reference data, actual will be calculated from transactions
                }
            }
        } catch (error) {
            preview.errors.push({
                row: 0,
                tab: tabName,
                message: `Erro ao processar aba: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            });
        }
    });
    
    // Calculate summary
    preview.transactions.forEach(t => {
        if (t.entryType === 'Receita') {
            preview.summary.totalIncome += t.amount;
        } else {
            preview.summary.totalExpense += t.amount;
        }
        
        const monthKey = t.date.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
        if (!preview.summary.byMonth[monthKey]) {
            preview.summary.byMonth[monthKey] = { income: 0, expense: 0, count: 0 };
        }
        preview.summary.byMonth[monthKey].count++;
        if (t.entryType === 'Receita') {
            preview.summary.byMonth[monthKey].income += t.amount;
        } else {
            preview.summary.byMonth[monthKey].expense += t.amount;
        }
    });
    
    preview.summary.totalTransactions = preview.transactions.length;
    preview.summary.installmentsCount = preview.installments.length;
    preview.summary.debtorsCount = preview.debtors.length;
    preview.summary.recurringCount = preview.recurring.length;
    
    return preview;
}

/**
 * Parse CSV file (single tab)
 */
export async function parseCSVFile(buffer: Buffer, tabType: 'monthly' | 'installments' | 'debtors' | 'recurring' = 'monthly'): Promise<ImportPreview> {
    const content = buffer.toString('utf-8');
    
    // Detect delimiter (semicolon for Brazilian CSVs, comma otherwise)
    const firstLine = content.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    const records: Record<string, string>[] = parse(content, {
        delimiter,
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
    });
    
    const preview: ImportPreview = {
        summary: {
            totalTransactions: 0,
            totalIncome: 0,
            totalExpense: 0,
            byMonth: {},
            installmentsCount: 0,
            debtorsCount: 0,
            recurringCount: 0,
        },
        transactions: [],
        installments: [],
        debtors: [],
        recurring: [],
        duplicates: [],
        errors: [],
    };
    
    records.forEach((record: Record<string, string>, index: number) => {
        try {
            // Normalize column names (lowercase, remove accents)
            const normalizedRecord: Record<string, string> = {};
            for (const [key, value] of Object.entries(record)) {
                const normalizedKey = key.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim();
                normalizedRecord[normalizedKey] = value as string;
            }
            
            const dateStr = normalizedRecord['data'] || normalizedRecord['date'];
            const description = normalizedRecord['descricao'] || normalizedRecord['description'] || '';
            const valueStr = normalizedRecord['valor'] || normalizedRecord['value'] || normalizedRecord['amount'];
            const category = normalizedRecord['categoria'] || normalizedRecord['category'] || 'Outros';
            const type = normalizedRecord['tipo'] || normalizedRecord['type'] || 'Despesa';
            const paymentMethod = normalizedRecord['meio pg'] || normalizedRecord['meio'] || normalizedRecord['payment'];
            const costCenter = normalizedRecord['centro de custo'] || normalizedRecord['importantes'];
            
            const date = parseBRDate(dateStr);
            const amount = parseBRCurrency(valueStr);
            
            if (!date || !description) {
                preview.errors.push({
                    row: index + 2,
                    tab: 'CSV',
                    message: 'Data ou descrição inválida',
                    data: record,
                });
                return;
            }
            
            const paymentInfo = normalizePaymentMethod(paymentMethod);
            
            preview.transactions.push({
                date,
                entryType: type.toLowerCase().includes('receita') ? 'Receita' : 'Despesa',
                flowType: 'Variável',
                costCenter: normalizeCostCenter(costCenter),
                category,
                description,
                amount,
                paymentMethod: paymentInfo.method,
                institution: paymentInfo.institution,
                sourceTab: 'CSV',
                sourceRow: index + 2,
            });
        } catch (error) {
            preview.errors.push({
                row: index + 2,
                tab: 'CSV',
                message: error instanceof Error ? error.message : 'Erro desconhecido',
                data: record,
            });
        }
    });
    
    // Calculate summary
    preview.transactions.forEach(t => {
        if (t.entryType === 'Receita') {
            preview.summary.totalIncome += t.amount;
        } else {
            preview.summary.totalExpense += t.amount;
        }
    });
    preview.summary.totalTransactions = preview.transactions.length;
    
    return preview;
}

// ============================================
// DUPLICATE DETECTION
// ============================================

export async function detectDuplicates(
    transactions: ParsedTransaction[],
    dashboardId: string
): Promise<ImportPreview['duplicates']> {
    const duplicates: ImportPreview['duplicates'] = [];
    
    for (const transaction of transactions) {
        // Find potential duplicates by date, amount, and similar description
        const startOfDay = new Date(transaction.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(transaction.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existing = await prisma.transaction.findFirst({
            where: {
                dashboardId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                amount: {
                    gte: transaction.amount * 0.99,
                    lte: transaction.amount * 1.01,
                },
                deletedAt: null,
            },
        });
        
        if (existing) {
            duplicates.push({
                transaction,
                existingId: existing.id,
                existingDescription: existing.description,
                existingDate: existing.date,
                existingAmount: existing.amount,
            });
        }
    }
    
    return duplicates;
}

// ============================================
// IMPORT TO DATABASE
// ============================================

export async function importTransactions(
    preview: ImportPreview,
    options: ImportOptions
): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const result = { imported: 0, skipped: 0, errors: [] as string[] };
    
    const transactionsToImport = options.selectedTransactions
        ? preview.transactions.filter((_, i) => options.selectedTransactions!.includes(i))
        : preview.transactions;
    
    // Get duplicate IDs to skip
    const duplicateIndices = new Set(
        preview.duplicates.map(d => 
            preview.transactions.findIndex(t => 
                t.sourceRow === d.transaction.sourceRow && t.sourceTab === d.transaction.sourceTab
            )
        )
    );
    
    for (let i = 0; i < transactionsToImport.length; i++) {
        const t = transactionsToImport[i];
        const originalIndex = preview.transactions.indexOf(t);
        
        // Skip duplicates if option is set
        if (options.skipDuplicates && duplicateIndices.has(originalIndex)) {
            result.skipped++;
            continue;
        }
        
        try {
            // Note: costCenter field requires migration to be applied first
            const transactionData: any = {
                date: t.date,
                dueDate: t.dueDate,
                entryType: t.entryType,
                flowType: t.flowType,
                costCenter: t.costCenter, // Available after migration
                category: t.category,
                subcategory: t.subcategory,
                description: t.description,
                amount: t.amount,
                paymentMethod: t.paymentMethod,
                institution: t.institution,
                cardBrand: t.cardBrand,
                installmentNumber: t.installmentNumber || 0,
                installmentTotal: t.installmentTotal || 0,
                installmentStatus: 'N/A',
                notes: t.notes,
                isThirdParty: t.isThirdParty || false,
                thirdPartyName: t.thirdPartyName,
                dashboardId: options.dashboardId,
                userId: options.userId,
            };
            await prisma.transaction.create({ data: transactionData });
            result.imported++;
        } catch (error) {
            result.errors.push(`Erro na linha ${t.sourceRow} (${t.sourceTab}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }
    
    // Import installments as transactions
    for (const installment of preview.installments) {
        const installmentGroupId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create a transaction for each month that has a value
        let installmentNum = 1;
        for (const [month, amount] of Object.entries(installment.monthlyAmounts)) {
            if (amount <= 0) continue;
            
            const monthIndex = MONTH_ABBREV[month];
            if (monthIndex === undefined) continue;
            
            const year = installment.year || new Date().getFullYear();
            const day = installment.day || 1;
            
            try {
                // Note: costCenter field requires migration to be applied first
                const installmentData: any = {
                    date: new Date(year, monthIndex, day),
                    entryType: 'Despesa',
                    flowType: 'Variável',
                    costCenter: installment.costCenter, // Available after migration
                    category: installment.category || 'Parcelamentos',
                    description: installment.description,
                    amount,
                    paymentMethod: installment.paymentMethod,
                    installmentNumber: installmentNum,
                    installmentTotal: installment.installmentTotal,
                    installmentStatus: 'Pendente',
                    installmentGroupId,
                    dashboardId: options.dashboardId,
                    userId: options.userId,
                };
                await prisma.transaction.create({ data: installmentData });
                installmentNum++;
                result.imported++;
            } catch (error) {
                result.errors.push(`Erro no parcelamento "${installment.description}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            }
        }
    }
    
    // Import debtors as third-party transactions
    for (const debtor of preview.debtors) {
        try {
            await prisma.transaction.create({
                data: {
                    date: debtor.date || new Date(),
                    entryType: 'Despesa',
                    flowType: 'Variável',
                    category: 'Devedores',
                    description: debtor.description || `Dívida de ${debtor.name}`,
                    amount: debtor.amount,
                    isThirdParty: true,
                    thirdPartyName: debtor.name,
                    thirdPartyDescription: debtor.description,
                    dashboardId: options.dashboardId,
                    userId: options.userId,
                },
            });
            result.imported++;
        } catch (error) {
            result.errors.push(`Erro no devedor "${debtor.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }
    
    // Import recurring transactions
    for (const rec of preview.recurring) {
        try {
            await prisma.recurringTransaction.create({
                data: {
                    entryType: 'Despesa',
                    flowType: 'Fixa',
                    category: rec.category || 'Despesa Fixa',
                    description: rec.description,
                    amount: rec.amount,
                    frequency: rec.frequency,
                    interval: 1,
                    startDate: new Date(),
                    nextDate: new Date(),
                    dashboardId: options.dashboardId,
                    userId: options.userId,
                },
            });
            result.imported++;
        } catch (error) {
            result.errors.push(`Erro na despesa fixa "${rec.description}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }
    
    return result;
}
