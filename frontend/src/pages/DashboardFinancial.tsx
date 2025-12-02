import { useState, useCallback } from 'react';
import {
  Box,
  Container,
  useTheme,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import type { Transaction, TransactionFilters } from '../types';
import MetricsCards from '../components/MetricsCards';
import FiltersCard from '../components/FiltersCard';
import ChartsSection from '../components/ChartsSection';
import TransactionsTable from '../components/TransactionsTable';
import TransactionForm from '../components/TransactionForm';
import QuickEntryForm from '../components/QuickEntryForm';
import FileUpload from '../components/FileUpload';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { DashboardSkeleton } from '../components/Skeletons';
import { showSuccess, showError, showConfirm, showWarning } from '../utils/notifications';
import {
  useTransactions,
  useTransactionStats,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCreateManyTransactions
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
        await deleteTransaction.mutateAsync(id);
        showSuccess('Transação removida com sucesso.', { title: 'Excluído!' });
      } catch (error) {
        showError(error, { title: 'Erro', text: 'Não foi possível excluir a transação.' });
      }
    }
  };

  const handleSaveTransaction = async (data: Partial<Transaction>) => {
    try {
      if (selectedTransaction) {
        await updateTransaction.mutateAsync({ id: selectedTransaction.id, data });
        showSuccess('Transação atualizada com sucesso.', { title: 'Atualizado!' });
      } else {
        await createTransaction.mutateAsync(data as any);
        showSuccess('Transação criada com sucesso.', { title: 'Criado!' });
      }
      setShowTransactionForm(false);
    } catch (error) {
      showError(error, { title: 'Erro', text: 'Não foi possível salvar a transação.' });
    }
  };

  const handleImport = async (importedTransactions: Partial<Transaction>[]) => {
    try {
      const result = await createManyTransactions.mutateAsync(importedTransactions as any);
      showSuccess(`${result.count} transações importadas com sucesso.`, { title: 'Importado!', timer: 3000 });
    } catch (error) {
      showError(error, { title: 'Erro', text: 'Não foi possível importar as transações.' });
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

  // Empty state
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
        <EmptyState
          icon={<ReceiptLongIcon sx={{ fontSize: '80px' }} />}
          title="Nenhuma transação ainda"
          description="Comece adicionando sua primeira transação manualmente ou importe dados de um arquivo CSV/Excel para começar a visualizar seus gráficos e relatórios financeiros."
          actions={[
            {
              label: 'Adicionar Transação',
              onClick: handleNewTransaction,
              variant: 'contained',
              startIcon: <AddIcon />,
            },
            {
              label: 'Importar Dados',
              onClick: () => {
                // Scroll to import section or open import dialog
                const uploadSection = document.querySelector('#upload-section');
                uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              },
              variant: 'outlined',
              startIcon: <UploadFileIcon />,
            },
          ]}
        />
        
        {/* Show upload and quick entry even when empty */}
        <Box id="upload-section" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 3, mt: 4 }}>
          <FileUpload onImport={handleImport} />
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

      {/* Upload e Entrada Rápida */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        <FileUpload onImport={handleImport} />
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
