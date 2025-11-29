import { Router } from 'express';
import * as categoriasController from '../controllers/categoriasController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams, validateQuery, idParamSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { createCategorySchema, updateCategorySchema, queryCategoriesSchema } from '../dtos/category.dto';

const router = Router();

router.post('/', authenticateToken, validateBody(createCategorySchema), asyncHandler(categoriasController.criarCategoria as any));
router.get('/', authenticateToken, validateQuery(queryCategoriesSchema), asyncHandler(categoriasController.listarCategorias as any));
router.get('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(categoriasController.obterCategoria as any));
router.put('/:id', authenticateToken, validateParams(idParamSchema), validateBody(updateCategorySchema), asyncHandler(categoriasController.atualizarCategoria as any));
router.delete('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(categoriasController.deletarCategoria as any));

export default router;
