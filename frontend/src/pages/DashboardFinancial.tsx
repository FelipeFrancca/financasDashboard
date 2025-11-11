import { useState, useCallback } from 'react';
import {
  Box,
  Container,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { transactionService } from '../services/api';
import type { Transaction, TransactionFilters } from '../types';
import MetricsCards from '../components/MetricsCards';
import FiltersCard from '../components/FiltersCard';
import ChartsSection from '../components/ChartsSection';
import TransactionsTable from '../components/TransactionsTable';
import TransactionForm from '../components/TransactionForm';
import QuickEntryForm from '../components/QuickEntryForm';
import FileUpload from '../components/FileUpload';

interface DashboardFinancialProps {
  dashboardId?: string;
}

export default function DashboardFinancial({ dashboardId }: DashboardFinancialProps) {
  const theme = useTheme();
  
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Query para buscar transações
  const { data: transactions = [], refetch, isLoading } = useQuery({
    queryKey: ['transactions', filters, dashboardId],
    queryFn: () => transactionService.getAll(filters),
  });

  // Query para estatísticas
  const { data: stats } = useQuery({
    queryKey: ['stats', filters, dashboardId],
    queryFn: () => transactionService.getStats(filters),
  });

  const handleNewTransaction = () => {
    setSelectedTransaction(null);
    setShowTransactionForm(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    const result = await Swal.fire({
      title: 'Confirmar exclusão?',
      text: 'Esta ação não poderá ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: theme.palette.error.main,
      cancelButtonColor: theme.palette.grey[500],
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await transactionService.delete(id);
        refetch();
        Swal.fire({
          icon: 'success',
          title: 'Excluído!',
          text: 'Transação removida com sucesso.',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível excluir a transação.',
        });
      }
    }
  };

  const handleSaveTransaction = async (data: Partial<Transaction>) => {
    try {
      if (selectedTransaction) {
        await transactionService.update(selectedTransaction.id, data);
        Swal.fire({
          icon: 'success',
          title: 'Atualizado!',
          text: 'Transação atualizada com sucesso.',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await transactionService.create(data as any);
        Swal.fire({
          icon: 'success',
          title: 'Criado!',
          text: 'Transação criada com sucesso.',
          timer: 2000,
          showConfirmButton: false,
        });
      }
      refetch();
      setShowTransactionForm(false);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível salvar a transação.',
      });
    }
  };

  const handleImport = async (importedTransactions: Partial<Transaction>[]) => {
    try {
      const result = await transactionService.createMany(importedTransactions as any);
      refetch();
      Swal.fire({
        icon: 'success',
        title: 'Importado!',
        text: `${result.count} transações importadas com sucesso.`,
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível importar as transações.',
      });
    }
  };

  const handleExport = useCallback(() => {
    if (!transactions.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Sem dados',
        text: 'Não há transações para exportar.',
      });
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

    Swal.fire({
      icon: 'success',
      title: 'Exportado!',
      text: 'Arquivo CSV baixado com sucesso.',
      timer: 2000,
      showConfirmButton: false,
    });
  }, [transactions]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Upload e Entrada Rápida */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        <FileUpload onImport={handleImport} />
        <QuickEntryForm onSave={handleSaveTransaction} onRefetch={refetch} />
      </Box>

      {/* Métricas */}
      <MetricsCards stats={stats} transactions={transactions} />

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
