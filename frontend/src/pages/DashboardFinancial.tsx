import { useState, useCallback } from 'react';
import {
  Box,
  Container,
  useTheme,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import type { Transaction, TransactionFilters } from '../types';
import MetricsCards from '../components/MetricsCards';
import FiltersCard from '../components/FiltersCard';
import ChartsSection from '../components/ChartsSection';
import TransactionsTable from '../components/TransactionsTable';
import TransactionForm from '../components/TransactionForm';
import QuickEntryForm from '../components/QuickEntryForm';
import UnifiedImport from '../components/UnifiedImport';
import PageHeader from '../components/PageHeader';
import { DashboardSkeleton } from '../components/Skeletons';
import { showSuccess, showErrorWithRetry, showConfirm, showWarning } from '../utils/notifications';
import {
  useTransactions,
  useTransactionStats,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCreateManyTransactions,
  useUpdateInstallmentGroup
} from '../hooks/api/useTransactions';

export default function DashboardFinancial() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const theme = useTheme();

  const [filters, setFilters] = useState<TransactionFilters>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Custom Hooks
  const { data: transactions = [], refetch, isLoading } = useTransactions(filters, dashboardId);
  const { data: stats } = useTransactionStats(filters, dashboardId);

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createManyTransactions = useCreateManyTransactions();
  const updateInstallmentGroup = useUpdateInstallmentGroup();

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
      // Ensure dashboardId is included
      const transactionData = { ...data, dashboardId };
      
      if (selectedTransaction) {
        // Check if this is an installment transaction with group and scope is not 'single'
        const groupId = (selectedTransaction as any).installmentGroupId;
        if (groupId && scope && scope !== 'single' && dashboardId) {
          await updateInstallmentGroup.mutateAsync({ 
            groupId, 
            data: transactionData, 
            dashboardId, 
            scope 
          });
          const count = scope === 'all' ? selectedTransaction.installmentTotal : 'pendentes';
          showSuccess(`${count} parcelas atualizadas com sucesso.`, { title: 'Atualizado!' });
        } else {
          await updateTransaction.mutateAsync({ id: selectedTransaction.id, data: transactionData });
          showSuccess('Transação atualizada com sucesso.', { title: 'Atualizado!' });
        }
      } else {
        await createTransaction.mutateAsync(transactionData as any);
        showSuccess('Transação criada com sucesso.', { title: 'Criado!' });
      }
      setShowTransactionForm(false);
    } catch (error) {
      showErrorWithRetry(error, () => handleSaveTransaction(data, scope));
    }
  };

  const handleThirdPartyUpdate = async (id: string, data: { isThirdParty: boolean; thirdPartyName?: string; thirdPartyDescription?: string }) => {
    try {
      await updateTransaction.mutateAsync({ id, data });
      showSuccess(data.isThirdParty ? 'Terceiro adicionado.' : 'Terceiro removido.', { title: 'Atualizado!' });
    } catch (error) {
      showErrorWithRetry(error, () => handleThirdPartyUpdate(id, data));
    }
  };

  const handleImport = async (importedTransactions: Partial<Transaction>[]) => {
    try {
      const result = await createManyTransactions.mutateAsync(importedTransactions as any);
      showSuccess(`${result.count} transações importadas com sucesso.`, { title: 'Importado!', timer: 3000 });
    } catch (error) {
      showErrorWithRetry(error, () => handleImport(importedTransactions));
    }
  };

  const handleExport = useCallback(() => {
    if (!transactions.length) {
      showWarning('Não há transações para exportar.', { title: 'Sem dados' });
      return;
    }

    const header = 'Data;Tipo;Fluxo;Categoria;Subcategoria;Descricao;Valor;MetodoPag;ParcelasTotal;ParcelaAtual;StatusParcela;Fonte;Observacao\n';
    const rows = transactions.map(t => {
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
    link.download = `financas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess('Arquivo CSV baixado com sucesso.', { title: 'Exportado!' });
  }, [transactions]);

  const hasData = transactions.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <PageHeader
          title="Visão Geral"
          breadcrumbs={[
            { label: 'Dashboards', to: '/dashboards' },
            { label: 'Financeiro' }
          ]}
        />
        <DashboardSkeleton />
      </Container>
    );
  }

  // Empty state - show only import section
  if (!hasData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <PageHeader
          title="Visão Geral"
          breadcrumbs={[
            { label: 'Dashboards', to: '/dashboards' },
            { label: 'Financeiro' }
          ]}
        />
        
        {/* Import e Entrada Rápida */}
        <Box id="upload-section" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
          <UnifiedImport onImportCSV={handleImport} />
          <QuickEntryForm onSave={handleSaveTransaction} onRefetch={refetch} />
        </Box>

        {/* Transaction Form */}
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

  // Normal state with data
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Visão Geral"
        breadcrumbs={[
          { label: 'Dashboards', to: '/dashboards' },
          { label: 'Financeiro' }
        ]}
      />

      {/* Import e Entrada Rápida */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mb: 4 }}>
        <UnifiedImport onImportCSV={handleImport} />
        <QuickEntryForm onSave={handleSaveTransaction} onRefetch={refetch} />
      </Box>

      {/* Métricas */}
      <MetricsCards stats={stats} transactions={transactions} isLoading={isLoading} />

      {/* Filtros */}
      <Box id="filters-section" sx={{ mb: 4, scrollMarginTop: 80 }}>
        <FiltersCard filters={filters} onFiltersChange={setFilters} transactions={transactions} />
      </Box>

      {/* Gráficos */}
      <ChartsSection transactions={transactions} />

      {/* Tabela */}
      <TransactionsTable
        transactions={transactions}
        isLoading={isLoading}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        onNew={handleNewTransaction}
        onExport={handleExport}
        onThirdPartyUpdate={handleThirdPartyUpdate}
      />

      {/* Modais */}
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
