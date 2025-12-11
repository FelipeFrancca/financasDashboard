import ExcelJS from 'exceljs';
import { Transaction } from '@prisma/client';

export interface ExportOptions {
    format: 'csv' | 'xlsx';
    transactions: Transaction[];
    dashboardName?: string;
}

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
    return buffer as Buffer;
}
