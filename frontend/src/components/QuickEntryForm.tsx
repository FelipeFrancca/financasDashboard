import { Card, CardHeader, CardContent, TextField, Button, MenuItem, Grid } from '@mui/material';
import { FlashOn } from '@mui/icons-material';
import { useState } from 'react';
import Swal from 'sweetalert2';

interface QuickEntryFormProps {
  onSave: (data: any) => Promise<void>;
  onRefetch: () => void;
}

export default function QuickEntryForm({ onSave, onRefetch }: QuickEntryFormProps) {
  const [formData, setFormData] = useState({
    entryType: 'Receita',
    flowType: 'Fixa',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        category: formData.entryType === 'Receita' ? 'Entrada rápida' : 'Gasto rápido',
        installmentTotal: 0,
        installmentNumber: 0,
        installmentStatus: 'N/A',
        isTemporary: true,
      });
      setFormData({ ...formData, description: '', amount: '' });
      onRefetch();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível salvar' });
    }
  };

  return (
    <Card>
      <CardHeader avatar={<FlashOn />} title="Entrada Rápida" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
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
              <TextField fullWidth label="Descrição" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Valor" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="date" label="Data" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth>Registrar</Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}
