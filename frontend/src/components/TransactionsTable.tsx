import { Card, CardHeader, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Chip, Box, CircularProgress } from '@mui/material';
import { Edit, Delete, Add, FileDownload } from '@mui/icons-material';
import type { Transaction } from '../types';

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onExport: () => void;
}

export default function TransactionsTable({ transactions, isLoading, onEdit, onDelete, onNew, onExport }: TransactionsTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('pt-BR');

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Card>
      <CardHeader
        title="Transações Detalhadas"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<FileDownload />} onClick={onExport} size="small" variant="outlined">Exportar</Button>
            <Button startIcon={<Add />} onClick={onNew} variant="contained">Nova</Button>
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
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.entryType}
                      size="small"
                      color={transaction.entryType === 'Receita' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: transaction.entryType === 'Receita' ? 'success.main' : 'error.main' }}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {transaction.installmentTotal > 0
                      ? `${transaction.installmentNumber}/${transaction.installmentTotal}`
                      : '—'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => onEdit(transaction)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(transaction.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
