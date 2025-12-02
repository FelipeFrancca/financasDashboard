import { Box, Container, Typography, Paper } from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import JoinDashboardDialog from '../components/JoinDashboardDialog';
import { useNavigate } from 'react-router-dom';

export default function JoinDashboardPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboards');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <VpnKeyIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Entrar em Dashboard Compartilhado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Digite o código de compartilhamento para acessar um dashboard.
          </Typography>
        </Paper>
      </Box>

      <JoinDashboardDialog open={true} onClose={handleClose} />
    </Container>
  );
}
