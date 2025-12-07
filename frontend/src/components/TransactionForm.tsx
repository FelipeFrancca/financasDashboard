import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  InputAdornment,
  FormControlLabel,
  Switch,
  Collapse,
  Box,
  Typography
} from '@mui/material';
import Person from '@mui/icons-material/Person';
import { useForm, Controller } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useCategories } from '../hooks/api/useCategories';
import TransactionItemsEditor from './TransactionItemsEditor';
import type { Transaction, TransactionItem } from '../types';

interface TransactionFormProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (data: Partial<Transaction>) => Promise<void>;
}

interface TransactionFormData {
  date: string;
  entryType: 'Receita' | 'Despesa';
  flowType: 'Fixa' | 'Variável';
  category: string;
  subcategory: string;
  description: string;
  amount: number | string;
  paymentMethod: string;
  institution: string;
  cardBrand: string;
  installmentTotal: number;
  installmentNumber: number;
  installmentStatus: 'N/A' | 'Paga' | 'Pendente';
  notes: string;
  isTemporary: boolean;
  isThirdParty: boolean;
  thirdPartyName: string;
  thirdPartyDescription: string;
}

const defaultValues: TransactionFormData = {
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
  installmentTotal: 1,
  installmentNumber: 1,
  installmentStatus: 'N/A',
  notes: '',
  isTemporary: false,
  isThirdParty: false,
  thirdPartyName: '',
  thirdPartyDescription: '',
};

export default function TransactionForm({ open, transaction, onClose, onSave }: TransactionFormProps) {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const { data: categories = [] } = useCategories(dashboardId || '');

  const { control, handleSubmit, reset, watch, setValue } = useForm<TransactionFormData>({
    defaultValues
  });

  const entryType = watch('entryType');
  const isThirdParty = watch('isThirdParty');
  
  // State for editable items
  const [editableItems, setEditableItems] = useState<TransactionItem[]>([]);

  // Filter categories based on entry type
  const filteredCategories = categories.filter((cat: any) => {
    const type = cat.type === 'INCOME' ? 'Receita' : 'Despesa';
    return type === entryType;
  });

  useEffect(() => {
    if (open) {
      if (transaction) {
        // Sanitize null values to empty strings to prevent React controlled input warnings
        reset({
          date: new Date(transaction.date).toISOString().split('T')[0],
          entryType: transaction.entryType as 'Receita' | 'Despesa',
          flowType: transaction.flowType as 'Fixa' | 'Variável',
          category: transaction.category || '',
          subcategory: transaction.subcategory || '',
          description: transaction.description || '',
          amount: transaction.amount,
          paymentMethod: transaction.paymentMethod || '',
          institution: transaction.institution || '',
          cardBrand: transaction.cardBrand || '',
          installmentTotal: transaction.installmentTotal || 1,
          installmentNumber: transaction.installmentNumber || 1,
          installmentStatus: transaction.installmentStatus as 'N/A' | 'Paga' | 'Pendente' || 'N/A',
          notes: transaction.notes || '',
          isTemporary: transaction.isTemporary || false,
          isThirdParty: transaction.isThirdParty || false,
          thirdPartyName: transaction.thirdPartyName || '',
          thirdPartyDescription: transaction.thirdPartyDescription || '',
        });
        // Initialize editable items
        setEditableItems(transaction.items?.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })) || []);
      } else {
        reset(defaultValues);
        setEditableItems([]);
      }
    }
  }, [open, transaction, reset]);

  const onSubmit = async (data: TransactionFormData) => {
    await onSave({
      ...data,
      amount: Number(data.amount),
      installmentTotal: Number(data.installmentTotal),
      installmentNumber: Number(data.installmentNumber),
      // Include edited items
      items: editableItems.length > 0 ? editableItems : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{transaction ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Linha 1: Tipo e Fluxo */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="entryType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Tipo"
                    onChange={(e) => {
                      field.onChange(e);
                      setValue('category', ''); // Reset category on type change
                    }}
                  >
                    <MenuItem value="Receita">Receita</MenuItem>
                    <MenuItem value="Despesa">Despesa</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="flowType"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Fluxo">
                    <MenuItem value="Fixa">Fixa</MenuItem>
                    <MenuItem value="Variável">Variável</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            {/* Linha 2: Descrição */}
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
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Grid>

            {/* Linha 3: Valor e Data */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="amount"
                control={control}
                rules={{ required: 'Valor é obrigatório', min: { value: 0.01, message: 'Valor deve ser maior que zero' } }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Valor"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="date"
                control={control}
                rules={{ required: 'Data é obrigatória' }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label="Data"
                    InputLabelProps={{ shrink: true }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Grid>

            {/* Linha 4: Categoria e Subcategoria */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                rules={{ required: 'Categoria é obrigatória' }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Categoria"
                    error={!!error}
                    helperText={error?.message}
                  >
                    {filteredCategories.map((cat: any) => (
                      <MenuItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))}
                    {filteredCategories.length === 0 && (
                      <MenuItem disabled>
                        Nenhuma categoria de {entryType.toLowerCase()} encontrada
                      </MenuItem>
                    )}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="subcategory"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Subcategoria (Opcional)" />
                )}
              />
            </Grid>

            {/* Linha 5: Pagamento e Instituição */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Método de Pagamento">
                    <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                    <MenuItem value="Pix">Pix</MenuItem>
                    <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
                    <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
                    <MenuItem value="Transferência">Transferência</MenuItem>
                    <MenuItem value="Boleto">Boleto</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="institution"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Instituição / Banco" />
                )}
              />
            </Grid>

            {/* Linha 6: Parcelamento (Condicional) */}
            {watch('paymentMethod') === 'Cartão de Crédito' && (
              <>
                <Grid item xs={6}>
                  <Controller
                    name="installmentNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} type="number" fullWidth label="Parcela Atual" />
                    )}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller
                    name="installmentTotal"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} type="number" fullWidth label="Total de Parcelas" />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Linha 7: Notas */}
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth multiline rows={3} label="Notas (Opcional)" />
                )}
              />
            </Grid>

            {/* Linha 8: Despesa de Terceiro */}
            <Grid item xs={12}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                <FormControlLabel
                  control={
                    <Controller
                      name="isThirdParty"
                      control={control}
                      render={({ field }) => (
                        <Switch {...field} checked={field.value} />
                      )}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ color: 'primary.main' }} />
                      <Typography variant="body1">
                        Despesa de Terceiro
                      </Typography>
                    </Box>
                  }
                />
                <Collapse in={isThirdParty}>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="thirdPartyName"
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label="Nome do Terceiro" />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="thirdPartyDescription"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Anotação"
                            placeholder="Ex: Empréstimo para João"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Collapse>
              </Box>
            </Grid>

            {/* Itens da transação (editável) */}
            <Grid item xs={12}>
              <TransactionItemsEditor 
                items={editableItems} 
                onChange={setEditableItems}
                defaultExpanded={editableItems.length > 0}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">Salvar</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
