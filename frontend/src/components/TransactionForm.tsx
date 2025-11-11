import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid } from '@mui/material';
import { useState, useEffect } from 'react';
import type { Transaction } from '../types';

interface TransactionFormProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (data: Partial<Transaction>) => Promise<void>;
}

export default function TransactionForm({ open, transaction, onClose, onSave }: TransactionFormProps) {
  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    entryType: 'Receita',
    flowType: 'Fixa',
    category: '',
    subcategory: '',
    description: '',
    amount: '',
    paymentMethod: '',
    institution: '',
    cardBrand: '',
    installmentTotal: 0,
    installmentNumber: 0,
    installmentStatus: 'N/A',
    notes: '',
    isTemporary: false,
  });

  useEffect(() => {
    if (transaction) {
      setFormData({ ...transaction, date: new Date(transaction.date).toISOString().split('T')[0] });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ ...formData, amount: parseFloat(formData.amount) });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{transaction ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <TextField select fullWidth label="Tipo" value={formData.entryType} onChange={(e) => setFormData({ ...formData, entryType: e.target.value })}>
              <MenuItem value="Receita">Receita</MenuItem>
              <MenuItem value="Despesa">Despesa</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select fullWidth label="Fluxo" value={formData.flowType} onChange={(e) => setFormData({ ...formData, flowType: e.target.value })}>
              <MenuItem value="Fixa">Fixa</MenuItem>
              <MenuItem value="Variável">Variável</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Categoria" required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Descrição" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Valor" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="date" label="Data" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
