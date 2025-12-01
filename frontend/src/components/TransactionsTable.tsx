import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Box,
  Tooltip,
  Stack,
  Typography,
  Divider,
  TablePagination,
  useTheme,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  FileDownload,
  Person,
} from '@mui/icons-material';
import { useResponsive } from '../hooks/useResponsive';
import LoadingSkeleton from './LoadingSkeleton';
import type { Transaction } from '../types';
import { fadeIn, hoverLift } from '../utils/animations';

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onExport: () => void;
}

export default function TransactionsTable({
  transactions,
  isLoading,
  onEdit,
  onDelete,
  onNew,
  onExport
}: TransactionsTableProps) {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('pt-BR');

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return <LoadingSkeleton variant="table" count={5} />;
  }

  const paginatedTransactions = transactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Mobile View - Cards
  if (isMobile) {
    return (
      <Card sx={{ ...fadeIn }}>
        <CardHeader
          title="Transações"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          action={
            <Stack direction="row" spacing={1}>
              <Tooltip title="Exportar">
                <IconButton onClick={onExport} size="small">
                  <FileDownload />
                </IconButton>
              </Tooltip>
              <Tooltip title="Nova">
                <IconButton onClick={onNew} color="primary" size="small">
                  <Add />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />
        <CardContent>
          {paginatedTransactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhuma transação encontrada
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {paginatedTransactions.map((transaction, index) => (
                <Card
                  key={transaction.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    ...hoverLift,
                    animation: `fadeIn ${300 + index * 50}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    '@keyframes fadeIn': {
                      from: { opacity: 0, transform: 'translateY(10px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {transaction.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(transaction.date)}
                        </Typography>
                      </Box>
                      <Chip
                        label={transaction.entryType}
                        size="small"
                        color={transaction.entryType === 'Receita' ? 'success' : 'error'}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.category}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: transaction.entryType === 'Receita' ? 'success.main' : 'error.main',
                        }}
                      >
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </Box>

                    {transaction.isThirdParty && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {transaction.thirdPartyName || 'Terceiro'}
                        </Typography>
                      </Box>
                    )}

                    {transaction.installmentTotal > 0 && (
                      <Chip
                        label={`Parcela ${transaction.installmentNumber}/${transaction.installmentTotal}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </CardContent>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, gap: 1 }}>
                    <IconButton size="small" onClick={() => onEdit(transaction)} color="primary">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(transaction.id)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Stack>
          )}

          <TablePagination
            component="div"
            count={transactions.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{ mt: 2 }}
          />
        </CardContent>
      </Card>
    );
  }

  // Desktop View - Table
  return (
    <Card sx={{ ...fadeIn }}>
      <CardHeader
        title="Transações Detalhadas"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<FileDownload />} onClick={onExport} size="small" variant="outlined">
              Exportar
            </Button>
            <Button startIcon={<Add />} onClick={onNew} variant="contained">
              Nova
            </Button>
          </Box>
        }
      />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Parcela</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma transação encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.entryType}
                        size="small"
                        color={transaction.entryType === 'Receita' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {transaction.description}
                        {transaction.isThirdParty && (
                          <Tooltip title={`Compra de Terceiro: ${transaction.thirdPartyName || 'N/A'}`}>
                            <Person fontSize="small" color="action" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 600,
                        color: transaction.entryType === 'Receita' ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {transaction.installmentTotal > 0
                        ? `${transaction.installmentNumber}/${transaction.installmentTotal}`
                        : '—'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => onEdit(transaction)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => onDelete(transaction.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={transactions.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </CardContent>
    </Card>
  );
}
