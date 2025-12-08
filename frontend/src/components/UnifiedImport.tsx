import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
  IconButton,
  Collapse,
  Fade,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
  useMediaQuery,
  Checkbox,
} from '@mui/material';
import {
  CloudUpload,
  Image,
  CheckCircle,
  AutoAwesome,
  ExpandMore,
  ExpandLess,
  Delete,
  Save,
  Refresh,
  CameraAlt,
  TableChart,
  PictureAsPdf,
  FileDownload,
  Close,
  Add,
  CreditCard,
  CheckBox,
  CheckBoxOutlineBlank,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import Papa from 'papaparse';
import { ingestionService, transactionService } from '../services/api';
import { showError, showErrorWithRetry, showSuccess, showWarning, showConfirm } from '../utils/notifications';
import { useCategories, useCreateCategory } from '../hooks/api/useCategories';
import { useTransactions } from '../hooks/api/useTransactions';
import type { Transaction, Category } from '../types';
import { hoverLift } from '../utils/animations';

/**
 * Verifica se duas transações são potencialmente duplicadas
 * Critérios: mesma data + valor igual + descrição similar (>70% match)
 */
function isPotentialDuplicate(
  newTx: { date: string | null; amount: number; description: string },
  existingTx: Transaction
): boolean {
  // Comparar datas (mesmo dia)
  if (newTx.date && existingTx.date) {
    const newDate = new Date(newTx.date).toDateString();
    const existDate = new Date(existingTx.date).toDateString();
    if (newDate !== existDate) return false;
  }

  // Comparar valores (tolerância de R$0.01)
  if (Math.abs(Math.abs(newTx.amount) - Math.abs(existingTx.amount)) > 0.01) return false;

  // Comparar descrições (similaridade)
  const newDesc = newTx.description.toLowerCase().trim();
  const existDesc = existingTx.description.toLowerCase().trim();

  // Match exato ou parcial (pelo menos 70% das palavras em comum)
  if (newDesc === existDesc) return true;

  const newWords = new Set(newDesc.split(/\s+/));
  const existWords = new Set(existDesc.split(/\s+/));
  const commonWords = [...newWords].filter(w => existWords.has(w));
  const similarity = commonWords.length / Math.max(newWords.size, existWords.size);

  return similarity >= 0.7;
}

/**
 * Encontra possíveis duplicatas em uma lista de transações existentes
 */
function findDuplicates(
  newTransactions: Array<{ date: string | null; amount: number; description: string }>,
  existingTransactions: Transaction[]
): Map<number, Transaction> {
  const duplicates = new Map<number, Transaction>();

  newTransactions.forEach((newTx, index) => {
    const duplicate = existingTransactions.find(existing =>
      isPotentialDuplicate(newTx, existing)
    );
    if (duplicate) {
      duplicates.set(index, duplicate);
    }
  });

  return duplicates;
}

/**
 * Calcula similaridade entre duas strings baseado em palavras em comum
 */
function calculateWordSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().trim().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.toLowerCase().trim().split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const commonWords = [...words1].filter(w => words2.has(w));
  return commonWords.length / Math.max(words1.size, words2.size);
}

/**
 * Encontra transações existentes que podem corresponder a uma nota fiscal
 * Critérios mais flexíveis que duplicatas: valor exato, data ±5 dias, nome >50% similar
 */
function findMatchingTransactions(
  invoice: { date: string | null; amount: number; merchant: string | null },
  existingTransactions: Transaction[],
  dateRangeDays: number = 5
): Transaction[] {
  return existingTransactions.filter(existing => {
    // 1. Valor exato (tolerância R$0.01)
    if (Math.abs(Math.abs(invoice.amount) - Math.abs(existing.amount)) > 0.01) return false;

    // 2. Data dentro do range (±N dias)
    if (invoice.date && existing.date) {
      const invoiceDate = new Date(invoice.date);
      const existingDate = new Date(existing.date);
      const diffDays = Math.abs(invoiceDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > dateRangeDays) return false;
    }

    // 3. Similaridade de nome (>50%) - se tiver nome
    if (invoice.merchant) {
      const similarity = calculateWordSimilarity(invoice.merchant, existing.description);
      if (similarity < 0.3) return false; // Threshold baixo para não perder matches
    }

    return true;
  });
}

interface ExtractedItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
}

// Transação individual extraída de uma fatura
interface ExtractedTransaction {
  merchant: string | null;
  date: string | null;
  amount: number;
  category?: string | null;
  description?: string | null;
  installmentInfo?: string | null;
  cardLastDigits?: string | null;
}

// Metadados da fatura
interface StatementInfo {
  institution?: string | null;
  cardLastDigits?: string | null;
  dueDate?: string | null;
  totalAmount?: number | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  holderName?: string | null;
}

interface ExtractionResult {
  merchant: string | null;
  date: string | null;
  amount: number;
  category?: string | null;
  items?: ExtractedItem[] | null;
  confidence: number;
  extractionMethod: 'regex' | 'ai';
  // Multi-transaction fields
  isMultiTransaction?: boolean;
  transactions?: ExtractedTransaction[];
  statementInfo?: StatementInfo;
}

