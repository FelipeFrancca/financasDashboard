import { Router, RequestHandler } from 'express';
import * as reportsController from '../controllers/reportsController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Type cast for middleware compatibility
const auth = authenticateToken as unknown as RequestHandler;

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Financial reports import and export
 */

// Export financial report (XLSX or CSV ZIP with multiple tabs)
router.get(
    '/export', 
    auth, 
    asyncHandler(reportsController.exportFinancialReport as any)
);

// Download import template
router.get(
    '/templates', 
    asyncHandler(reportsController.downloadTemplate as any)
);

// Preview import (upload file and see what will be imported)
router.post(
    '/import/preview',
    auth,
    reportsController.uploadSpreadsheet.single('file'),
    asyncHandler(reportsController.previewImport as any)
);

// Confirm import from preview
router.post(
    '/import/confirm',
    auth,
    asyncHandler(reportsController.confirmImport as any)
);

// Quick import (skip preview, import all, skip duplicates)
router.post(
    '/import',
    auth,
    reportsController.uploadSpreadsheet.single('file'),
    asyncHandler(reportsController.quickImport as any)
);

// Get paginated transactions from preview
router.get(
    '/preview/:previewId/transactions',
    auth,
    asyncHandler(reportsController.getPreviewTransactions as any)
);

export default router;
