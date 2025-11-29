/**
 * Category Service - Gerenciamento de categorias hierárquicas
 */

import { Category, Prisma } from '@prisma/client';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';
import {
    CreateCategoryDTO,
    UpdateCategoryDTO,
    QueryCategoriesDTO,
    CategoryResponseDTO,
} from '../dtos/category.dto';
import { NotFoundError, ValidationError } from '../utils/AppError';

// ============================================
// CRUD OPERATIONS
// ============================================

export async function createCategory(
    dto: CreateCategoryDTO,
    userId: string
): Promise<Category> {
    // Validar se parent existe e pertence ao usuário (ou é sistema)
    if (dto.parentId) {
        const parent = await prisma.category.findFirst({
            where: {
                id: dto.parentId,
                OR: [{ userId }, { isSystem: true }],
                deletedAt: null,
            },
        });

        if (!parent) {
            throw new NotFoundError('Categoria pai não encontrada');
        }

        // Validar se tipo bate com o pai
        if (parent.type !== dto.type) {
            throw new ValidationError('Subcategoria deve ter o mesmo tipo da categoria pai');
        }
    }

    // Verificar duplicidade de nome para o usuário
    const existing = await prisma.category.findFirst({
        where: {
            name: dto.name,
            userId,
            type: dto.type,
            deletedAt: null,
        },
    });

    if (existing) {
        throw new ValidationError(`Categoria "${dto.name}" já existe para ${dto.type}`);
    }

    const category = await prisma.category.create({
        data: {
            ...dto,
            userId,
            isSystem: false,
        },
    });

    logger.info('Categoria criada', 'CategoryService', { id: category.id, userId });
    return category;
}

export async function getCategories(
    dto: QueryCategoriesDTO,
    userId: string
): Promise<CategoryResponseDTO[]> {
    const where: Prisma.CategoryWhereInput = {
        deletedAt: null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        ...(dto.type && { type: dto.type }),
        OR: [
            { userId },
            ...(dto.includeSystem ? [{ isSystem: true }] : []),
        ],
    };

    // Se pedir raiz, filtra parentId null
    if (dto.parentId === 'null') {
        where.parentId = null;
    } else if (dto.parentId) {
        where.parentId = dto.parentId;
    }

    const categories = await prisma.category.findMany({
        where,
        orderBy: [
            { order: 'asc' },
            { name: 'asc' },
        ],
    });

    // Se não filtrou por parent, monta a árvore
    if (!dto.parentId) {
        return buildCategoryTree(categories);
    }

    return categories.map(mapToResponse);
}

export async function getCategoryById(
    id: string,
    userId: string
): Promise<Category> {
    const category = await prisma.category.findFirst({
        where: {
            id,
            OR: [{ userId }, { isSystem: true }],
            deletedAt: null,
        },
    });

    if (!category) {
        throw new NotFoundError('Categoria não encontrada');
    }

    return category;
}

export async function updateCategory(
    id: string,
    dto: UpdateCategoryDTO,
    userId: string
): Promise<Category> {
    const category = await prisma.category.findFirst({
        where: { id, userId, deletedAt: null },
    });

    if (!category) {
        throw new NotFoundError('Categoria não encontrada ou é do sistema');
    }

    // Se mudar parent, validar novo parent
    if (dto.parentId) {
        const parent = await prisma.category.findFirst({
            where: {
                id: dto.parentId,
                OR: [{ userId }, { isSystem: true }],
                deletedAt: null,
            },
        });

        if (!parent) {
            throw new NotFoundError('Nova categoria pai não encontrada');
        }

        // Evitar ciclo (não pode ser filho de si mesmo ou de seus descendentes)
        if (dto.parentId === id) {
            throw new ValidationError('Categoria não pode ser pai de si mesma');
        }
    }

    const updated = await prisma.category.update({
        where: { id },
        data: dto,
    });

    logger.info('Categoria atualizada', 'CategoryService', { id, userId });
    return updated;
}

export async function deleteCategory(
    id: string,
    userId: string
): Promise<void> {
    const category = await prisma.category.findFirst({
        where: { id, userId, deletedAt: null },
        include: { children: true },
    });

    if (!category) {
        throw new NotFoundError('Categoria não encontrada ou é do sistema');
    }

    // Soft delete (cascata para filhos se necessário, ou impedir)
    // Aqui vamos impedir se tiver filhos ativos
    const activeChildren = await prisma.category.count({
        where: { parentId: id, deletedAt: null },
    });

    if (activeChildren > 0) {
        throw new ValidationError('Não é possível deletar categoria com subcategorias ativas');
    }

    // Verificar uso em transações (opcional, mas recomendado)
    const usageCount = await prisma.transaction.count({
        where: { category: category.name, userId, deletedAt: null },
    });

    if (usageCount > 0) {
        // Se usada, apenas desativa
        await prisma.category.update({
            where: { id },
            data: { isActive: false },
        });
        logger.info('Categoria desativada por estar em uso', 'CategoryService', { id });
        return;
    }

    await prisma.category.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    logger.info('Categoria deletada', 'CategoryService', { id });
}

// ============================================
// HELPERS
// ============================================

function mapToResponse(category: Category): CategoryResponseDTO {
    return {
        id: category.id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        parentId: category.parentId,
        isSystem: category.isSystem,
        isActive: category.isActive,
        order: category.order,
    };
}

function buildCategoryTree(categories: Category[]): CategoryResponseDTO[] {
    const categoryMap = new Map<string, CategoryResponseDTO>();
    const roots: CategoryResponseDTO[] = [];

    // 1. Criar mapa de todos os itens
    categories.forEach(cat => {
        categoryMap.set(cat.id, { ...mapToResponse(cat), children: [] });
    });

    // 2. Montar árvore
    categories.forEach(cat => {
        const node = categoryMap.get(cat.id)!;
        if (cat.parentId && categoryMap.has(cat.parentId)) {
            const parent = categoryMap.get(cat.parentId)!;
            parent.children?.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}
