import React, { useState } from 'react';
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
  Collapse,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  FileDownload,
  Person,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { useResponsive } from '../hooks/useResponsive';
import LoadingSkeleton from './LoadingSkeleton';
import TransactionItemsEditor from './TransactionItemsEditor';
import type { Transaction } from '../types';
import { fadeIn, hoverLift } from '../utils/animations';

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onExport: () => void;
  canEdit?: boolean;
}

export default function TransactionsTable({
  transactions,
  isLoading,
  onEdit,
  onDelete,
  onNew,
  onExport,
  canEdit = true,
}: TransactionsTableProps) {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
              {canEdit && (
                <Tooltip title="Nova">
                  <IconButton onClick={onNew} color="primary" size="small">
                    <Add />
                  </IconButton>
                </Tooltip>
              )}
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
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {transaction.thirdPartyName || 'Terceiro'}
                          </Typography>
                        </Box>
                        {transaction.thirdPartyDescription && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 3, fontStyle: 'italic' }}>
                            {transaction.thirdPartyDescription}
                          </Typography>
                        )}
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

                    {transaction.items && transaction.items.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 1 }} />
                        <TransactionItemsEditor
                          items={transaction.items}
                          onChange={() => {}}
                          readOnly
                          defaultExpanded={false}
                        />
                      </Box>
                    )}
                  </CardContent>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, gap: 1 }}>
                    {canEdit && (
                      <>
                        <IconButton size="small" onClick={() => onEdit(transaction)} color="primary">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => onDelete(transaction.id)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </>
                    )}
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
            {canEdit && (
              <Button startIcon={<Add />} onClick={onNew} variant="contained">
                Nova
              </Button>
            )}
          </Box>
        }
      />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
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
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma transação encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <React.Fragment key={transaction.id}>
                    <TableRow
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                        backgroundColor: openRows[transaction.id] ? theme.palette.action.selected : 'inherit',
                      }}
                      onClick={() => toggleRow(transaction.id)}
                    >
                      <TableCell>
                        <IconButton
                          aria-label="expand row"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(transaction.id);
                          }}
                        >
                          {openRows[transaction.id] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
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
                            <Tooltip 
                              title={
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="body2" fontWeight="bold">Compra de Terceiro</Typography>
                                  <Typography variant="body2">{transaction.thirdPartyName || 'N/A'}</Typography>
                                  {transaction.thirdPartyDescription && (
                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                      "{transaction.thirdPartyDescription}"
                                    </Typography>
                                  )}
                                </Box>
                              }
                              arrow
                            >
                              <Person fontSize="small" color="action" />
                            </Tooltip>
                          )}
                          {transaction.items && transaction.items.length > 0 && (
                            <Chip 
                              label={`${transaction.items.length} itens`} 
                              size="small" 
                              variant="outlined" 
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                            />
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
                        {canEdit && (
                          <>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={openRows[transaction.id]} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            {transaction.items && transaction.items.length > 0 ? (
                              <TransactionItemsEditor
                                items={transaction.items}
                                onChange={() => {}}
                                readOnly
                                defaultExpanded={true}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                Nenhum item detalhado para esta transação.
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
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
