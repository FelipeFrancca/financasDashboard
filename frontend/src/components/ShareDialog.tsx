import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Alert,
} from '@mui/material';
import ContentCopy from '@mui/icons-material/ContentCopy';
import { dashboardService } from '../services/api';
import { showSuccess, showErrorWithRetry } from '../utils/notifications';
import { useForm, Controller } from 'react-hook-form';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  dashboardId: string;
  dashboardTitle: string;
}

interface ShareFormData {
  role: 'VIEWER' | 'EDITOR';
  expiresInDays: string;
  isOneTime: string; // 'multiple' | 'one-time'
}

export default function ShareDialog({ open, onClose, dashboardId, dashboardTitle }: ShareDialogProps) {
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset } = useForm<ShareFormData>({
    defaultValues: {
      role: 'VIEWER',
      expiresInDays: '',
      isOneTime: 'multiple',
    }
  });

  const handleGenerate = async (data: ShareFormData) => {
    try {
      setLoading(true);
      const expiresAt = data.expiresInDays ? new Date(Date.now() + parseInt(data.expiresInDays) * 24 * 60 * 60 * 1000).toISOString() : undefined;
      const result = await dashboardService.createInvite(dashboardId, {
        role: data.role,
        expiresAt,
        isOneTime: data.isOneTime === 'one-time'
      });
      setShareLink(result.shareLink);
    } catch (error: any) {
      showErrorWithRetry(error, () => handleGenerate(data));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    showSuccess('Link copiado para a área de transferência', { title: 'Copiado!', timer: 1500 });
  };

  const handleClose = () => {
    setShareLink('');
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Compartilhar Dashboard</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          {dashboardTitle}
        </Typography>

        <Box component="form" onSubmit={handleSubmit(handleGenerate)} sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Permissão</InputLabel>
                <Select {...field} label="Permissão">
                  <MenuItem value="VIEWER">Visualizador</MenuItem>
                  <MenuItem value="EDITOR">Editor</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="expiresInDays"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Expira em (dias)"
                type="number"
                helperText="Deixe vazio para não expirar"
                fullWidth
              />
            )}
          />

          <Controller
            name="isOneTime"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Tipo de convite</InputLabel>
                <Select {...field} label="Tipo de convite">
                  <MenuItem value="multiple">Múltiplos usos</MenuItem>
                  <MenuItem value="one-time">Uso único</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Button type="submit" variant="contained" disabled={loading} fullWidth>
            {shareLink ? 'Gerar Novo Link' : 'Gerar Link'}
          </Button>

          {shareLink && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 1 }}>
                Link gerado com sucesso!
              </Alert>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField value={shareLink} fullWidth InputProps={{ readOnly: true }} size="small" />
                <IconButton onClick={handleCopy} color="primary">
                  <ContentCopy />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