interface UnifiedImportProps {
  onImportCSV: (transactions: Partial<Transaction>[]) => void;
  onSaveAITransaction?: (data: Partial<Transaction>) => void;
  compact?: boolean;
}

type ImportMode = 'csv' | 'ai';

export default function UnifiedImport({ onImportCSV, onSaveAITransaction }: UnifiedImportProps) {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mode, setMode] = useState<ImportMode>('csv');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Partial<Transaction>[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-transaction state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [duplicateWarnings, setDuplicateWarnings] = useState<Map<number, Transaction>>(new Map());
  const [loadingTime, setLoadingTime] = useState(0);

  // Invoice-transaction merge state
  const [matchingTransactions, setMatchingTransactions] = useState<Transaction[]>([]);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [, setSelectedMergeTarget] = useState<Transaction | null>(null);

  // Track loading time for user feedback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingTime(0);
      interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  // Dynamic loading message based on elapsed time
  const getLoadingMessage = () => {
    if (loadingTime < 5) return 'Enviando documento para análise...';
    if (loadingTime < 15) return 'Processando documento com IA...';
    if (loadingTime < 30) return '📄 Documento grande detectado. A IA está extraindo todas as transações...';
    if (loadingTime < 60) return '⏳ PDF com múltiplas páginas. Isso pode levar até 1 minuto...';
    return '🔄 Quase lá! Processando últimas informações...';
  };

  // Fetch existing transactions for duplicate detection
  const { data: existingTransactions = [] } = useTransactions({}, dashboardId);

  // Detect file type and set mode automatically
  const detectFileType = (file: File): ImportMode => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') return 'csv';
    return 'ai';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    const detectedMode = detectFileType(selectedFile);
    setMode(detectedMode);
    setFile(selectedFile);
    setResult(null);
    setCsvPreview(null);

    // Auto-process CSV files
    if (detectedMode === 'csv') {
      processCSV(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString();
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`;
  };

  const processCSV = (csvFile: File) => {
    setLoading(true);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      complete: (results) => {
        try {
          const transactions = results.data.map((row: any) => ({
            date: parseDate(row.Data),
            entryType: row.Tipo,
            flowType: row.Fluxo || 'Variável',
            category: row.Categoria || 'Outros',
            subcategory: row.Subcategoria,
            description: row.Descricao || row.Descrição,
            amount: parseFloat(row.Valor?.replace(',', '.')) || 0,
            paymentMethod: row.MetodoPag || row.Pagamento,
            institution: row.Fonte || row.Banco,
            cardBrand: row.Bandeira || row.Cartao,
            installmentTotal: parseInt(row.ParcelasTotal, 10) || 0,
            installmentNumber: parseInt(row.ParcelaAtual, 10) || 0,
            installmentStatus: row.StatusParcela || 'N/A',
            notes: row.Observacao,
            isTemporary: false,
            dashboardId,
          })).filter((t: any) => t.date && t.entryType && t.description);

          setCsvPreview(transactions);
          setLoading(false);
        } catch (error) {
          showError(error, { title: 'Erro', text: 'Não foi possível processar o arquivo CSV.' });
          setLoading(false);
        }
      },
      error: () => {
        showError('Erro ao ler arquivo', { title: 'Erro' });
        setLoading(false);
      }
    });
  };

  const { data: categories } = useCategories(dashboardId!);
  const createCategory = useCreateCategory();

  const handleUploadAI = async () => {
    if (!file) return;

    setLoading(true);
    setMatchingTransactions([]);
    setShowMergeDialog(false);

    try {
      const categoryNames = categories?.map((c: Category) => c.name) || [];
      const data = await ingestionService.upload(file, categoryNames);
      setResult(data);

      // Se for multi-transação (fatura), seleciona todas por padrão
      if (data.isMultiTransaction && data.transactions) {
        setSelectedTransactions(new Set(data.transactions.map((_: ExtractedTransaction, i: number) => i)));
      } else {
        // Single transaction (nota fiscal) - verificar se já existe uma transação similar
        const matches = findMatchingTransactions(
          {
            date: data.date,
            amount: data.amount,
            merchant: data.merchant
          },
          existingTransactions
        );

        if (matches.length > 0) {
          setMatchingTransactions(matches);
          setShowMergeDialog(true);
          showSuccess(`Documento processado! Encontrada(s) ${matches.length} transação(ões) compatível(is).`);
        } else {
          showSuccess('Documento processado com sucesso!');
        }
      }
    } catch (error: any) {
      showErrorWithRetry(error, handleUploadAI);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAITransaction = async () => {
    if (!result || !dashboardId) return;

    setSaving(true);
    try {
      let finalCategory = result.category || 'Outros';

      // Verifica se a categoria existe
      const categoryExists = categories?.some((c: Category) => c.name.toLowerCase() === finalCategory.toLowerCase());

      // Se não existe e não é "Outros", pergunta se quer criar
      if (finalCategory !== 'Outros' && !categoryExists) {
        const confirmed = await showConfirm(
          `A IA sugeriu a categoria "${finalCategory}", que ainda não existe. Deseja criá-la agora?`,
          {
            title: 'Nova Categoria',
            confirmButtonText: 'Sim, criar',
            cancelButtonText: 'Não, usar "Outros"',
            icon: 'question'
          }
        );

        if (confirmed.isConfirmed) {
          try {
            await createCategory.mutateAsync({
              data: { name: finalCategory, type: 'Despesa' },
              dashboardId
            });
            showSuccess(`Categoria "${finalCategory}" criada!`, { timer: 1500 });
          } catch (err) {
            console.error('Erro ao criar categoria:', err);
            showWarning('Não foi possível criar a categoria. Usando "Outros".');
            finalCategory = 'Outros';
          }
        } else {
          finalCategory = 'Outros';
        }
      }

      const transactionData = {
        description: result.merchant || 'Despesa não identificada',
        amount: result.amount,
        date: result.date || new Date().toISOString(),
        entryType: 'Despesa' as const,
        flowType: 'Variável' as const,
        category: finalCategory,
        installmentTotal: 1,
        installmentNumber: 1,
        installmentStatus: 'Paga' as const,
        isTemporary: false,
        dashboardId,
        items: result.items?.map(item => ({
          ...item,
          quantity: item.quantity || 1
        })) || undefined,
      };

      if (onSaveAITransaction) {
        onSaveAITransaction(transactionData);
      } else {
        await transactionService.create(transactionData);
      }

      showSuccess('Transação salva com sucesso!');
      handleClear();
    } catch (error) {
      showError(error, { title: 'Erro', text: 'Não foi possível salvar a transação.' });
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = () => {
    if (!csvPreview || csvPreview.length === 0) {
      showWarning('Nenhuma transação válida encontrada.', { title: 'Atenção' });
      return;
    }
    onImportCSV(csvPreview);
    handleClear();
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setCsvPreview(null);
    setSelectedTransactions(new Set());
    setDuplicateWarnings(new Map());
    setMatchingTransactions([]);
    setShowMergeDialog(false);
    setSelectedMergeTarget(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Multi-transaction handlers
  const toggleTransaction = (index: number) => {
    setSelectedTransactions(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  /**
   * Parseia informações de parcelamento de textos como:
   * - "Parcela 02 de 12"
   * - "02/12"
   * - "Parcela 2/12"
   * - "2 de 12"
   * Retorna {current, total} ou null se não for parcelado
   */
  const parseInstallmentInfo = (info: string | null | undefined): { current: number; total: number } | null => {
    if (!info) return null;

    // Padrões comuns: "Parcela 02 de 12", "02/12", "2/12", "Parcela 2 de 12"
    const patterns = [
      /parcela\s*(\d+)\s*de\s*(\d+)/i,
      /parcela\s*(\d+)\s*\/\s*(\d+)/i,
      /(\d+)\s*de\s*(\d+)/i,
      /(\d+)\s*\/\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = info.match(pattern);
      if (match) {
        const current = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);
        if (current > 0 && total > 0 && current <= total) {
          return { current, total };
        }
      }
    }

    return null;
  };

  /**
   * Adiciona meses a uma data
   */
  const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };

  const selectAllTransactions = () => {
    if (result?.transactions) {
      setSelectedTransactions(new Set(result.transactions.map((_, i) => i)));
    }
  };

  const deselectAllTransactions = () => {
    setSelectedTransactions(new Set());
  };

  const handleSaveMultipleTransactions = async () => {
    if (!result?.transactions || !dashboardId || selectedTransactions.size === 0) return;

    const selectedTxs = result.transactions.filter((_, i) => selectedTransactions.has(i));

    // Identificar categorias novas nas transações selecionadas
    const uniqueCategories = new Set<string>();
    const categoryTypes = new Map<string, 'Receita' | 'Despesa'>();

    selectedTxs.forEach(tx => {
      if (tx.category && tx.category !== 'Outros') {
        uniqueCategories.add(tx.category);
        // Guarda o tipo da primeira ocorrência para usar na criação
        if (!categoryTypes.has(tx.category)) {
          categoryTypes.set(tx.category, tx.amount < 0 ? 'Receita' : 'Despesa');
        }
      }
    });

    // Filtrar apenas as que não existem
    const categoriesToCreate: string[] = [];
    const normalizedExistingCategories = new Set(
      categories?.map((c: Category) => c.name.toLowerCase()) || []
    );

    uniqueCategories.forEach(cat => {
      if (!normalizedExistingCategories.has(cat.toLowerCase())) {
        categoriesToCreate.push(cat);
      }
    });

    // Mapa de substituição (caso o usuário negue a criação ou ocorra erro)
    const categoryReplacementMap = new Map<string, string>();

    // Se houver categorias novas, perguntar ao usuário
    if (categoriesToCreate.length > 0) {
      const categoryList = categoriesToCreate.map(c => `- ${c} (${categoryTypes.get(c) || 'Despesa'})`).join('\n');
      const confirmed = await showConfirm(
        `A importação contém ${categoriesToCreate.length} categorias que ainda não existem:\n\n${categoryList}\n\nDeseja criá-las automaticamente?`,
        {
          title: 'Novas Categorias Detectadas',
          confirmButtonText: 'Sim, criar todas',
          cancelButtonText: 'Não, usar "Outros"',
          icon: 'question'
        }
      );

      if (confirmed.isConfirmed) {
        setSaving(true);
        try {
          await Promise.all(categoriesToCreate.map(catName =>
            createCategory.mutateAsync({
              data: {
                name: catName,
                type: categoryTypes.get(catName) || 'Despesa'
              },
              dashboardId
            })
          ));
          showSuccess(`${categoriesToCreate.length} categorias criadas com sucesso!`, { timer: 2000 });
        } catch (err) {
          console.error('Erro ao criar categorias em lote:', err);
          showWarning('Ocorreu um erro ao criar algumas categorias. Elas serão convertidas para "Outros".');
          categoriesToCreate.forEach(cat => categoryReplacementMap.set(cat, 'Outros'));
        } finally {
          setSaving(false);
        }
      } else {
        categoriesToCreate.forEach(cat => categoryReplacementMap.set(cat, 'Outros'));
      }
    }

    // Preparar transações para salvar (incluindo parcelas futuras)
    const allTransactionsToSave: Array<{
      description: string;
      amount: number;
      date: string;
      entryType: 'Receita' | 'Despesa';
      flowType: 'Fixa' | 'Variável';
      category: string;
      installmentTotal: number;
      installmentNumber: number;
      installmentStatus: 'N/A' | 'Paga' | 'Pendente';
      installmentGroupId?: string;
      isTemporary: boolean;
      dashboardId: string;
      notes?: string;
    }> = [];

    let totalInstallmentsCreated = 0;

    for (const tx of selectedTxs) {
      const installment = parseInstallmentInfo(tx.installmentInfo);
      const description = tx.merchant || tx.description || 'Transação';
      const amount = Math.abs(tx.amount); // Parcelas são sempre positivas
      const entryType = tx.amount < 0 ? 'Receita' as const : 'Despesa' as const;

      const originalCat = tx.category || 'Outros';
      const finalCategory = categoryReplacementMap.get(originalCat) || originalCat;

      // Data original da transação (quando a compra foi feita)
      const transactionDate = tx.date ? new Date(tx.date) : new Date();

      // Data de vencimento da fatura (quando será cobrada)
      const statementDueDate = result.statementInfo?.dueDate
        ? new Date(result.statementInfo.dueDate)
        : transactionDate;

      if (installment && installment.total > 1) {
        // Gerar ID único para vincular todas as parcelas deste grupo
        const groupId = crypto.randomUUID();

        // Transação parcelada - criar apenas a parcela atual e futuras
        // NÃO criar parcelas passadas (já foram pagas em faturas anteriores)
        for (let i = installment.current; i <= installment.total; i++) {
          const monthsToAdd = i - installment.current;
          // Usar a data de vencimento da fatura como base para cálculo das parcelas
          const installmentDate = addMonths(statementDueDate, monthsToAdd);

          allTransactionsToSave.push({
            description: `${description} (${i}/${installment.total})`,
            amount,
            date: installmentDate.toISOString(),
            entryType,
            flowType: 'Variável' as const,
            category: finalCategory,
            installmentTotal: installment.total,
            installmentNumber: i,
            installmentStatus: i === installment.current ? 'Paga' as const : 'Pendente' as const,
            installmentGroupId: groupId,
            isTemporary: false,
            dashboardId,
            notes: i === installment.current
              ? `Compra em ${transactionDate.toLocaleDateString('pt-BR')} | Vencimento: ${statementDueDate.toLocaleDateString('pt-BR')}`
              : `Parcela futura | Vencimento: ${installmentDate.toLocaleDateString('pt-BR')}`,
          });
          totalInstallmentsCreated++;
        }
      } else {
        // Transação única (sem parcelamento) - usa data original da transação
        const dueDateNote = result.statementInfo?.dueDate
          ? ` | Vencimento da fatura: ${statementDueDate.toLocaleDateString('pt-BR')}`
          : '';

        allTransactionsToSave.push({
          description,
          amount,
          date: transactionDate.toISOString(),
          entryType,
          flowType: 'Variável' as const,
          category: finalCategory,
          installmentTotal: 1,
          installmentNumber: 1,
          installmentStatus: 'Paga' as const,
          isTemporary: false,
          dashboardId,
          notes: (tx.installmentInfo || '') + dueDateNote || undefined,
        });
      }
    }

    // Verificar duplicatas antes de salvar
    if (existingTransactions.length > 0) {
      const duplicates = findDuplicates(allTransactionsToSave, existingTransactions);

      if (duplicates.size > 0) {
        const duplicateCount = duplicates.size;
        const duplicateList = [...duplicates.entries()].slice(0, 3).map(([idx]) => {
          const tx = allTransactionsToSave[idx];
          return `- ${tx.description} (${formatCurrency(tx.amount)})`;
        }).join('\n');

        const moreText = duplicateCount > 3 ? `\n...e mais ${duplicateCount - 3}` : '';

        const confirmed = await showConfirm(
          `Foram encontradas ${duplicateCount} possíveis transações duplicadas:\n\n${duplicateList}${moreText}\n\nDeseja importar mesmo assim?`,
          {
            title: '⚠️ Possíveis Duplicatas',
            confirmButtonText: 'Sim, importar todas',
            cancelButtonText: 'Cancelar',
            icon: 'warning'
          }
        );

        if (!confirmed.isConfirmed) {
          setDuplicateWarnings(duplicates);
          showWarning(`${duplicateCount} possíveis duplicatas marcadas. Revise ou desmarque antes de importar.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      await transactionService.createMany(allTransactionsToSave);

      const installmentsMsg = totalInstallmentsCreated > selectedTransactions.size
        ? ` (incluindo ${totalInstallmentsCreated - selectedTransactions.size} parcelas futuras)`
        : '';
      showSuccess(`${allTransactionsToSave.length} transações importadas com sucesso!${installmentsMsg}`);
      handleClear();
    } catch (error) {
      showError(error, { title: 'Erro', text: 'Não foi possível salvar as transações.' });
    } finally {
      setSaving(false);
    }
  };

  const getSelectedTotal = () => {
    if (!result?.transactions) return 0;
    // Calcula total de despesas (excluindo pagamentos de fatura que são movimentações internas)
    // Pagamentos de fatura geralmente têm valores muito altos e categoria "Pagamento"
    return result.transactions
      .filter((_, i) => selectedTransactions.has(i))
      .filter(tx => {
        const cat = (tx.category || '').toLowerCase();
        // Exclui pagamentos de fatura (são movimentações internas do cartão)
        const isPagamentoFatura = cat.includes('pagamento') && tx.amount < 0;
        return !isPagamentoFatura;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  // Conta quantos são pagamentos de fatura (para informar o usuário)
  const getPaymentCount = () => {
    if (!result?.transactions) return 0;
    return result.transactions
      .filter((_, i) => selectedTransactions.has(i))
      .filter(tx => {
        const cat = (tx.category || '').toLowerCase();
        return cat.includes('pagamento') && tx.amount < 0;
      })
      .length;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não identificada';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  /**
   * Handler para mesclar dados da nota fiscal com uma transação existente
   */
  const handleMergeWithTransaction = async (targetTransaction: Transaction) => {
    if (!result || !dashboardId) return;

    setSaving(true);
    try {
      // Atualizar a transação existente com os dados da nota fiscal
      const updateData: Partial<Transaction> = {
        // Adicionar itens da NF (se tiver)
        items: result.items?.map(item => ({
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        // Atualizar notas com informações adicionais
        notes: [
          targetTransaction.notes || '',
          `📄 Dados mesclados de nota fiscal:`,
          result.merchant ? `Comerciante: ${result.merchant}` : '',
          result.date ? `Data NF: ${formatDate(result.date)}` : '',
        ].filter(Boolean).join('\n'),
      };

      await transactionService.update(targetTransaction.id, updateData);

      showSuccess(`Nota fiscal mesclada com "${targetTransaction.description}"! ${result.items?.length || 0} itens adicionados.`);
      handleClear();
    } catch (error) {
      showError(error, { title: 'Erro', text: 'Não foi possível mesclar os dados.' });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handler para criar como nova transação (ignorar matches)
   */
  const handleCreateNewTransaction = () => {
    setShowMergeDialog(false);
    setMatchingTransactions([]);
    // O fluxo normal de handleSaveAITransaction será usado
  };

  /**
   * Renderiza o diálogo de merge quando há matches
   */
  const renderMergeDialog = () => {
    if (!showMergeDialog || matchingTransactions.length === 0 || !result) return null;

    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: `2px solid ${theme.palette.warning.main}`,
          background: alpha(theme.palette.warning.main, 0.05),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AutoAwesome color="warning" />
          <Typography variant="h6" fontWeight={600}>
            🔗 Transação Compatível Encontrada!
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Esta nota fiscal pode corresponder a uma transação já existente.
          Deseja mesclar os dados ou criar uma nova transação?
        </Typography>

        {/* Comparação lado a lado */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
          {/* Dados da Nota Fiscal */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>
              📄 Nota Fiscal (Nova)
            </Typography>
            <List dense disablePadding>
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText
                  primary="Comerciante"
                  secondary={result.merchant || 'Não identificado'}
                  primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  secondaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText
                  primary="Valor"
                  secondary={formatCurrency(result.amount)}
                  primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  secondaryTypographyProps={{ fontWeight: 600, color: 'error.main' }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText
                  primary="Data"
                  secondary={formatDate(result.date)}
                  primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
              </ListItem>
              {result.items && result.items.length > 0 && (
                <ListItem disablePadding sx={{ py: 0.5 }}>
                  <ListItemText
                    primary="Itens"
                    secondary={`${result.items.length} itens detalhados`}
                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    secondaryTypographyProps={{ color: 'success.main', fontWeight: 500 }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          {/* Transações compatíveis */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="secondary" fontWeight={600} gutterBottom>
              💳 Transação Existente
            </Typography>
            {matchingTransactions.slice(0, 3).map((tx, idx) => (
              <Box key={tx.id} sx={{ mb: idx < matchingTransactions.length - 1 ? 2 : 0 }}>
                <List dense disablePadding>
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary="Descrição"
                      secondary={tx.description}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                      secondaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary="Valor"
                      secondary={formatCurrency(tx.amount)}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                      secondaryTypographyProps={{ fontWeight: 600, color: 'error.main' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary="Data"
                      secondary={formatDate(tx.date as string)}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    />
                  </ListItem>
                </List>
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={() => handleMergeWithTransaction(tx)}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} /> : <CheckCircle />}
                  sx={{ mt: 1, borderRadius: 2 }}
                >
                  Mesclar com esta
                </Button>
              </Box>
            ))}
          </Paper>
        </Box>

        {/* Ações */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCreateNewTransaction}
            startIcon={<Add />}
          >
            Criar Nova Transação
          </Button>
        </Box>
      </Paper>
    );
  };



  return (
    <Card
      elevation={4}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(145deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
          : theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        ...hoverLift,
      }}
    >
      {/* Header with Mode Toggle */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          p: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloudUpload sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                Importar Dados
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {mode === 'csv' ? 'Planilha CSV com transações' : 'Notas fiscais e boletos via IA'}
              </Typography>
            </Box>
          </Box>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => newMode && setMode(newMode)}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              '& .MuiToggleButton-root': {
                px: { xs: 1.5, sm: 2.5 },
                py: 1,
                borderRadius: '12px !important',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                fontWeight: 600,
                textTransform: 'none',
                gap: 1,
                '&.Mui-selected': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  }
                }
              }
            }}
          >
            <ToggleButton value="csv">
              <TableChart fontSize="small" />
              {!isMobile && 'Planilha'}
            </ToggleButton>
            <ToggleButton value="ai">
              <AutoAwesome fontSize="small" />
              {!isMobile && 'IA'}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Drop Zone - Show when no file selected or no result */}
        {!result && !csvPreview && (
          <Fade in timeout={300}>
            <Box
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '3px dashed',
                borderColor: dragActive ? 'primary.main' : alpha(theme.palette.primary.main, 0.3),
                borderRadius: 3,
                p: { xs: 3, sm: 5 },
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragActive
                  ? alpha(theme.palette.primary.main, 0.08)
                  : alpha(theme.palette.background.default, 0.5),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: 'primary.main',
                  transform: 'scale(1.01)',
                  '& .upload-icon': {
                    transform: 'translateY(-5px)',
                  }
                },
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={mode === 'csv' ? '.csv' : '.pdf,.jpg,.jpeg,.png'}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {file && loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ position: 'relative' }}>
                    {file.type === 'application/pdf' ? (
                      <PictureAsPdf sx={{ fontSize: 64, color: 'error.main' }} />
                    ) : file.name.endsWith('.csv') ? (
                      <TableChart sx={{ fontSize: 64, color: 'success.main' }} />
                    ) : (
                      <Image sx={{ fontSize: 64, color: 'primary.main' }} />
                    )}
                  </Box>
                  <Typography variant="h6" fontWeight={600}>{file.name}</Typography>
                  <Box sx={{ width: '100%', maxWidth: 300 }}>
                    <LinearProgress
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {mode === 'csv' ? 'Processando planilha...' : getLoadingMessage()}
                  </Typography>
                  {mode === 'ai' && loadingTime > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      ⏱️ {loadingTime}s
                    </Typography>
                  )}
                </Box>
              ) : file && mode === 'ai' && !result ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ position: 'relative' }}>
                    {file.type === 'application/pdf' ? (
                      <PictureAsPdf sx={{ fontSize: 72, color: 'error.main' }} />
                    ) : (
                      <Image sx={{ fontSize: 72, color: 'primary.main' }} />
                    )}
                    <Chip
                      size="small"
                      label={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      sx={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)' }}
                    />
                  </Box>
                  <Typography variant="h6" fontWeight={600}>{file.name}</Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadAI();
                      }}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontWeight: 600,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                        }
                      }}
                    >
                      Extrair com IA
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      startIcon={<Delete />}
                      sx={{ borderRadius: 3 }}
                    >
                      Remover
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box
                    className="upload-icon"
                    sx={{
                      p: 2.5,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                      transition: 'transform 0.3s ease',
                      mb: 1,
                    }}
                  >
                    <CloudUpload
                      sx={{
                        fontSize: 56,
                        color: 'primary.main',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {dragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    ou clique para selecionar do seu computador
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                    {mode === 'csv' ? (
                      <Chip
                        icon={<TableChart />}
                        label="CSV"
                        variant="outlined"
                        color="success"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <>
                        <Chip
                          icon={<PictureAsPdf />}
                          label="PDF"
                          variant="outlined"
                          color="error"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          icon={<CameraAlt />}
                          label="JPG/PNG"
                          variant="outlined"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                      </>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Tamanho máximo: 10 MB
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* CSV Preview */}
        {csvPreview && csvPreview.length > 0 && (
          <Fade in timeout={500}>
            <Box>
              <Alert
                severity="success"
                icon={<CheckCircle fontSize="inherit" />}
                sx={{ mb: 3, fontWeight: 500, borderRadius: 2 }}
                action={
                  <IconButton size="small" onClick={handleClear}>
                    <Close fontSize="small" />
                  </IconButton>
                }
              >
                ✨ {csvPreview.length} transações encontradas! Revise e importe.
              </Alert>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  maxHeight: 300,
                  overflow: 'auto',
                  mb: 3,
                }}
              >
                <List dense disablePadding>
                  {csvPreview.slice(0, 10).map((t, index) => (
                    <ListItem
                      key={index}
                      divider={index < Math.min(csvPreview.length, 10) - 1}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemText
                        primary={t.description}
                        secondary={`${t.entryType} • ${t.category}`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      <Chip
                        label={formatCurrency(t.amount || 0)}
                        size="small"
                        color={t.entryType === 'Receita' ? 'success' : 'error'}
                        sx={{ fontWeight: 600 }}
                      />
                    </ListItem>
                  ))}
                  {csvPreview.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={`... e mais ${csvPreview.length - 10} transações`}
                        primaryTypographyProps={{ color: 'text.secondary', fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={handleImportCSV}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                  }}
                >
                  Importar {csvPreview.length} Transações
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Refresh />}
                  onClick={handleClear}
                  sx={{ borderRadius: 3 }}
                >
                  Novo Arquivo
                </Button>
              </Stack>
            </Box>
          </Fade>
        )}

        {/* AI Extraction Result */}
        {result && (
          <Fade in timeout={500}>
            <Box>
              {/* Multi-Transaction View (Credit Card Statement) */}
              {result.isMultiTransaction && result.transactions ? (
                <>
                  <Alert
                    severity="success"
                    icon={<CreditCard fontSize="inherit" />}
                    sx={{ mb: 3, fontWeight: 500, borderRadius: 2 }}
                  >
                    💳 Fatura detectada! {result.transactions.length} transações encontradas.
                  </Alert>

                  {/* Statement Info Header */}
                  {result.statementInfo && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        background: alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CreditCard color="primary" />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              {result.statementInfo.institution || 'Cartão'}
                            </Typography>
                            <Typography variant="h6" fontWeight={700}>
                              **** {result.statementInfo.cardLastDigits || '****'}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Vencimento
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {result.statementInfo.dueDate ? formatDate(result.statementInfo.dueDate) : '-'}
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total da Fatura
                          </Typography>
                          <Typography variant="h6" fontWeight={700} color="error.main">
                            {formatCurrency(result.statementInfo.totalAmount || result.amount)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  )}

                  {/* Selection Controls */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CheckBox />}
                        onClick={selectAllTransactions}
                      >
                        Selecionar Todas
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CheckBoxOutlineBlank />}
                        onClick={deselectAllTransactions}
                      >
                        Desmarcar
                      </Button>
                    </Box>
                    <Chip
                      label={`${selectedTransactions.size} de ${result.transactions.length} selecionadas`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  {/* Transaction List */}
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      maxHeight: 400,
                      overflow: 'auto',
                      mb: 3,
                    }}
                  >
                    <List dense disablePadding>
                      {result.transactions.map((tx, index) => {
                        const isDuplicate = duplicateWarnings.has(index);
                        return (
                          <ListItem
                            key={index}
                            divider={index < result.transactions!.length - 1}
                            sx={{
                              py: 1.5,
                              bgcolor: isDuplicate
                                ? alpha(theme.palette.warning.main, 0.15)
                                : selectedTransactions.has(index)
                                  ? alpha(theme.palette.primary.main, 0.08)
                                  : 'transparent',
                              borderLeft: isDuplicate ? `4px solid ${theme.palette.warning.main}` : 'none',
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                            }}
                            secondaryAction={
                              <Stack direction="row" spacing={1} alignItems="center">
                                {isDuplicate && (
                                  <Chip
                                    size="small"
                                    label="⚠️ Duplicata?"
                                    color="warning"
                                    sx={{ fontSize: '0.65rem' }}
                                  />
                                )}
                                <Typography
                                  fontWeight={600}
                                  color={tx.amount < 0 ? 'success.main' : 'text.primary'}
                                >
                                  {tx.amount < 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                                </Typography>
                              </Stack>
                            }
                          >
                            <Checkbox
                              checked={selectedTransactions.has(index)}
                              onChange={() => toggleTransaction(index)}
                              sx={{ mr: 1 }}
                            />
                            <ListItemText
                              primary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography component="span" fontWeight={500}>
                                    {tx.merchant || tx.description || 'Transação'}
                                  </Typography>
                                  {tx.installmentInfo && (
                                    <Chip size="small" label={tx.installmentInfo} sx={{ fontSize: '0.7rem' }} />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box component="span" sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    📅 {tx.date ? formatDate(tx.date) : '-'}
                                  </Typography>
                                  {tx.category && (
                                    <Typography component="span" variant="caption" color="text.secondary">
                                      🏷️ {tx.category}
                                    </Typography>
                                  )}
                                  {tx.cardLastDigits && (
                                    <Typography component="span" variant="caption" color="text.secondary">
                                      💳 ****{tx.cardLastDigits}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Paper>

                  {/* Summary and Save */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      mb: 2,
                      background: alpha(theme.palette.success.main, 0.05),
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography>
                          Total selecionado: <strong>{selectedTransactions.size}</strong> transações
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                          {formatCurrency(getSelectedTotal())}
                        </Typography>
                      </Stack>
                      {getPaymentCount() > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          * Excluindo {getPaymentCount()} pagamento(s) de fatura anterior
                        </Typography>
                      )}
                    </Stack>
                  </Paper>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                      onClick={handleSaveMultipleTransactions}
                      disabled={saving || selectedTransactions.size === 0}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontWeight: 600,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      }}
                    >
                      {saving ? 'Salvando...' : `Importar ${selectedTransactions.size} Transações`}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<Refresh />}
                      onClick={handleClear}
                      disabled={saving}
                      sx={{ borderRadius: 3 }}
                    >
                      Novo Documento
                    </Button>
                  </Stack>
                </>
              ) : (
                /* Single Transaction View (Original) */
                <>
                  <Alert
                    severity="success"
                    icon={<CheckCircle fontSize="inherit" />}
                    sx={{ mb: 3, fontWeight: 500, borderRadius: 2 }}
                  >
                    ✨ Dados extraídos! Revise as informações antes de salvar.
                  </Alert>

                  {/* Merge Dialog - shows when matching transactions found */}
                  {renderMergeDialog()}

                  <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight={600}>
                          Estabelecimento
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {result.merchant || 'Não identificado'}
                        </Typography>
                      </Box>
                      <Chip
                        label={result.extractionMethod === 'ai' ? '🤖 IA Generativa' : '⚡ Regex'}
                        color={result.extractionMethod === 'ai' ? 'secondary' : 'primary'}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
                      <Box flex={1}>
                        <Typography variant="overline" color="text.secondary" fontWeight={600}>
                          📅 Data
                        </Typography>
                        <Typography variant="h6" fontWeight={500}>
                          {formatDate(result.date)}
                        </Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography variant="overline" color="text.secondary" fontWeight={600}>
                          💰 Valor
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {formatCurrency(result.amount)}
                        </Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography variant="overline" color="text.secondary" fontWeight={600}>
                          🎯 Confiança
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress
                            variant="determinate"
                            value={result.confidence * 100}
                            size={32}
                            thickness={5}
                            color={result.confidence > 0.8 ? 'success' : 'warning'}
                          />
                          <Typography variant="h6" fontWeight={600}>
                            {Math.round(result.confidence * 100)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>

                    {result.category && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="overline" color="text.secondary" fontWeight={600}>
                          🏷️ Categoria
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip label={result.category} color="info" />
                        </Box>
                      </Box>
                    )}

                    {result.items && result.items.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1 }}
                          onClick={() => setShowItems(!showItems)}
                        >
                          <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1 }}>
                            📋 Itens ({result.items.length})
                          </Typography>
                          <IconButton size="small">
                            {showItems ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                        <Collapse in={showItems}>
                          <List dense disablePadding>
                            {result.items.map((item, index) => (
                              <ListItem key={index} divider sx={{ py: 1 }}>
                                <ListItemText
                                  primary={item.description}
                                  secondary={item.quantity ? `${item.quantity}x` : null}
                                />
                                <Typography fontWeight={600}>
                                  {formatCurrency(item.totalPrice)}
                                </Typography>
                              </ListItem>
                            ))}
                          </List>
                        </Collapse>
                      </>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                        onClick={handleSaveAITransaction}
                        disabled={saving}
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontWeight: 600,
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        }}
                      >
                        {saving ? 'Salvando...' : 'Salvar Transação'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<Refresh />}
                        onClick={handleClear}
                        disabled={saving}
                        sx={{ borderRadius: 3 }}
                      >
                        Novo Documento
                      </Button>
                    </Stack>
                  </Paper>
                </>
              )}
            </Box>
          </Fade>
        )}

        {/* Download Template - Only for CSV mode */}
        {mode === 'csv' && !csvPreview && !file && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="text"
              startIcon={<FileDownload />}
              href="/assets/template_financas.csv"
              download
              sx={{ fontWeight: 500 }}
            >
              Baixar Modelo CSV
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
