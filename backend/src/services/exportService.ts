import ExcelJS from 'exceljs';
import { Transaction, RecurringTransaction } from '@prisma/client';
import archiver from 'archiver';

// Extended transaction type to include costCenter (after migration)
type TransactionWithCostCenter = Transaction & { costCenter?: string | null };

export interface ExportOptions {
    format: 'csv' | 'xlsx';
    transactions: TransactionWithCostCenter[];
    dashboardName?: string;
}

export interface FinancialReportOptions {
    transactions: TransactionWithCostCenter[];
    recurringTransactions?: RecurringTransaction[];
    dashboardName?: string;
    year: number;
}

const MONTH_NAMES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
                     'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

const MONTH_ABBREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/**
 * Format a date to Brazilian format (DD/MM/YYYY)
 */
function formatDateBR(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
}

/**
 * Format amount to Brazilian currency format (without R$ symbol)
 */
function formatAmountBR(amount: number): string {
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Generate CSV content from transactions
 */
export function generateCSV(transactions: Transaction[]): string {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility

    const headers = [
        'Data',
        'Data Vencimento',
        'Tipo',
        'Fluxo',
        'Categoria',
        'Subcategoria',
        'Descrição',
        'Valor',
        'Método Pagamento',
        'Instituição',
        'Bandeira Cartão',
        'Parcela Atual',
        'Total Parcelas',
        'Status Parcela',
        'Observações',
        'Terceiro',
        'Nome Terceiro',
        'Descrição Terceiro',
        'Criado em',
    ];

    const rows = transactions.map(t => [
        formatDateBR(t.date),
        formatDateBR(t.dueDate),
        t.entryType,
        t.flowType,
        t.category,
        t.subcategory || '',
        // Escape description for CSV (handle quotes and newlines)
        `"${(t.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        formatAmountBR(t.amount),
        t.paymentMethod || '',
        t.institution || '',
        t.cardBrand || '',
        t.installmentNumber,
        t.installmentTotal,
        t.installmentStatus,
        `"${(t.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        t.isThirdParty ? 'Sim' : 'Não',
        t.thirdPartyName || '',
        `"${(t.thirdPartyDescription || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        formatDateBR(t.createdAt),
    ].join(';'));

    return BOM + headers.join(';') + '\n' + rows.join('\n');
}

/**
 * Generate XLSX workbook from transactions
 */
export async function generateXLSX(transactions: Transaction[], dashboardName?: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Finanças Dashboard';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(dashboardName || 'Transações');

    // Define columns with proper formatting
    worksheet.columns = [
        { header: 'Data', key: 'date', width: 12 },
        { header: 'Data Vencimento', key: 'dueDate', width: 14 },
        { header: 'Tipo', key: 'entryType', width: 10 },
        { header: 'Fluxo', key: 'flowType', width: 10 },
        { header: 'Categoria', key: 'category', width: 18 },
        { header: 'Subcategoria', key: 'subcategory', width: 15 },
        { header: 'Descrição', key: 'description', width: 35 },
        { header: 'Valor', key: 'amount', width: 14 },
        { header: 'Método Pagamento', key: 'paymentMethod', width: 18 },
        { header: 'Instituição', key: 'institution', width: 15 },
        { header: 'Bandeira Cartão', key: 'cardBrand', width: 14 },
        { header: 'Parcela', key: 'installmentNumber', width: 10 },
        { header: 'Total Parcelas', key: 'installmentTotal', width: 14 },
        { header: 'Status Parcela', key: 'installmentStatus', width: 14 },
        { header: 'Observações', key: 'notes', width: 30 },
        { header: 'Terceiro', key: 'isThirdParty', width: 10 },
        { header: 'Nome Terceiro', key: 'thirdPartyName', width: 18 },
        { header: 'Descrição Terceiro', key: 'thirdPartyDescription', width: 25 },
        { header: 'Criado em', key: 'createdAt', width: 12 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7C3AED' }, // Purple color
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add data rows
    transactions.forEach((t, index) => {
        const row = worksheet.addRow({
            date: formatDateBR(t.date),
            dueDate: formatDateBR(t.dueDate),
            entryType: t.entryType,
            flowType: t.flowType,
            category: t.category,
            subcategory: t.subcategory || '',
            description: t.description,
            amount: t.amount,
            paymentMethod: t.paymentMethod || '',
            institution: t.institution || '',
            cardBrand: t.cardBrand || '',
            installmentNumber: t.installmentNumber,
            installmentTotal: t.installmentTotal,
            installmentStatus: t.installmentStatus,
            notes: t.notes || '',
            isThirdParty: t.isThirdParty ? 'Sim' : 'Não',
            thirdPartyName: t.thirdPartyName || '',
            thirdPartyDescription: t.thirdPartyDescription || '',
            createdAt: formatDateBR(t.createdAt),
        });

        // Alternate row colors
        if (index % 2 === 0) {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF3F0FF' }, // Light purple
            };
        }

        // Style based on entry type
        const typeCell = row.getCell('entryType');
        if (t.entryType === 'Receita') {
            typeCell.font = { color: { argb: 'FF10B981' } }; // Green
        } else {
            typeCell.font = { color: { argb: 'FFEF4444' } }; // Red
        }

        // Format amount cell
        const amountCell = row.getCell('amount');
        amountCell.numFmt = 'R$ #,##0.00';
        if (t.entryType === 'Receita') {
            amountCell.font = { color: { argb: 'FF10B981' } };
        } else {
            amountCell.font = { color: { argb: 'FFEF4444' } };
        }
    });

    // Add totals row
    const lastRowNum = worksheet.rowCount;
    const totalIncome = transactions
        .filter(t => t.entryType === 'Receita')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
        .filter(t => t.entryType === 'Despesa')
        .reduce((sum, t) => sum + t.amount, 0);

    worksheet.addRow([]); // Empty row
    const summaryRow1 = worksheet.addRow({
        description: 'TOTAL RECEITAS:',
        amount: totalIncome,
    });
    summaryRow1.font = { bold: true };
    summaryRow1.getCell('amount').font = { bold: true, color: { argb: 'FF10B981' } };
    summaryRow1.getCell('amount').numFmt = 'R$ #,##0.00';

    const summaryRow2 = worksheet.addRow({
        description: 'TOTAL DESPESAS:',
        amount: totalExpense,
    });
    summaryRow2.font = { bold: true };
    summaryRow2.getCell('amount').font = { bold: true, color: { argb: 'FFEF4444' } };
    summaryRow2.getCell('amount').numFmt = 'R$ #,##0.00';

    const summaryRow3 = worksheet.addRow({
        description: 'SALDO:',
        amount: totalIncome - totalExpense,
    });
    summaryRow3.font = { bold: true };
    const balanceColor = totalIncome - totalExpense >= 0 ? 'FF10B981' : 'FFEF4444';
    summaryRow3.getCell('amount').font = { bold: true, color: { argb: balanceColor } };
    summaryRow3.getCell('amount').numFmt = 'R$ #,##0.00';

    // Add filter to all columns
    worksheet.autoFilter = {
        from: 'A1',
        to: `S${lastRowNum}`,
    };

    // Freeze header row
    worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

// ============================================
// MULTI-TAB FINANCIAL REPORT EXPORT
// ============================================

/**
 * Style configuration for the report
 */
const STYLES = {
    header: {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF7C3AED' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    },
    sectionHeader: {
        font: { bold: true, size: 14 },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE9D5FF' } },
    },
    income: {
        font: { color: { argb: 'FF10B981' } },
    },
    expense: {
        font: { color: { argb: 'FFEF4444' } },
    },
    total: {
        font: { bold: true },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF3F0FF' } },
    },
    currency: 'R$ #,##0.00',
};

/**
 * Apply header style to a row
 */
function applyHeaderStyle(row: ExcelJS.Row) {
    row.font = STYLES.header.font;
    row.fill = STYLES.header.fill;
    row.alignment = STYLES.header.alignment;
    row.height = 25;
}

/**
 * Generate GERAL (summary) worksheet
 */
function generateGeralSheet(
    workbook: ExcelJS.Workbook,
    transactions: TransactionWithCostCenter[],
    year: number
): ExcelJS.Worksheet {
    const sheet = workbook.addWorksheet('GERAL');
    
    // Title
    sheet.mergeCells('A1:N1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'CONTROLE GERAL MENSAL';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    
    // Reference month
    sheet.getCell('A2').value = 'Mês de referência:';
    sheet.getCell('B2').value = `${MONTH_NAMES[new Date().getMonth()].toLowerCase()} ${year}`;
    
    // ENTRADA section
    let currentRow = 4;
    sheet.getCell(`B${currentRow}`).value = 'ENTRADA';
    sheet.getCell(`B${currentRow}`).font = { bold: true, size: 12 };
    
    currentRow++;
    // Month headers
    sheet.getCell(`B${currentRow}`).value = '';
    MONTH_NAMES.forEach((month, i) => {
        const col = String.fromCharCode(67 + i); // C, D, E...
        sheet.getCell(`${col}${currentRow}`).value = month;
        sheet.getCell(`${col}${currentRow}`).font = { bold: true };
        sheet.getCell(`${col}${currentRow}`).alignment = { horizontal: 'center' };
    });
    
    // Income by source (group by thirdPartyName for "who" or category)
    const incomeBySource: { [source: string]: { [month: number]: number } } = {};
    transactions
        .filter(t => t.entryType === 'Receita' && new Date(t.date).getFullYear() === year)
        .forEach(t => {
            const source = t.thirdPartyName || t.category || 'Outros';
            const month = new Date(t.date).getMonth();
            if (!incomeBySource[source]) incomeBySource[source] = {};
            incomeBySource[source][month] = (incomeBySource[source][month] || 0) + t.amount;
        });
    
    currentRow++;
    for (const [source, months] of Object.entries(incomeBySource)) {
        sheet.getCell(`B${currentRow}`).value = source;
        MONTH_NAMES.forEach((_, i) => {
            const col = String.fromCharCode(67 + i);
            const cell = sheet.getCell(`${col}${currentRow}`);
            cell.value = months[i] || 0;
            cell.numFmt = STYLES.currency;
        });
        currentRow++;
    }
    
    // Total income row
    sheet.getCell(`B${currentRow}`).value = 'RENDA MENSAL TOTAL';
    sheet.getCell(`B${currentRow}`).font = { bold: true };
    MONTH_NAMES.forEach((_, i) => {
        const col = String.fromCharCode(67 + i);
        const cell = sheet.getCell(`${col}${currentRow}`);
        const monthTotal = transactions
            .filter(t => t.entryType === 'Receita' && new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === i)
            .reduce((sum, t) => sum + t.amount, 0);
        cell.value = monthTotal;
        cell.numFmt = STYLES.currency;
        cell.font = { bold: true, color: { argb: 'FF10B981' } };
    });
    
    // SAÍDA section
    currentRow += 2;
    sheet.getCell(`B${currentRow}`).value = 'SAÍDA';
    sheet.getCell(`B${currentRow}`).font = { bold: true, size: 12 };
    
    currentRow++;
    // Month headers again
    MONTH_NAMES.forEach((month, i) => {
        const col = String.fromCharCode(67 + i);
        sheet.getCell(`${col}${currentRow}`).value = month;
        sheet.getCell(`${col}${currentRow}`).font = { bold: true };
        sheet.getCell(`${col}${currentRow}`).alignment = { horizontal: 'center' };
    });
    
    // Expense categories
    const expenseCategories = ['PARCELAMENTOS', 'DESPESA FIXA', 'COMPARTILHADO', 'DESPESA VARIÁVEL'];
    currentRow++;
    
    for (const category of expenseCategories) {
        sheet.getCell(`B${currentRow}`).value = category;
        MONTH_NAMES.forEach((_, i) => {
            const col = String.fromCharCode(67 + i);
            const cell = sheet.getCell(`${col}${currentRow}`);
            
            let monthTotal = 0;
            if (category === 'PARCELAMENTOS') {
                monthTotal = transactions
                    .filter(t => t.entryType === 'Despesa' && t.installmentTotal > 0 && 
                            new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === i)
                    .reduce((sum, t) => sum + t.amount, 0);
            } else if (category === 'DESPESA FIXA') {
                monthTotal = transactions
                    .filter(t => t.entryType === 'Despesa' && (t.flowType === 'Fixa' || t.costCenter === 'Despesa Fixa') &&
                            new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === i)
                    .reduce((sum, t) => sum + t.amount, 0);
            } else if (category === 'COMPARTILHADO') {
                monthTotal = transactions
                    .filter(t => t.entryType === 'Despesa' && t.isThirdParty &&
                            new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === i)
                    .reduce((sum, t) => sum + t.amount, 0);
            } else {
                monthTotal = transactions
                    .filter(t => t.entryType === 'Despesa' && t.flowType === 'Variável' && !t.installmentTotal && !t.isThirdParty &&
                            new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === i)
                    .reduce((sum, t) => sum + t.amount, 0);
            }
            
            cell.value = monthTotal;
            cell.numFmt = STYLES.currency;
        });
        currentRow++;
    }
    
    // Total expenses row
    sheet.getCell(`B${currentRow}`).value = 'TOTAL SAÍDAS';
    sheet.getCell(`B${currentRow}`).font = { bold: true };
    MONTH_NAMES.forEach((_, i) => {
        const col = String.fromCharCode(67 + i);
        const cell = sheet.getCell(`${col}${currentRow}`);
        const monthTotal = transactions
            .filter(t => t.entryType === 'Despesa' && new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === i)
            .reduce((sum, t) => sum + t.amount, 0);
        cell.value = monthTotal;
        cell.numFmt = STYLES.currency;
        cell.font = { bold: true, color: { argb: 'FFEF4444' } };
    });
    
    // SALDO section
    currentRow += 2;
    sheet.getCell(`B${currentRow}`).value = 'SALDO';
    sheet.getCell(`B${currentRow}`).font = { bold: true, size: 12 };
    
    currentRow++;
    MONTH_NAMES.forEach((month, i) => {
        const col = String.fromCharCode(67 + i);
        sheet.getCell(`${col}${currentRow}`).value = month;
        sheet.getCell(`${col}${currentRow}`).font = { bold: true };
    });
    
    currentRow++;
    sheet.getCell(`B${currentRow}`).value = 'SALDO REAL';
    sheet.getCell(`B${currentRow}`).font = { bold: true };
    MONTH_NAMES.forEach((_, i) => {
        const col = String.fromCharCode(67 + i);
        const cell = sheet.getCell(`${col}${currentRow}`);
        const income = transactions
            .filter(t => t.entryType === 'Receita' && new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === i)
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions
            .filter(t => t.entryType === 'Despesa' && new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === i)
            .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;
        cell.value = balance;
        cell.numFmt = STYLES.currency;
        cell.font = { bold: true, color: { argb: balance >= 0 ? 'FF10B981' : 'FFEF4444' } };
    });
    
    // Set column widths
    sheet.getColumn('A').width = 5;
    sheet.getColumn('B').width = 25;
    for (let i = 0; i < 12; i++) {
        sheet.getColumn(String.fromCharCode(67 + i)).width = 15;
    }
    
    return sheet;
}

/**
 * Generate monthly worksheet (JAN, FEV, etc.)
 */
function generateMonthlySheet(
    workbook: ExcelJS.Workbook,
    transactions: TransactionWithCostCenter[],
    month: number,
    year: number
): ExcelJS.Worksheet {
    const monthName = MONTH_ABBREV[month];
    const sheet = workbook.addWorksheet(monthName);
    
    // Filter transactions for this month
    const monthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });
    
    const expenses = monthTransactions.filter(t => t.entryType === 'Despesa');
    const incomes = monthTransactions.filter(t => t.entryType === 'Receita');
    
    // Reference month header
    sheet.getCell('A1').value = 'Mês de referência:';
    sheet.getCell('B1').value = `${MONTH_NAMES[month].toLowerCase()} ${year}`;
    
    // Summary section
    sheet.getCell('A3').value = 'Saldo inicial';
    sheet.getCell('A5').value = 'Total entrada';
    sheet.getCell('B5').value = 'R$';
    sheet.getCell('C5').value = incomes.reduce((sum, t) => sum + t.amount, 0);
    sheet.getCell('C5').numFmt = '#,##0.00';
    
    sheet.getCell('A6').value = 'Total saída';
    sheet.getCell('B6').value = 'R$';
    sheet.getCell('C6').value = expenses.reduce((sum, t) => sum + t.amount, 0);
    sheet.getCell('C6').numFmt = '#,##0.00';
    
    const totalParcelas = expenses.filter(t => t.installmentTotal > 0).reduce((sum, t) => sum + t.amount, 0);
    sheet.getCell('A7').value = 'Total parcelas';
    sheet.getCell('B7').value = 'R$';
    sheet.getCell('C7').value = totalParcelas;
    sheet.getCell('C7').numFmt = '#,##0.00';
    
    const saldoFinal = incomes.reduce((sum, t) => sum + t.amount, 0) - expenses.reduce((sum, t) => sum + t.amount, 0);
    sheet.getCell('A8').value = 'Saldo final:';
    sheet.getCell('B8').value = 'R$';
    sheet.getCell('C8').value = saldoFinal;
    sheet.getCell('C8').numFmt = '#,##0.00';
    sheet.getCell('C8').font = { bold: true, color: { argb: saldoFinal >= 0 ? 'FF10B981' : 'FFEF4444' } };
    
    // DESPESAS section (column E onwards)
    const despesasStartCol = 5; // E
    sheet.getCell(1, despesasStartCol + 2).value = 'Despesas';
    sheet.getCell(1, despesasStartCol + 2).font = { bold: true, size: 14 };
    
    // Despesas headers
    const despesasHeaders = ['Data', 'Centro d custo', 'Importantes', 'Categoria', 'Descrição', 'meio pg', 'valor'];
    despesasHeaders.forEach((header, i) => {
        const cell = sheet.getCell(2, despesasStartCol + i);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });
    
    // Despesas data
    expenses.forEach((t, index) => {
        const rowNum = index + 3;
        sheet.getCell(rowNum, despesasStartCol).value = formatDateBR(t.date);
        sheet.getCell(rowNum, despesasStartCol + 1).value = t.costCenter || '';
        sheet.getCell(rowNum, despesasStartCol + 2).value = t.flowType === 'Fixa' ? 'Despesa Fixa' : (t.costCenter || '');
        sheet.getCell(rowNum, despesasStartCol + 3).value = t.category;
        sheet.getCell(rowNum, despesasStartCol + 4).value = t.description;
        sheet.getCell(rowNum, despesasStartCol + 5).value = t.institution || t.paymentMethod || '';
        sheet.getCell(rowNum, despesasStartCol + 6).value = t.amount;
        sheet.getCell(rowNum, despesasStartCol + 6).numFmt = STYLES.currency;
        
        // Color code by payment method
        const paymentCell = sheet.getCell(rowNum, despesasStartCol + 5);
        const payment = (t.institution || t.paymentMethod || '').toLowerCase();
        if (payment.includes('amazon')) {
            paymentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC107' } };
        } else if (payment.includes('nubank')) {
            paymentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9C27B0' } };
            paymentCell.font = { color: { argb: 'FFFFFFFF' } };
        } else if (payment.includes('inter')) {
            paymentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF5722' } };
            paymentCell.font = { color: { argb: 'FFFFFFFF' } };
        } else if (payment.includes('pix')) {
            paymentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };
            paymentCell.font = { color: { argb: 'FFFFFFFF' } };
        }
    });
    
    // RECEITAS section (further right)
    const receitasStartCol = despesasStartCol + 8; // After despesas + gap
    sheet.getCell(1, receitasStartCol).value = 'Receitas';
    sheet.getCell(1, receitasStartCol).font = { bold: true, size: 14 };
    
    // Receitas headers
    const receitasHeaders = ['Data', 'descrição', 'valor'];
    receitasHeaders.forEach((header, i) => {
        const cell = sheet.getCell(2, receitasStartCol + i);
        cell.value = header;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });
    
    // Receitas data
    incomes.forEach((t, index) => {
        const rowNum = index + 3;
        sheet.getCell(rowNum, receitasStartCol).value = formatDateBR(t.date);
        sheet.getCell(rowNum, receitasStartCol + 1).value = t.description;
        sheet.getCell(rowNum, receitasStartCol + 2).value = t.amount;
        sheet.getCell(rowNum, receitasStartCol + 2).numFmt = STYLES.currency;
        sheet.getCell(rowNum, receitasStartCol + 2).font = { color: { argb: 'FF10B981' } };
    });
    
    // Set column widths
    sheet.getColumn(despesasStartCol).width = 12;
    sheet.getColumn(despesasStartCol + 1).width = 15;
    sheet.getColumn(despesasStartCol + 2).width = 15;
    sheet.getColumn(despesasStartCol + 3).width = 15;
    sheet.getColumn(despesasStartCol + 4).width = 30;
    sheet.getColumn(despesasStartCol + 5).width = 15;
    sheet.getColumn(despesasStartCol + 6).width = 12;
    sheet.getColumn(receitasStartCol).width = 12;
    sheet.getColumn(receitasStartCol + 1).width = 25;
    sheet.getColumn(receitasStartCol + 2).width = 12;
    
    return sheet;
}

/**
 * Generate PARCELAMENTOS worksheet
 */
function generateParcelamentosSheet(
    workbook: ExcelJS.Workbook,
    transactions: TransactionWithCostCenter[],
    year: number
): ExcelJS.Worksheet {
    const sheet = workbook.addWorksheet('PARCELAMENTOS');
    
    // Get installment transactions grouped by installmentGroupId
    const installments = transactions.filter(t => t.installmentTotal > 0 && new Date(t.date).getFullYear() === year);
    
    // Group by installmentGroupId or description
    const grouped: { [key: string]: Transaction[] } = {};
    installments.forEach(t => {
        const key = t.installmentGroupId || `${t.description}_${t.installmentTotal}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t);
    });
    
    // Headers
    const headers = ['Ano', 'MÊS', 'DATA', 'DESCRIÇÃO', 'Q. PRCL', 'TOTAL', 'PARCELA', 'CATEGORIA', 'CENTRO DE CUSTO', 'MEIO', 
                     ...MONTH_NAMES];
    headers.forEach((header, i) => {
        const cell = sheet.getCell(1, i + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
        cell.alignment = { horizontal: 'center' };
    });
    
    // Data rows
    let rowNum = 2;
    for (const [, groupTransactions] of Object.entries(grouped)) {
        const first = groupTransactions[0];
        const total = first.amount * first.installmentTotal;
        
        // Get year and month from first transaction
        const date = new Date(first.date);
        
        sheet.getCell(rowNum, 1).value = date.getFullYear();
        sheet.getCell(rowNum, 2).value = MONTH_ABBREV[date.getMonth()];
        sheet.getCell(rowNum, 3).value = date.getDate();
        sheet.getCell(rowNum, 4).value = first.description;
        sheet.getCell(rowNum, 5).value = first.installmentTotal;
        sheet.getCell(rowNum, 6).value = total;
        sheet.getCell(rowNum, 6).numFmt = STYLES.currency;
        sheet.getCell(rowNum, 7).value = first.amount;
        sheet.getCell(rowNum, 7).numFmt = STYLES.currency;
        sheet.getCell(rowNum, 8).value = first.category;
        sheet.getCell(rowNum, 9).value = (first as any).costCenter || ''; // costCenter after migration
        sheet.getCell(rowNum, 10).value = first.institution || first.paymentMethod || '';
        
        // Monthly values
        groupTransactions.forEach(t => {
            const tDate = new Date(t.date);
            const monthCol = 11 + tDate.getMonth();
            sheet.getCell(rowNum, monthCol).value = t.amount;
            sheet.getCell(rowNum, monthCol).numFmt = STYLES.currency;
        });
        
        // Color code payment method
        const paymentCell = sheet.getCell(rowNum, 10);
        const payment = (first.institution || first.paymentMethod || '').toLowerCase();
        if (payment.includes('amazon')) {
            paymentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC107' } };
        } else if (payment.includes('nubank')) {
            paymentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9C27B0' } };
            paymentCell.font = { color: { argb: 'FFFFFFFF' } };
        } else if (payment.includes('inter')) {
            paymentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF5722' } };
            paymentCell.font = { color: { argb: 'FFFFFFFF' } };
        }
        
        rowNum++;
    }
    
    // Set column widths
    sheet.getColumn(1).width = 8;
    sheet.getColumn(2).width = 8;
    sheet.getColumn(3).width = 8;
    sheet.getColumn(4).width = 40;
    sheet.getColumn(5).width = 10;
    sheet.getColumn(6).width = 12;
    sheet.getColumn(7).width = 12;
    sheet.getColumn(8).width = 15;
    sheet.getColumn(9).width = 18;
    sheet.getColumn(10).width = 15;
    for (let i = 11; i <= 22; i++) {
        sheet.getColumn(i).width = 12;
    }
    
    return sheet;
}

/**
 * Generate DEVEDORES worksheet
 */
function generateDevedoresSheet(
    workbook: ExcelJS.Workbook,
    transactions: TransactionWithCostCenter[]
): ExcelJS.Worksheet {
    const sheet = workbook.addWorksheet('DEVEDORES');
    
    // Get third-party transactions
    const debtorTransactions = transactions.filter(t => t.isThirdParty);
    
    // Group by debtor name
    const grouped: { [name: string]: { transactions: TransactionWithCostCenter[], total: number } } = {};
    debtorTransactions.forEach(t => {
        const name = t.thirdPartyName || 'Desconhecido';
        if (!grouped[name]) grouped[name] = { transactions: [], total: 0 };
        grouped[name].transactions.push(t);
        grouped[name].total += t.amount;
    });
    
    // Headers
    const headers = ['Devedor', 'Descrição', 'Valor', 'Data', 'Categoria', 'Status'];
    headers.forEach((header, i) => {
        const cell = sheet.getCell(1, i + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } };
        cell.alignment = { horizontal: 'center' };
    });
    
    // Data rows
    let rowNum = 2;
    for (const [name, data] of Object.entries(grouped)) {
        // Summary row for debtor
        sheet.getCell(rowNum, 1).value = name;
        sheet.getCell(rowNum, 1).font = { bold: true };
        sheet.getCell(rowNum, 3).value = data.total;
        sheet.getCell(rowNum, 3).numFmt = STYLES.currency;
        sheet.getCell(rowNum, 3).font = { bold: true };
        sheet.getRow(rowNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
        rowNum++;
        
        // Individual transactions
        data.transactions.forEach(t => {
            sheet.getCell(rowNum, 2).value = t.thirdPartyDescription || t.description;
            sheet.getCell(rowNum, 3).value = t.amount;
            sheet.getCell(rowNum, 3).numFmt = STYLES.currency;
            sheet.getCell(rowNum, 4).value = formatDateBR(t.date);
            sheet.getCell(rowNum, 5).value = t.category;
            sheet.getCell(rowNum, 6).value = t.installmentStatus !== 'N/A' ? t.installmentStatus : 'Pendente';
            rowNum++;
        });
        
        rowNum++; // Empty row between debtors
    }
    
    // Set column widths
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 35;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 12;
    sheet.getColumn(5).width = 18;
    sheet.getColumn(6).width = 12;
    
    return sheet;
}

/**
 * Generate D. FIXA (recurring expenses) worksheet
 */
function generateDespesaFixaSheet(
    workbook: ExcelJS.Workbook,
    transactions: TransactionWithCostCenter[],
    recurringTransactions?: RecurringTransaction[]
): ExcelJS.Worksheet {
    const sheet = workbook.addWorksheet('D. FIXA');
    
    // Get fixed expenses from transactions
    const fixedExpenses = transactions.filter(t => 
        t.entryType === 'Despesa' && (t.flowType === 'Fixa' || t.costCenter === 'Despesa Fixa')
    );
    
    // Group by description to get unique fixed expenses
    const grouped: { [desc: string]: { amount: number, category: string, institution?: string | null } } = {};
    fixedExpenses.forEach(t => {
        if (!grouped[t.description]) {
            grouped[t.description] = {
                amount: t.amount,
                category: t.category,
                institution: t.institution || t.paymentMethod,
            };
        }
    });
    
    // Add recurring transactions if provided
    if (recurringTransactions) {
        recurringTransactions.forEach(rt => {
            if (!grouped[rt.description]) {
                grouped[rt.description] = {
                    amount: rt.amount,
                    category: rt.category,
                };
            }
        });
    }
    
    // Headers
    const headers = ['Descrição', 'Categoria', 'Valor Mensal', 'Método Pagamento'];
    headers.forEach((header, i) => {
        const cell = sheet.getCell(1, i + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2196F3' } };
        cell.alignment = { horizontal: 'center' };
    });
    
    // Data rows
    let rowNum = 2;
    let totalMonthly = 0;
    for (const [desc, data] of Object.entries(grouped)) {
        sheet.getCell(rowNum, 1).value = desc;
        sheet.getCell(rowNum, 2).value = data.category;
        sheet.getCell(rowNum, 3).value = data.amount;
        sheet.getCell(rowNum, 3).numFmt = STYLES.currency;
        sheet.getCell(rowNum, 4).value = data.institution || '';
        totalMonthly += data.amount;
        rowNum++;
    }
    
    // Total row
    rowNum++;
    sheet.getCell(rowNum, 1).value = 'TOTAL DESPESAS FIXAS';
    sheet.getCell(rowNum, 1).font = { bold: true };
    sheet.getCell(rowNum, 3).value = totalMonthly;
    sheet.getCell(rowNum, 3).numFmt = STYLES.currency;
    sheet.getCell(rowNum, 3).font = { bold: true, color: { argb: 'FFEF4444' } };
    sheet.getRow(rowNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    
    // Set column widths
    sheet.getColumn(1).width = 35;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 20;
    
    return sheet;
}

/**
 * Generate complete financial report XLSX with multiple tabs
 */
export async function generateFinancialReportXLSX(options: FinancialReportOptions): Promise<Buffer> {
    const { transactions, recurringTransactions, dashboardName, year } = options;
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = dashboardName || 'Finanças Dashboard';
    workbook.created = new Date();
    
    // Generate all worksheets
    generateGeralSheet(workbook, transactions, year);
    
    // Generate monthly sheets for months that have transactions
    const monthsWithData = new Set<number>();
    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === year) {
            monthsWithData.add(d.getMonth());
        }
    });
    
    // Sort months and generate sheets
    Array.from(monthsWithData).sort((a, b) => a - b).forEach(month => {
        generateMonthlySheet(workbook, transactions, month, year);
    });
    
    // Generate special tabs
    generateParcelamentosSheet(workbook, transactions, year);
    generateDevedoresSheet(workbook, transactions);
    generateDespesaFixaSheet(workbook, transactions, recurringTransactions);
    
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

/**
 * Generate complete financial report as ZIP with multiple CSV files
 */
export async function generateFinancialReportCSVZip(options: FinancialReportOptions): Promise<Buffer> {
    const { transactions, recurringTransactions, dashboardName, year } = options;
    
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.on('data', (chunk) => chunks.push(chunk));
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', reject);
        
        // Helper to create CSV content
        const createCSV = (headers: string[], rows: string[][]): string => {
            const BOM = '\uFEFF';
            return BOM + headers.join(';') + '\n' + rows.map(r => r.join(';')).join('\n');
        };
        
        // GERAL.csv - Summary
        const geralHeaders = ['Tipo', 'Categoria', ...MONTH_NAMES, 'Total'];
        const geralRows: string[][] = [];
        
        // Income totals by category
        const incomeByCategory: { [cat: string]: number[] } = {};
        transactions.filter(t => t.entryType === 'Receita' && new Date(t.date).getFullYear() === year).forEach(t => {
            const month = new Date(t.date).getMonth();
            if (!incomeByCategory[t.category]) incomeByCategory[t.category] = new Array(12).fill(0);
            incomeByCategory[t.category][month] += t.amount;
        });
        for (const [cat, months] of Object.entries(incomeByCategory)) {
            const total = months.reduce((a, b) => a + b, 0);
            geralRows.push(['Receita', cat, ...months.map(v => formatAmountBR(v)), formatAmountBR(total)]);
        }
        
        // Expense totals by category
        const expenseByCategory: { [cat: string]: number[] } = {};
        transactions.filter(t => t.entryType === 'Despesa' && new Date(t.date).getFullYear() === year).forEach(t => {
            const month = new Date(t.date).getMonth();
            if (!expenseByCategory[t.category]) expenseByCategory[t.category] = new Array(12).fill(0);
            expenseByCategory[t.category][month] += t.amount;
        });
        for (const [cat, months] of Object.entries(expenseByCategory)) {
            const total = months.reduce((a, b) => a + b, 0);
            geralRows.push(['Despesa', cat, ...months.map(v => formatAmountBR(v)), formatAmountBR(total)]);
        }
        
        archive.append(createCSV(geralHeaders, geralRows), { name: 'GERAL.csv' });
        
        // Monthly CSVs
        const monthsWithData = new Set<number>();
        transactions.forEach(t => {
            const d = new Date(t.date);
            if (d.getFullYear() === year) monthsWithData.add(d.getMonth());
        });
        
        Array.from(monthsWithData).sort((a, b) => a - b).forEach(month => {
            const monthTrans = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === month && d.getFullYear() === year;
            });
            
            const headers = ['Data', 'Tipo', 'Centro de Custo', 'Categoria', 'Descrição', 'Meio Pagamento', 'Valor'];
            const rows = monthTrans.map(t => [
                formatDateBR(t.date),
                t.entryType,
                t.costCenter || '',
                t.category,
                `"${t.description.replace(/"/g, '""')}"`,
                t.institution || t.paymentMethod || '',
                formatAmountBR(t.amount),
            ]);
            
            archive.append(createCSV(headers, rows), { name: `${MONTH_ABBREV[month]}.csv` });
        });
        
        // PARCELAMENTOS.csv
        const parcelamentos = transactions.filter(t => t.installmentTotal > 0 && new Date(t.date).getFullYear() === year);
        const parcelHeaders = ['Descrição', 'Parcela', 'Total Parcelas', 'Valor', 'Data', 'Categoria', 'Meio Pagamento'];
        const parcelRows = parcelamentos.map(t => [
            `"${t.description.replace(/"/g, '""')}"`,
            t.installmentNumber.toString(),
            t.installmentTotal.toString(),
            formatAmountBR(t.amount),
            formatDateBR(t.date),
            t.category,
            t.institution || t.paymentMethod || '',
        ]);
        archive.append(createCSV(parcelHeaders, parcelRows), { name: 'PARCELAMENTOS.csv' });
        
        // DEVEDORES.csv
        const devedores = transactions.filter(t => t.isThirdParty);
        const devHeaders = ['Devedor', 'Descrição', 'Valor', 'Data', 'Categoria'];
        const devRows = devedores.map(t => [
            t.thirdPartyName || '',
            `"${(t.thirdPartyDescription || t.description).replace(/"/g, '""')}"`,
            formatAmountBR(t.amount),
            formatDateBR(t.date),
            t.category,
        ]);
        archive.append(createCSV(devHeaders, devRows), { name: 'DEVEDORES.csv' });
        
        // D_FIXA.csv
        const fixedExpenses = transactions.filter(t => 
            t.entryType === 'Despesa' && (t.flowType === 'Fixa' || t.costCenter === 'Despesa Fixa')
        );
        const uniqueFixed: { [desc: string]: Transaction } = {};
        fixedExpenses.forEach(t => {
            if (!uniqueFixed[t.description]) uniqueFixed[t.description] = t;
        });
        
        const fixaHeaders = ['Descrição', 'Categoria', 'Valor Mensal', 'Meio Pagamento'];
        const fixaRows = Object.values(uniqueFixed).map(t => [
            `"${t.description.replace(/"/g, '""')}"`,
            t.category,
            formatAmountBR(t.amount),
            t.institution || t.paymentMethod || '',
        ]);
        
        // Add recurring transactions
        if (recurringTransactions) {
            recurringTransactions.forEach(rt => {
                if (!uniqueFixed[rt.description]) {
                    fixaRows.push([
                        `"${rt.description.replace(/"/g, '""')}"`,
                        rt.category,
                        formatAmountBR(rt.amount),
                        '',
                    ]);
                }
            });
        }
        
        archive.append(createCSV(fixaHeaders, fixaRows), { name: 'D_FIXA.csv' });
        
        archive.finalize();
    });
}
