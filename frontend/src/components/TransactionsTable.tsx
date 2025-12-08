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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  FileDownload,
  Person,
  KeyboardArrowDown,
  KeyboardArrowUp,
  PersonAddOutlined,
  PersonRemove,
  DeleteSweep,
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
  onExport: (selectedIds?: string[]) => void;
  canEdit?: boolean;
  onThirdPartyUpdate?: (id: string, data: { isThirdParty: boolean; thirdPartyName?: string; thirdPartyDescription?: string }) => Promise<void>;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onDeleteSelected?: () => void;
}

export default function TransactionsTable({
  transactions,
  isLoading,
  onEdit,
  onDelete,
  onNew,
  onExport,
  canEdit = true,
  onThirdPartyUpdate,
  selectedIds = new Set(),
  onSelectionChange,
  onDeleteSelected,
}: TransactionsTableProps) {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  // Third party dialog state
  const [thirdPartyDialogOpen, setThirdPartyDialogOpen] = useState(false);
  const [selectedTransactionForThirdParty, setSelectedTransactionForThirdParty] = useState<Transaction | null>(null);
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [thirdPartyDescription, setThirdPartyDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection handlers
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.size === transactions.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(transactions.map(t => t.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  const handleExportClick = () => {
    if (selectedIds.size > 0) {
      onExport(Array.from(selectedIds));
    } else {
      onExport();
    }
  };

  const isAllSelected = transactions.length > 0 && selectedIds.size === transactions.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < transactions.length;

  const toggleRow = (id: string) => {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('pt-BR');

  // Third party handlers
  const handleThirdPartyClick = (transaction: Transaction) => {
    setSelectedTransactionForThirdParty(transaction);
    setThirdPartyName(transaction.thirdPartyName || '');
    setThirdPartyDescription(transaction.thirdPartyDescription || '');
    setThirdPartyDialogOpen(true);
  };

  const handleThirdPartyClose = () => {
    setThirdPartyDialogOpen(false);
    setSelectedTransactionForThirdParty(null);
    setThirdPartyName('');
    setThirdPartyDescription('');
  };

  const handleThirdPartySave = async () => {
    if (!selectedTransactionForThirdParty || !onThirdPartyUpdate) return;

    setIsSubmitting(true);
    try {
      await onThirdPartyUpdate(selectedTransactionForThirdParty.id, {
        isThirdParty: true,
        thirdPartyName: thirdPartyName.trim() || undefined,
        thirdPartyDescription: thirdPartyDescription.trim() || undefined,
      });
      handleThirdPartyClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThirdPartyRemove = async () => {
    if (!selectedTransactionForThirdParty || !onThirdPartyUpdate) return;

    setIsSubmitting(true);
    try {
      await onThirdPartyUpdate(selectedTransactionForThirdParty.id, {
        isThirdParty: false,
        thirdPartyName: undefined,
        thirdPartyDescription: undefined,
      });
      handleThirdPartyClose();
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Stack direction="row" spacing={1} alignItems="center">
              {selectedIds.size > 0 && (
                <Chip
                  label={`${selectedIds.size} selecionadas`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {selectedIds.size > 0 && canEdit && onDeleteSelected && (
                <Tooltip title={`Excluir ${selectedIds.size} selecionadas`}>
                  <IconButton onClick={onDeleteSelected} color="error" size="small">
                    <DeleteSweep />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={selectedIds.size > 0 ? `Exportar ${selectedIds.size} selecionadas` : "Exportar todas"}>
                <IconButton onClick={handleExportClick} size="small">
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
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Nenhuma transação para o período selecionado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selecione outro mês ou adicione uma nova transação
              </Typography>
              {canEdit && (
                <Button variant="contained" startIcon={<Add />} onClick={onNew} size="small">
                  Adicionar Transação
                </Button>
              )}
            </Box>
          ) : (
            <Stack spacing={2}>
              {paginatedTransactions.map((transaction, index) => (
                <Card
                  key={transaction.id}
                  sx={{
                    border: 1,
                    borderColor: selectedIds.has(transaction.id) ? 'primary.main' : 'divider',
                    bgcolor: selectedIds.has(transaction.id) ? 'action.selected' : 'background.paper',
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
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        {onSelectionChange && (
                          <Checkbox
                            checked={selectedIds.has(transaction.id)}
                            onChange={() => handleSelectOne(transaction.id)}
                            size="small"
                            sx={{ mt: -0.5, ml: -1 }}
                          />
                        )}
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {transaction.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(transaction.date)}
                          </Typography>
                        </Box>
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
                          onChange={() => { }}
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
                        {onThirdPartyUpdate && (
                          <IconButton
                            size="small"
                            onClick={() => handleThirdPartyClick(transaction)}
                            color={transaction.isThirdParty ? "primary" : "default"}
                          >
                            {transaction.isThirdParty ? <Person fontSize="small" /> : <PersonAddOutlined fontSize="small" />}
                          </IconButton>
                        )}
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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {selectedIds.size > 0 && (
              <Chip
                label={`${selectedIds.size} selecionadas`}
                size="small"
                color="primary"
                variant="outlined"
                onDelete={() => onSelectionChange?.(new Set())}
              />
            )}
            {selectedIds.size > 0 && canEdit && onDeleteSelected && (
              <Button
                startIcon={<DeleteSweep />}
                onClick={onDeleteSelected}
                size="small"
                variant="outlined"
                color="error"
              >
                Excluir ({selectedIds.size})
              </Button>
            )}
            <Button
              startIcon={<FileDownload />}
              onClick={handleExportClick}
              size="small"
              variant="outlined"
            >
              {selectedIds.size > 0 ? `Exportar (${selectedIds.size})` : 'Exportar'}
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
                {onSelectionChange && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={isIndeterminate}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      inputProps={{ 'aria-label': 'selecionar todas' }}
                    />
                  </TableCell>
                )}
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
                  <TableCell colSpan={onSelectionChange ? 10 : 9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Nenhuma transação para o período selecionado
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Selecione outro mês ou adicione uma nova transação
                    </Typography>
                    {canEdit && (
                      <Button variant="contained" startIcon={<Add />} onClick={onNew} size="small">
                        Adicionar Transação
                      </Button>
                    )}
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
                        backgroundColor: selectedIds.has(transaction.id)
                          ? theme.palette.action.selected
                          : openRows[transaction.id]
                            ? theme.palette.action.hover
                            : 'inherit',
                      }}
                      onClick={() => toggleRow(transaction.id)}
                    >
                      {onSelectionChange && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.has(transaction.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectOne(transaction.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            inputProps={{ 'aria-label': `selecionar ${transaction.description}` }}
                          />
                        </TableCell>
                      )}
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
                            {onThirdPartyUpdate && (
                              <Tooltip title={transaction.isThirdParty ? `Terceiro: ${transaction.thirdPartyName || 'Sem nome'}` : "Marcar como terceiro"}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); handleThirdPartyClick(transaction); }}
                                  color={transaction.isThirdParty ? "primary" : "default"}
                                >
                                  {transaction.isThirdParty ? <Person fontSize="small" /> : <PersonAddOutlined fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            )}
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
                                onChange={() => { }}
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

      {/* Third Party Dialog */}
      <Dialog open={thirdPartyDialogOpen} onClose={handleThirdPartyClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          {selectedTransactionForThirdParty?.isThirdParty ? 'Editar Participação de Terceiro' : 'Adicionar Participação de Terceiro'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Transação: {selectedTransactionForThirdParty?.description}
          </Typography>
          <TextField
            fullWidth
            label="Nome do Terceiro"
            value={thirdPartyName}
            onChange={(e) => setThirdPartyName(e.target.value)}
            placeholder="Ex: João, Maria..."
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Descrição (opcional)"
            value={thirdPartyDescription}
            onChange={(e) => setThirdPartyDescription(e.target.value)}
            placeholder="Ex: Compra dividida, empréstimo..."
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          {selectedTransactionForThirdParty?.isThirdParty && (
            <Button
              onClick={handleThirdPartyRemove}
              color="error"
              disabled={isSubmitting}
              startIcon={<PersonRemove />}
            >
              Remover
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleThirdPartyClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleThirdPartySave}
            variant="contained"
            disabled={isSubmitting}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
