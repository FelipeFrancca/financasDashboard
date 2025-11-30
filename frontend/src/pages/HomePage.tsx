import { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import Brightness4 from '@mui/icons-material/Brightness4';
import Brightness7 from '@mui/icons-material/Brightness7';
import KeyboardAlt from '@mui/icons-material/KeyboardAlt';
import Logout from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ShareDialog from '../components/ShareDialog';
import ShortcutsModal from '../components/ShortcutsModal';
import { useDashboards, useCreateDashboard } from '../hooks/api/useDashboards';

interface HomePageProps {
  mode: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function HomePage({ mode, onToggleTheme }: HomePageProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
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

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 't':
          e.preventDefault();
          onToggleTheme();
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleTheme]);

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar position="sticky" elevation={0} sx={{
        background: mode === 'dark'
          ? 'linear-gradient(120deg, #2d1b69 0%, #5b21b6 45%, #7c3aed 100%)'
          : 'linear-gradient(120deg, #7c3aed 0%, #9333ea 50%, #a855f7 100%)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1.5 }}>
            FINANÇAS 360°
          </Typography>

          <Chip
            label={`Atualizado ${lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
            size="small"
            sx={{ mr: 1 }}
          />

          <IconButton color="inherit" onClick={() => setShowShortcuts(true)}>
            <KeyboardAlt />
          </IconButton>

          <IconButton color="inherit" onClick={onToggleTheme}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ ml: 1 }}
          >
            <Avatar
              src={user?.avatar}
              alt={user?.name || user?.email}
              sx={{ width: 32, height: 32 }}
            >
              {!user?.avatar && (user?.name?.[0] || user?.email?.[0] || '?').toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {user?.name || 'Usuário'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                logout();
                navigate('/login');
              }}
            >
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Tabs e Conteúdo */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Meus Dashboards" />
            <Tab label="Compartilhados Comigo" />
          </Tabs>
        </Box>

        {/* Tab: Meus Dashboards */}
        {tabValue === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">Meus Dashboards</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Novo Dashboard
              </Button>
            </Box>

            {ownedDashboards.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <DashboardIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhum dashboard ainda
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Crie seu primeiro dashboard financeiro para começar
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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
                {ownedDashboards.map((d: any) => (
                  <Card
                    key={d.id}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      minHeight: 200,
                    }}
                  >
                    <CardContent
                      onClick={() => handleDashboardClick(d)}
                      sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        pb: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <DashboardIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                          {d.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                        {d.description || 'Sem descrição'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        <Chip label="Proprietário" size="small" color="primary" variant="outlined" />
                      </Box>
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ px: 2, py: 1.5 }}>
                      <Button
                        size="small"
                        startIcon={<ShareIcon />}
                        onClick={(e) => handleShare(d, e)}
                        fullWidth
                      >
                        Compartilhar
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Tab: Compartilhados Comigo */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>Compartilhados Comigo</Typography>

            {sharedDashboards.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <ShareIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhum dashboard compartilhado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quando alguém compartilhar um dashboard com você, ele aparecerá aqui
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
                {sharedDashboards.map((d: any) => (
                  <Card
                    key={d.id}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      minHeight: 200,
                    }}
                    onClick={() => handleDashboardClick(d)}
                  >
                    <CardContent sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <ShareIcon color="secondary" />
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                          {d.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
                        {d.description || 'Sem descrição'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        <Chip
                          label={d.role === 'EDITOR' ? 'Editor' : 'Visualizador'}
                          size="small"
                          color={d.role === 'EDITOR' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* Dialogs */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Novo Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            label="Título"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mt: 1 }}
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

      <ShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </Box>
  );
}
