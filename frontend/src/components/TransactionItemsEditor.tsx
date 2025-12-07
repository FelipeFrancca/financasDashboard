import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Button,
  Collapse,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Delete,
  Add,
  Receipt,
  Edit,
  Check,
  Close,
} from '@mui/icons-material';
import type { TransactionItem } from '../types';

interface EditableTransactionItem extends Omit<TransactionItem, 'id'> {
  id?: string;
  isEditing?: boolean;
}

interface TransactionItemsEditorProps {
  items: EditableTransactionItem[];
  onChange: (items: EditableTransactionItem[]) => void;
  readOnly?: boolean;
  defaultExpanded?: boolean;
}

export default function TransactionItemsEditor({
  items,
  onChange,
  readOnly = false,
  defaultExpanded = true,
}: TransactionItemsEditorProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<EditableTransactionItem | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalFromItems = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...items[index] });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingItem(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingItem) {
      const newItems = [...items];
      newItems[editingIndex] = editingItem;
      onChange(newItems);
      setEditingIndex(null);
      setEditingItem(null);
    }
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleAddItem = () => {
    const newItem: EditableTransactionItem = {
      description: 'Novo item',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    onChange([...items, newItem]);
    // Start editing the new item
    setEditingIndex(items.length);
    setEditingItem(newItem);
  };

  const handleEditFieldChange = (field: keyof EditableTransactionItem, value: string | number) => {
    if (!editingItem) return;
    
    const updated = { ...editingItem, [field]: value };
    
    // Auto-calculate totalPrice when quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) : (editingItem.quantity || 1);
      const price = field === 'unitPrice' ? Number(value) : (editingItem.unitPrice || 0);
      updated.totalPrice = qty * price;
    }
    
    setEditingItem(updated);
  };

  if (items.length === 0 && readOnly) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          p: 1,
          borderRadius: 1,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Receipt sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          Itens da Compra
        </Typography>
        <Chip
          size="small"
          label={`${items.length} ${items.length === 1 ? 'item' : 'itens'}`}
          color="primary"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: 80 }}>Qtd.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, width: 120 }}>Preço Unit.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, width: 120 }}>Total</TableCell>
                {!readOnly && <TableCell align="center" sx={{ width: 100 }}>Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id || index} hover>
                  {editingIndex === index && editingItem ? (
                    // Editing mode
                    <>
                      <TableCell>
                        <TextField
                          value={editingItem.description}
                          onChange={(e) => handleEditFieldChange('description', e.target.value)}
                          size="small"
                          fullWidth
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editingItem.quantity || 1}
                          onChange={(e) => handleEditFieldChange('quantity', parseFloat(e.target.value) || 1)}
                          size="small"
                          type="number"
                          inputProps={{ min: 1, step: 1 }}
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editingItem.unitPrice || 0}
                          onChange={(e) => handleEditFieldChange('unitPrice', parseFloat(e.target.value) || 0)}
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editingItem.totalPrice}
                          onChange={(e) => handleEditFieldChange('totalPrice', parseFloat(e.target.value) || 0)}
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Salvar">
                          <IconButton size="small" color="success" onClick={handleSaveEdit}>
                            <Check fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton size="small" color="error" onClick={handleCancelEdit}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </>
                  ) : (
                    // View mode
                    <>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {item.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{item.quantity || 1}x</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(item.totalPrice)}
                        </Typography>
                      </TableCell>
                      {!readOnly && (
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleStartEdit(index)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remover">
                            <IconButton size="small" color="error" onClick={() => handleDelete(index)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </>
                  )}
                </TableRow>
              ))}
              
              {/* Total row */}
              <TableRow sx={{ bgcolor: 'action.selected' }}>
                <TableCell colSpan={readOnly ? 3 : 3} align="right">
                  <Typography variant="subtitle2">Total dos Itens:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" color="primary.main">
                    {formatCurrency(totalFromItems)}
                  </Typography>
                </TableCell>
                {!readOnly && <TableCell />}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add item button */}
        {!readOnly && (
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={handleAddItem}
              variant="outlined"
            >
              Adicionar Item
            </Button>
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
