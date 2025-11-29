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
import { showSuccess, showError } from '../utils/notifications';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  dashboardId: string;
  dashboardTitle: string;
}

export default function ShareDialog({ open, onClose, dashboardId, dashboardTitle }: ShareDialogProps) {
  const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [isOneTime, setIsOneTime] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const expiresAt = expiresInDays ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000).toISOString() : undefined;
      const result = await dashboardService.createInvite(dashboardId, { role, expiresAt, isOneTime });
      setShareLink(result.shareLink);
    } catch (error: any) {
      showError(error, { title: 'Erro', text: 'Erro ao gerar link de compartilhamento' });
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
    setRole('VIEWER');
    setExpiresInDays('');
    setIsOneTime(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Compartilhar Dashboard</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          {dashboardTitle}
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Permissão</InputLabel>
            <Select value={role} onChange={(e) => setRole(e.target.value as 'VIEWER' | 'EDITOR')} label="Permissão">
              <MenuItem value="VIEWER">Visualizador</MenuItem>
              <MenuItem value="EDITOR">Editor</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Expira em (dias)"
            type="number"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            helperText="Deixe vazio para não expirar"
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Tipo de convite</InputLabel>
            <Select value={isOneTime ? 'one-time' : 'multiple'} onChange={(e) => setIsOneTime(e.target.value === 'one-time')} label="Tipo de convite">
              <MenuItem value="multiple">Múltiplos usos</MenuItem>
              <MenuItem value="one-time">Uso único</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleGenerate} disabled={loading} fullWidth>
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
