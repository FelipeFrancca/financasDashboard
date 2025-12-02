import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ShareIcon from '@mui/icons-material/Share';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useNavigate } from 'react-router-dom';
import ShareDialog from '../components/ShareDialog';
import { useDashboards, useCreateDashboard } from '../hooks/api/useDashboards';

export default function HomePage() {
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);

  // Dashboard management
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareDashboard, setShareDashboard] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Hooks
  const { data: dashboards = [] } = useDashboards();
  const createDashboardMutation = useCreateDashboard();

  const handleCreateDashboard = async () => {
    try {
      await createDashboardMutation.mutateAsync({ title, description });
      setCreateDialogOpen(false);
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error creating dashboard:', error);
    }
  };

  const handleDashboardClick = (dashboard: any) => {
    navigate(`/dashboard/${dashboard.id}`);
  };

  const handleShare = (dashboard: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShareDashboard(dashboard);
    setShareDialogOpen(true);
  };

  // Separa dashboards owned e shared
  const ownedDashboards = dashboards.filter((d: any) => d.isOwner);
  const sharedDashboards = dashboards.filter((d: any) => !d.isOwner);

  const renderDashboardCard = (dashboard: any, isOwned: boolean) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={dashboard.id}>
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 200,
        }}
        onClick={() => handleDashboardClick(dashboard)}
      >
        <CardContent
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isOwned ? <DashboardIcon color="primary" /> : <ShareIcon color="secondary" />}
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {dashboard.title}
              </Typography>
            </Box>
            {isOwned && (
              <ShareIcon
                fontSize="small"
                sx={{ color: 'text.secondary', cursor: 'pointer' }}
                onClick={(e) => handleShare(dashboard, e)}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
            {dashboard.description || 'Sem descrição'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
            <Chip
              label={
                isOwned
                  ? 'Proprietário'
                  : dashboard.role === 'EDITOR'
                  ? 'Editor'
                  : 'Visualizador'
              }
              size="small"
              color={isOwned ? 'primary' : dashboard.role === 'EDITOR' ? 'success' : 'default'}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Meus Dashboards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie seus dashboards financeiros ou entre em um compartilhado
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<VpnKeyIcon />}
            onClick={() => navigate('/dashboards/join')}
            size="large"
          >
            Entrar com Chave
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            size="large"
          >
            Novo Dashboard
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Meus Dashboards" />
          <Tab label="Compartilhados Comigo" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Box>
          {ownedDashboards.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <DashboardIcon sx={{ fontSize: 80, color: 'text.secondary', mb:2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhum dashboard criado
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Crie seu primeiro dashboard para começar a gerenciar suas finanças
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Criar Primeiro Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {ownedDashboards.map((d: any) => renderDashboardCard(d, true))}
            </Grid>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {sharedDashboards.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <ShareIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhum dashboard compartilhado
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Quando alguém compartilhar um dashboard com você, ele aparecerá aqui
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<VpnKeyIcon />}
                  onClick={() => navigate('/dashboards/join')}
                >
                  Entrar com Chave de Compartilhamento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {sharedDashboards.map((d: any) => renderDashboardCard(d, false))}
            </Grid>
          )}
        </Box>
      )}

      {/* Dialogs */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            label="Título"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mt: 2 }}
            autoFocus
          />
          <TextField
            label="Descrição"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mt: 2 }}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateDashboard} disabled={!title.trim()}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {shareDashboard && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          dashboardId={shareDashboard.id}
          dashboardTitle={shareDashboard.title}
        />
      )}
    </Box>
  );
}
