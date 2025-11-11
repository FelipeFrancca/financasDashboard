import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import * as transactionService from "../services/transactionService";
import { authenticateToken, type AuthRequest } from "../middleware/auth";

const router = Router();

// Validation schemas
const createTransactionSchema = z.object({
  date: z.string().or(z.date()),
  entryType: z.enum(["Receita", "Despesa"]),
  flowType: z.enum(["Fixa", "Variável"]),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  description: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.string().optional(),
  institution: z.string().optional(),
  cardBrand: z.string().optional(),
  installmentTotal: z.number().int().min(0).default(0),
  installmentNumber: z.number().int().min(0).default(0),
  installmentStatus: z.enum(["N/A", "Paga", "Pendente"]).default("N/A"),
  notes: z.string().optional(),
  isTemporary: z.boolean().default(false),
});

const updateTransactionSchema = createTransactionSchema.partial();

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  entryType: z.string().optional(),
  flowType: z.string().optional(),
  category: z.string().optional(),
  institution: z.string().optional(),
  installmentStatus: z.string().optional(),
  search: z.string().optional(),
  minAmount: z.string().optional(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - date
 *         - entryType
 *         - flowType
 *         - category
 *         - description
 *         - amount
 *       properties:
 *         id:
 *           type: string
 *           description: ID único da transação
 *         date:
 *           type: string
 *           format: date
 *           description: Data da transação
 *         entryType:
 *           type: string
 *           enum: [Receita, Despesa]
 *           description: Tipo de lançamento
 *         flowType:
 *           type: string
 *           enum: [Fixa, Variável]
 *           description: Tipo de fluxo
 *         category:
 *           type: string
 *           description: Categoria principal
 *         subcategory:
 *           type: string
 *           description: Subcategoria
 *         description:
 *           type: string
 *           description: Descrição detalhada
 *         amount:
 *           type: number
 *           description: Valor da transação
 *         paymentMethod:
 *           type: string
 *           description: Forma de pagamento
 *         institution:
 *           type: string
 *           description: Instituição/Banco
 *         cardBrand:
 *           type: string
 *           description: Bandeira do cartão
 *         installmentTotal:
 *           type: integer
 *           description: Total de parcelas
 *         installmentNumber:
 *           type: integer
 *           description: Número da parcela atual
 *         installmentStatus:
 *           type: string
 *           enum: [N/A, Paga, Pendente]
 *           description: Status da parcela
 *         notes:
 *           type: string
 *           description: Observações
 *         isTemporary:
 *           type: boolean
 *           description: Se é entrada temporária
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Lista todas as transações do usuário autenticado
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial do filtro
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final do filtro
 *       - in: query
 *         name: entryType
 *         schema:
 *           type: string
 *           enum: [Receita, Despesa]
 *         description: Tipo de lançamento
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca textual
 *     responses:
 *       200:
 *         description: Lista de transações
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const filters = querySchema.parse(req.query);
    const transactions = await transactionService.getAllTransactions(filters, (req as any).user?.userId);
    res.json(transactions);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: error.errors });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Busca uma transação por ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da transação
 *     responses:
 *       200:
 *         description: Transação encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transação não encontrada
 */
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id, (req as any).user?.userId);
    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Cria uma nova transação
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       201:
 *         description: Transação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Dados inválidos
 */
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const data = createTransactionSchema.parse(req.body);
    const transaction = await transactionService.createTransaction(data, (req as any).user?.userId);
    res.status(201).json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: error.errors });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/**
 * @swagger
 * /api/transactions/bulk:
 *   post:
 *     summary: Cria múltiplas transações de uma vez
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Transaction'
 *     responses:
 *       201:
 *         description: Transações criadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 */
router.post("/bulk", authenticateToken, async (req: Request, res: Response) => {
  try {
    const dataArray = z.array(createTransactionSchema).parse(req.body);
    const transactions = await transactionService.createManyTransactions(dataArray, (req as any).user?.userId);
    res.status(201).json({ 
      count: transactions.length, 
      transactions 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: error.errors });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Atualiza uma transação existente
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da transação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       200:
 *         description: Transação atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transação não encontrada
 */
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const data = updateTransactionSchema.parse(req.body);
    const transaction = await transactionService.updateTransaction(req.params.id, data, (req as any).user?.userId);
    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: error.errors });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Remove uma transação
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da transação
 *     responses:
 *       204:
 *         description: Transação removida com sucesso
 *       404:
 *         description: Transação não encontrada
 */
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await transactionService.deleteTransaction(req.params.id, (req as any).user?.userId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/transactions/stats/summary:
 *   get:
 *     summary: Retorna estatísticas gerais das transações
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estatísticas calculadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncome:
 *                   type: number
 *                 totalExpense:
 *                   type: number
 *                 netResult:
 *                   type: number
 *                 savingsRate:
 *                   type: number
 *                 transactionCount:
 *                   type: integer
 */
router.get("/stats/summary", authenticateToken, async (req: Request, res: Response) => {
  try {
    const filters = querySchema.parse(req.query);
    const stats = await transactionService.getStatsSummary(filters, (req as any).user?.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
