import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { dashboardService } from '../services/api';
import { showSuccess } from '../utils/notifications';
import { useNavigate } from 'react-router-dom';

interface JoinDashboardDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function JoinDashboardDialog({ open, onClose }: JoinDashboardDialogProps) {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Por favor, insira o código do convite');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await dashboardService.acceptInvite(inviteCode.trim());
      showSuccess('Dashboard adicionado com sucesso!', {
        title: 'Sucesso!',
        text: `Você agora tem acesso ao dashboard "${result.dashboard.title}"`,
      });
      onClose();
      navigate(`/dashboard/${result.dashboard.id}`);
    } catch (error: any) {
      setError(
        error.response?.data?.message || 
        'Código inválido ou expirado. Verifique o código e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VpnKeyIcon color="primary" />
          <span>Entrar em Dashboard Compartilhado</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Digite o código de compartilhamento que você recebeu para acessar o dashboard.
        </Typography>

        <TextField
          label="Código do Convite"
          value={inviteCode}
          onChange={(e) => {
            setInviteCode(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder="ABC123XYZ"
          fullWidth
          autoFocus
          error={!!error}
          helperText={error || 'Cole o código que você recebeu'}
          disabled={loading}
          inputProps={{
            style: { textTransform: 'uppercase' },
            maxLength: 20,
          }}
        />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleJoin} 
          variant="contained" 
          disabled={!inviteCode.trim() || loading}
        >
          Entrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
