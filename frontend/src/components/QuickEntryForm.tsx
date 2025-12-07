import { Card, CardHeader, CardContent, TextField, Button, MenuItem, Grid, InputAdornment } from '@mui/material';
import FlashOn from '@mui/icons-material/FlashOn';
import { useForm, Controller } from 'react-hook-form';
import { showErrorWithRetry } from '../utils/notifications';

interface QuickEntryFormProps {
  onSave: (data: any) => Promise<void>;
  onRefetch: () => void;
}

interface QuickEntryData {
  entryType: 'Receita' | 'Despesa';
  flowType: 'Fixa' | 'Variável';
  description: string;
  amount: string;
  date: string;
}

export default function QuickEntryForm({ onSave, onRefetch }: QuickEntryFormProps) {
  const { control, handleSubmit, reset } = useForm<QuickEntryData>({
    defaultValues: {
      entryType: 'Receita',
      flowType: 'Fixa',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    }
  });

  const onSubmit = async (data: QuickEntryData) => {
    try {
      await onSave({
        ...data,
        amount: parseFloat(data.amount),
        category: data.entryType === 'Receita' ? 'Entrada rápida' : 'Gasto rápido',
        installmentTotal: 1,
        installmentNumber: 1,
        installmentStatus: 'N/A',
        isTemporary: true,
      });
      reset({
        entryType: data.entryType,
        flowType: data.flowType,
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      });
      onRefetch();
    } catch (error) {
      showErrorWithRetry(error, () => onSubmit(data));
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<FlashOn color="primary" />}
        title="Entrada Rápida"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Controller
                name="entryType"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Tipo" size="small">
                    <MenuItem value="Receita">Receita</MenuItem>
                    <MenuItem value="Despesa">Despesa</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="flowType"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Fluxo" size="small">
                    <MenuItem value="Fixa">Fixa</MenuItem>
                    <MenuItem value="Variável">Variável</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Descrição é obrigatória' }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Descrição"
                    size="small"
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="amount"
                control={control}
                rules={{ required: 'Valor obrigatório', min: { value: 0.01, message: '> 0' } }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Valor"
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="date"
                control={control}
                rules={{ required: 'Data obrigatória' }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label="Data"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth>
                Registrar
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}
