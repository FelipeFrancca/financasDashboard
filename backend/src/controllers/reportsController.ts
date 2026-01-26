import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { prisma } from '../database/conexao';
import { 
    parseXLSXFile, 
    parseCSVFile, 
    detectDuplicates, 
    importTransactions,
    ImportPreview,
    ImportOptions 
} from '../services/spreadsheetImportService';
import { 
    generateFinancialReportXLSX, 
    generateFinancialReportCSVZip 
} from '../services/exportService';

// Multer configuration for file uploads
const storage = multer.memoryStorage();
export const uploadSpreadsheet = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'application/vnd.ms-excel', // xls
            'text/csv',
            'application/csv',
        ];
        if (allowedMimes.includes(file.mimetype) || 
            file.originalname.endsWith('.xlsx') || 
            file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Formato de arquivo não suportado. Use XLSX ou CSV.'));
        }
    },
});

// Store previews temporarily (in production, use Redis or similar)
const previewCache = new Map<string, { preview: ImportPreview; expires: number }>();

/**
 * Clean expired previews
 */
function cleanExpiredPreviews() {
    const now = Date.now();
    for (const [key, value] of previewCache.entries()) {
        if (value.expires < now) {
            previewCache.delete(key);
        }
    }
}

// Clean every 5 minutes
setInterval(cleanExpiredPreviews, 5 * 60 * 1000);

/**
 * @swagger
 * /api/reports/import/preview:
 *   post:
 *     summary: Upload spreadsheet and preview data before import
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - dashboardId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: XLSX or CSV file
 *               dashboardId:
 *                 type: string
 *                 description: Dashboard ID to import to
 *     responses:
 *       200:
 *         description: Preview of data to be imported
 */
