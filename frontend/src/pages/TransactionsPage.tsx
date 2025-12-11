import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  CircularProgress,
  alpha,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ReceiptLong,
  Refresh,
} from '@mui/icons-material';
import type { Transaction, TransactionFilters } from '../types';
import FiltersCard from '../components/FiltersCard';
import TransactionsTable from '../components/TransactionsTable';
import TransactionForm from '../components/TransactionForm';
import PageHeader from '../components/PageHeader';

import { MetricCardSkeleton } from '../components/LoadingSkeleton';
import { showSuccess, showErrorWithRetry, showConfirm, showWarning, showToast } from '../utils/notifications';
import { hoverLift, createStaggerDelay } from '../utils/animations';
import {
  useTransactions,
  useTransactionStats,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useUpdateInstallmentGroup,
  useDeleteManyTransactions,
  useRefreshTransactions,
} from '../hooks/api/useTransactions';
import { useCategories } from '../hooks/api/useCategories';
import { useDashboardPermissions } from '../hooks/api/useDashboardPermissions';
import { useDebouncedFilters } from '../hooks/useDebounce';


export default function TransactionsPage() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const theme = useTheme();

  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
    };
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce filters for API calls (300ms delay)
  const [debouncedFilters, isFiltersPending] = useDebouncedFilters(filters, 300);

  // Custom Hooks - use debounced filters for API calls
  const { data: transactions = [], isLoading, isFetching } = useTransactions(debouncedFilters, dashboardId);
  const { data: stats, isLoading: statsLoading, isFetching: statsFetching } = useTransactionStats(debouncedFilters, dashboardId);
  const { data: categories = [] } = useCategories(dashboardId || '');
  const { canEdit } = useDashboardPermissions();
  const { refresh: refreshAll } = useRefreshTransactions();

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const updateInstallmentGroup = useUpdateInstallmentGroup();
  const deleteManyTransactions = useDeleteManyTransactions();

  // Client-side filtering for instant search
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter((t) => 
      t.description?.toLowerCase().includes(query) ||
      t.category?.toLowerCase().includes(query) ||
      t.notes?.toLowerCase().includes(query) ||
      t.institution?.toLowerCase().includes(query) ||
      t.thirdPartyName?.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    refreshAll();
    showToast('Dados atualizados!', 'success');
  }, [refreshAll]);

  const handleNewTransaction = () => {
    setSelectedTransaction(null);
    setShowTransactionForm(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    const result = await showConfirm(
      'Esta ação não poderá ser desfeita.',
      {
        title: 'Confirmar exclusão?',
        icon: 'warning',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: theme.palette.error.main,
        cancelButtonColor: theme.palette.grey[500],
      }
    );

    if (result.isConfirmed) {
      try {
        if (dashboardId) {
          await deleteTransaction.mutateAsync({ id, dashboardId });
        }
        showSuccess('Transação removida com sucesso.', { title: 'Excluído!' });
      } catch (error) {
        showErrorWithRetry(error, () => handleDeleteTransaction(id));
      }
    }
  };

  const handleSaveTransaction = async (data: Partial<Transaction>, scope?: 'single' | 'remaining' | 'all') => {
    try {
      if (selectedTransaction) {
        // Check if this is an installment transaction with group and scope is not 'single'
        const groupId = selectedTransaction.installmentGroupId;
        if (groupId && scope && scope !== 'single' && dashboardId) {
          await updateInstallmentGroup.mutateAsync({
            groupId,
            data,
            dashboardId,
            scope
          });
          const count = scope === 'all' ? selectedTransaction.installmentTotal : 'pendentes';
          showSuccess(`${count} parcelas atualizadas com sucesso.`, { title: 'Atualizado!' });
        } else {
          await updateTransaction.mutateAsync({ id: selectedTransaction.id, data: { ...data, dashboardId }, dashboardId });
          showSuccess('Transação atualizada com sucesso.', { title: 'Atualizado!' });
        }
      } else {
        await createTransaction.mutateAsync({ ...data, dashboardId } as any);
        showSuccess('Transação criada com sucesso.', { title: 'Criado!' });
      }
      setShowTransactionForm(false);
    } catch (error) {
      showErrorWithRetry(error, () => handleSaveTransaction(data, scope));
    }
  };

  const handleThirdPartyUpdate = async (id: string, data: { isThirdParty: boolean; thirdPartyName?: string; thirdPartyDescription?: string }) => {
    try {
      await updateTransaction.mutateAsync({ id, data, dashboardId });
      showSuccess(data.isThirdParty ? 'Terceiro adicionado.' : 'Terceiro removido.', { title: 'Atualizado!' });
    } catch (error) {
      showErrorWithRetry(error, () => handleThirdPartyUpdate(id, data));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTransactionIds.size === 0) return;

    const result = await showConfirm(
      `Deseja excluir ${selectedTransactionIds.size} transações selecionadas? Esta ação também excluirá parcelas relacionadas e itens das transações.`,
      {
        title: 'Confirmar exclusão em lote?',
        icon: 'warning',
        confirmButtonText: 'Sim, excluir todas',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: theme.palette.error.main,
        cancelButtonColor: theme.palette.grey[500],
      }
    );

    if (result.isConfirmed && dashboardId) {
      try {
        const idsArray = Array.from(selectedTransactionIds);
        await deleteManyTransactions.mutateAsync({
          ids: idsArray,
          dashboardId,
          includeInstallments: true,
        });
        setSelectedTransactionIds(new Set());
        showSuccess(`${selectedTransactionIds.size} transações excluídas com sucesso.`, { title: 'Excluído!' });
      } catch (error) {
        showErrorWithRetry(error, handleDeleteSelected);
      }
    }
  };

  const handleExport = useCallback((selectedIds?: string[]) => {
    // Require selection - if no transactions selected, show warning
    if (!selectedIds || selectedIds.length === 0) {
      showWarning('Selecione as transações que deseja exportar usando os checkboxes.', { title: 'Nenhuma seleção' });
      return;
    }

    const transactionsToExport = filteredTransactions.filter(t => selectedIds.includes(t.id));

    if (!transactionsToExport.length) {
      showWarning('Não há transações para exportar.', { title: 'Sem dados' });
      return;
    }

    const header = 'Data;Tipo;Fluxo;Categoria;Subcategoria;Descricao;Valor;MetodoPag;ParcelasTotal;ParcelaAtual;StatusParcela;Fonte;Observacao\n';
    const rows = transactionsToExport.map(t => {
      const date = new Date(t.date).toLocaleDateString('pt-BR');
      return [
        date,
        t.entryType,
        t.flowType,
        t.category,
        t.subcategory || '',
        t.description,
        t.amount.toString().replace('.', ','),
        t.paymentMethod || '',
        t.installmentTotal,
        t.installmentNumber,
        t.installmentStatus,
        t.institution || '',
        t.notes || '',
      ].join(';');
    }).join('\n');

    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transacoes_${selectedIds.length}_selecionadas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess(`${selectedIds.length} transações exportadas com sucesso.`, { title: 'Exportado!' });
  }, [filteredTransactions]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Check if data is being updated
  const isUpdating = isFetching || statsFetching || isFiltersPending;

  // Metrics configuration
  const metrics = [
    {
      title: 'Receitas',
      value: stats?.totalIncome || 0,
      icon: TrendingUp,
      color: 'income.main',
      bg: 'rgba(52, 211, 153, 0.12)',
    },
    {
      title: 'Despesas',
      value: stats?.totalExpense || 0,
      icon: TrendingDown,
      color: 'expense.main',
      bg: 'rgba(248, 113, 113, 0.12)',
    },
    {
      title: 'Saldo',
      value: stats?.netResult || 0,
      icon: AccountBalance,
      color: (stats?.netResult || 0) >= 0 ? 'net.main' : 'expense.main',
      bg: (stats?.netResult || 0) >= 0 ? 'rgba(96, 165, 250, 0.12)' : 'rgba(248, 113, 113, 0.12)',
    },
    {
      title: 'Total de Transações',
      value: stats?.transactionCount || 0,
      icon: ReceiptLong,
      color: 'primary.main',
      bg: 'rgba(139, 92, 246, 0.12)',
      isCurrency: false,
    },
  ];



  // Note: We no longer return early for empty state
  // The full UI (filters, metrics, table) is always shown
  // The table component handles its own empty state message

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Transações"
        breadcrumbs={[
          { label: 'Dashboards', to: '/dashboards' },
          { label: 'Transações' }
        ]}
        actionLabel={canEdit ? "Nova Transação" : undefined}
        onAction={canEdit ? handleNewTransaction : undefined}
        extra={
          <Tooltip title="Atualizar dados" arrow>
            <IconButton
              onClick={handleRefresh}
              disabled={isUpdating}
              sx={{
                ml: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              {isUpdating ? (
                <CircularProgress size={20} color="primary" />
              ) : (
                <Refresh />
              )}
            </IconButton>
          </Tooltip>
        }
      />

      {/* Update indicator */}
      {isUpdating && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              height: '100%',
              bgcolor: 'primary.main',
              animation: 'loading 1s ease-in-out infinite',
              '@keyframes loading': {
                '0%': { width: '0%', marginLeft: '0%' },
                '50%': { width: '50%', marginLeft: '25%' },
                '100%': { width: '0%', marginLeft: '100%' },
              },
            }}
          />
        </Box>
      )}

      {/* Metrics Cards */}
      {statsLoading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: metric.bg,
                  borderLeft: 3,
                  borderColor: metric.color,
                  ...hoverLift,
                  opacity: isUpdating ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  animation: `slideInUp 400ms cubic-bezier(0.4, 0, 0.2, 1) ${createStaggerDelay(index, 100)}ms both`,
                  '@keyframes slideInUp': {
                    from: {
                      opacity: 0,
                      transform: 'translateY(20px)'
                    },
                    to: {
                      opacity: 1,
                      transform: 'translateY(0)'
                    },
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      textTransform="uppercase"
                      fontWeight={600}
                      sx={{ letterSpacing: 0.5 }}
                    >
                      {metric.title}
                    </Typography>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'rotate(360deg)',
                        },
                      }}
                    >
                      <metric.icon sx={{ color: metric.color, fontSize: 24 }} />
                    </Box>
                  </Box>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{
                      color: metric.color,
                      mb: 0.5,
                      fontSize: { xs: '1.75rem', sm: '2rem' },
                    }}
                  >
                    {metric.isCurrency === false ? metric.value : formatCurrency(metric.value as number)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <FiltersCard
          filters={filters}
          onFiltersChange={setFilters}
          transactions={transactions}
          categories={categories}
        />
      </Box>

      {/* Transactions Table */}
      <TransactionsTable
        transactions={filteredTransactions}
        isLoading={isLoading}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        onNew={handleNewTransaction}
        onExport={handleExport}
        canEdit={canEdit}
        onThirdPartyUpdate={handleThirdPartyUpdate}
        selectedIds={selectedTransactionIds}
        onSelectionChange={setSelectedTransactionIds}
        onDeleteSelected={handleDeleteSelected}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Transaction Form Modal */}
      <TransactionForm
        open={showTransactionForm}
        transaction={selectedTransaction}
        onClose={() => {
          setShowTransactionForm(false);
          setSelectedTransaction(null);
        }}
        onSave={handleSaveTransaction}
      />
    </Container>
  );
}