export async function previewImport(req: Request, res: Response, next: NextFunction) {
    try {
        const file = req.file;
        const { dashboardId } = req.body;
        const userId = (req as any).user?.id;

        if (!file) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nenhum arquivo enviado' 
            });
        }

        if (!dashboardId) {
            return res.status(400).json({ 
                success: false, 
                error: 'dashboardId é obrigatório' 
            });
        }

        // Verify dashboard access
        const dashboard = await prisma.dashboard.findFirst({
            where: {
                id: dashboardId,
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId, status: 'APPROVED' } } }
                ]
            }
        });

        if (!dashboard) {
            return res.status(403).json({ 
                success: false, 
                error: 'Acesso negado ao dashboard' 
            });
        }

        // Parse file based on type
        let preview: ImportPreview;
        const isXLSX = file.originalname.endsWith('.xlsx') || 
                       file.mimetype.includes('spreadsheet');

        if (isXLSX) {
            preview = await parseXLSXFile(file.buffer);
        } else {
            preview = await parseCSVFile(file.buffer);
        }

        // Detect duplicates
        preview.duplicates = await detectDuplicates(preview.transactions, dashboardId);

        // Generate preview ID and cache
        const previewId = `preview_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        previewCache.set(previewId, {
            preview,
            expires: Date.now() + 30 * 60 * 1000, // 30 minutes
        });

        res.json({
            success: true,
            data: {
                previewId,
                summary: preview.summary,
                transactions: preview.transactions.slice(0, 50), // First 50 for preview
                totalTransactions: preview.transactions.length,
                installments: preview.installments,
                debtors: preview.debtors,
                recurring: preview.recurring,
                duplicates: preview.duplicates,
                errors: preview.errors,
                hasMore: preview.transactions.length > 50,
            }
        });

    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /api/reports/import/confirm:
 *   post:
 *     summary: Confirm and execute import from previewed data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - previewId
 *               - dashboardId
 *             properties:
 *               previewId:
 *                 type: string
 *               dashboardId:
 *                 type: string
 *               skipDuplicates:
 *                 type: boolean
 *                 default: false
 *               selectedIndices:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Indices of transactions to import (all if not provided)
 *     responses:
 *       200:
 *         description: Import result
 */
export async function confirmImport(req: Request, res: Response, next: NextFunction) {
    try {
        const { previewId, dashboardId, skipDuplicates, selectedIndices } = req.body;
        const userId = (req as any).user?.id;

        if (!previewId || !dashboardId) {
            return res.status(400).json({ 
                success: false, 
                error: 'previewId e dashboardId são obrigatórios' 
            });
        }

        // Get cached preview
        const cached = previewCache.get(previewId);
        if (!cached || cached.expires < Date.now()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Preview expirado. Por favor, faça upload do arquivo novamente.' 
            });
        }

        // Verify dashboard access
        const dashboard = await prisma.dashboard.findFirst({
            where: {
                id: dashboardId,
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId, status: 'APPROVED' } } }
                ]
            }
        });

        if (!dashboard) {
            return res.status(403).json({ 
                success: false, 
                error: 'Acesso negado ao dashboard' 
            });
        }

        // Import transactions
        const options: ImportOptions = {
            dashboardId,
            userId,
            skipDuplicates: skipDuplicates ?? false,
            selectedTransactions: selectedIndices,
        };

        const result = await importTransactions(cached.preview, options);

        // Clear preview from cache
        previewCache.delete(previewId);

        res.json({
            success: true,
            data: {
                imported: result.imported,
                skipped: result.skipped,
                errors: result.errors,
                message: `${result.imported} transações importadas com sucesso${result.skipped > 0 ? `, ${result.skipped} ignoradas como duplicatas` : ''}.`,
            }
        });

    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /api/reports/import:
 *   post:
 *     summary: Quick import without preview (imports all, skips duplicates)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - dashboardId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               dashboardId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Import result
 */
export async function quickImport(req: Request, res: Response, next: NextFunction) {
    try {
        const file = req.file;
        const { dashboardId } = req.body;
        const userId = (req as any).user?.id;

        if (!file) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nenhum arquivo enviado' 
            });
        }

        if (!dashboardId) {
            return res.status(400).json({ 
                success: false, 
                error: 'dashboardId é obrigatório' 
            });
        }

        // Verify dashboard access
        const dashboard = await prisma.dashboard.findFirst({
            where: {
                id: dashboardId,
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId, status: 'APPROVED' } } }
                ]
            }
        });

        if (!dashboard) {
            return res.status(403).json({ 
                success: false, 
                error: 'Acesso negado ao dashboard' 
            });
        }

        // Parse file
        let preview: ImportPreview;
        const isXLSX = file.originalname.endsWith('.xlsx') || 
                       file.mimetype.includes('spreadsheet');

        if (isXLSX) {
            preview = await parseXLSXFile(file.buffer);
        } else {
            preview = await parseCSVFile(file.buffer);
        }

        // Detect and skip duplicates
        preview.duplicates = await detectDuplicates(preview.transactions, dashboardId);

        // Import all (skipping duplicates)
        const result = await importTransactions(preview, {
            dashboardId,
            userId,
            skipDuplicates: true,
        });

        res.json({
            success: true,
            data: {
                imported: result.imported,
                skipped: result.skipped,
                duplicatesFound: preview.duplicates.length,
                errors: result.errors,
                message: `${result.imported} transações importadas. ${result.skipped} duplicatas ignoradas.`,
            }
        });

    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /api/reports/export:
 *   get:
 *     summary: Export financial report with multiple tabs
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year to export (default current year)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [xlsx, csv]
 *         description: Export format (xlsx or csv as zip)
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 */
export async function exportFinancialReport(req: Request, res: Response, next: NextFunction) {
    try {
        const { dashboardId, year: yearParam, format = 'xlsx' } = req.query;
        const userId = (req as any).user?.id;

        if (!dashboardId) {
            return res.status(400).json({ 
                success: false, 
                error: 'dashboardId é obrigatório' 
            });
        }

        const year = yearParam ? parseInt(yearParam as string) : new Date().getFullYear();

        // Verify dashboard access
        const dashboard = await prisma.dashboard.findFirst({
            where: {
                id: dashboardId as string,
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId, status: 'APPROVED' } } }
                ]
            }
        });

        if (!dashboard) {
            return res.status(403).json({ 
                success: false, 
                error: 'Acesso negado ao dashboard' 
            });
        }

        // Get all transactions for the year
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        const transactions = await prisma.transaction.findMany({
            where: {
                dashboardId: dashboardId as string,
                deletedAt: null,
                date: {
                    gte: startOfYear,
                    lte: endOfYear,
                }
            },
            orderBy: { date: 'asc' }
        });

        // Get recurring transactions
        const recurringTransactions = await prisma.recurringTransaction.findMany({
            where: {
                dashboardId: dashboardId as string,
            }
        });

        // Generate report
        const dashboardName = dashboard.title || 'Financeiro';
        
        if (format === 'csv') {
            const buffer = await generateFinancialReportCSVZip({
                transactions,
                recurringTransactions,
                dashboardName,
                year,
            });

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${dashboardName}_${year}.zip"`);
            res.send(buffer);
        } else {
            const buffer = await generateFinancialReportXLSX({
                transactions,
                recurringTransactions,
                dashboardName,
                year,
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${dashboardName}_${year}.xlsx"`);
            res.send(buffer);
        }

    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /api/reports/preview/{previewId}/transactions:
 *   get:
 *     summary: Get paginated transactions from preview
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: previewId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated transactions
 */
export async function getPreviewTransactions(req: Request, res: Response, next: NextFunction) {
    try {
        const { previewId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const cached = previewCache.get(previewId);
        if (!cached || cached.expires < Date.now()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Preview expirado' 
            });
        }

        const start = (page - 1) * limit;
        const end = start + limit;
        const transactions = cached.preview.transactions.slice(start, end);

        res.json({
            success: true,
            data: {
                transactions,
                page,
                limit,
                total: cached.preview.transactions.length,
                hasMore: end < cached.preview.transactions.length,
            }
        });

    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /api/reports/templates:
 *   get:
 *     summary: Download empty template for import
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [xlsx, csv]
 *     responses:
 *       200:
 *         description: Template file download
 */
export async function downloadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
        const { format = 'xlsx' } = req.query;
        const ExcelJS = await import('exceljs');
        
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Finanças Dashboard';
        
        // Monthly template
        const monthSheet = workbook.addWorksheet('MODELO_MES');
        const monthHeaders = ['Data', 'Centro de Custo', 'Categoria', 'Descrição', 'Meio Pagamento', 'Valor'];
        monthHeaders.forEach((h, i) => {
            const cell = monthSheet.getCell(1, i + 1);
            cell.value = h;
            cell.font = { bold: true };
        });
        
        // Add example row
        monthSheet.addRow(['21/01/2026', 'Essencial', 'Alimentação', 'Supermercado', 'Nubank', '150,00']);
        
        // Add data validation for Centro de Custo
        monthSheet.getColumn(2).eachCell((cell, rowNumber) => {
            if (rowNumber > 1) {
                cell.dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: ['"Essencial,Não essencial,Despesa Fixa"'],
                };
            }
        });
        
        // Parcelamentos template
        const parcelSheet = workbook.addWorksheet('MODELO_PARCELAMENTOS');
        const parcelHeaders = ['Descrição', 'Total Parcelas', 'Valor Parcela', 'Categoria', 'Meio Pagamento'];
        parcelHeaders.forEach((h, i) => {
            const cell = parcelSheet.getCell(1, i + 1);
            cell.value = h;
            cell.font = { bold: true };
        });
        parcelSheet.addRow(['Celular', '12', '150,00', 'Eletrônicos', 'Nubank']);
        
        // Devedores template
        const devSheet = workbook.addWorksheet('MODELO_DEVEDORES');
        const devHeaders = ['Nome', 'Descrição', 'Valor', 'Data'];
        devHeaders.forEach((h, i) => {
            const cell = devSheet.getCell(1, i + 1);
            cell.value = h;
            cell.font = { bold: true };
        });
        devSheet.addRow(['João', 'Empréstimo', '500,00', '15/01/2026']);
        
        // D. Fixa template
        const fixaSheet = workbook.addWorksheet('MODELO_D_FIXA');
        const fixaHeaders = ['Descrição', 'Categoria', 'Valor Mensal', 'Meio Pagamento'];
        fixaHeaders.forEach((h, i) => {
            const cell = fixaSheet.getCell(1, i + 1);
            cell.value = h;
            cell.font = { bold: true };
        });
        fixaSheet.addRow(['Internet', 'Casa', '120,00', 'Débito']);
        fixaSheet.addRow(['Aluguel', 'Moradia', '1500,00', 'Transferência']);
        
        // Set column widths for all sheets
        [monthSheet, parcelSheet, devSheet, fixaSheet].forEach(sheet => {
            sheet.columns.forEach(col => {
                col.width = 20;
            });
        });
        
        if (format === 'csv') {
            // For CSV, just return the monthly template
            const headers = monthHeaders.join(';');
            const example = ['21/01/2026', 'Essencial', 'Alimentação', 'Supermercado', 'Nubank', '150,00'].join(';');
            const content = '\uFEFF' + headers + '\n' + example;
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="modelo_importacao.csv"');
            res.send(content);
        } else {
            const buffer = await workbook.xlsx.writeBuffer();
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="modelo_importacao.xlsx"');
            res.send(Buffer.from(buffer));
        }

    } catch (error) {
        next(error);
    }
}
