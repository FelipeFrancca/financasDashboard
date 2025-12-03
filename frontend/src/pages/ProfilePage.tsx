import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import UserAvatar from '../components/UserAvatar';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks/api/useNotificationPreferences';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  // Sync formData with user when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // API hooks
  const { data: preferences, isLoading: loadingPreferences } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  // Local state for preferences (synced with API)
  const [localPreferences, setLocalPreferences] = useState({
    emailBudgetAlerts: true,
    emailGoalMilestones: true,
    emailWeeklySummary: true,
    emailMonthlySummary: true,
    inAppBudgetAlerts: true,
    inAppGoalMilestones: true,
    inAppDashboardActivity: true,
  });

  // Sync local state with API data
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        emailBudgetAlerts: preferences.emailBudgetAlerts,
        emailGoalMilestones: preferences.emailGoalMilestones,
        emailWeeklySummary: preferences.emailWeeklySummary,
        emailMonthlySummary: preferences.emailMonthlySummary,
        inAppBudgetAlerts: preferences.inAppBudgetAlerts,
        inAppGoalMilestones: preferences.inAppGoalMilestones,
        inAppDashboardActivity: preferences.inAppDashboardActivity,
      });
    }
  }, [preferences]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = () => {
    // TODO: Call API to update user profile
    console.log('Saving profile:', formData);
    setEditing(false);
  };

  const handleNotificationChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    // Update local state immediately for UI responsiveness
    setLocalPreferences({ ...localPreferences, [key]: newValue });
    // Update via API
    updatePreferences.mutate({ [key]: newValue });
  };

  const handleSavePreferences = () => {
    updatePreferences.mutate(localPreferences);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Meu Perfil"
        breadcrumbs={[
          { label: 'Dashboards', to: '/dashboards' },
          { label: 'Perfil' },
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Gerencie suas informações pessoais e preferências
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Informações Pessoais" />
          <Tab label="Notificações" />
          <Tab label="Segurança" />
        </Tabs>

        {/* Personal Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3 }}>
            <Grid container spacing={4}>
              {/* Avatar Section */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <UserAvatar user={user || undefined} size="large" sx={{ width: 120, height: 120, fontSize: 48 }} />
                  <Button variant="outlined" startIcon={<PhotoCamera />} size="small">
                    Alterar Foto
                  </Button>
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    JPG, PNG ou GIF. Máximo 2MB.
                  </Typography>
                </Box>
              </Grid>

              {/* Form Section */}
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Dados Pessoais</Typography>
                  {!editing && (
                    <Button startIcon={<EditIcon />} onClick={() => setEditing(true)}>
                      Editar
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Nome Completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editing}
                    fullWidth
                  />
                  <TextField
                    label="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                    fullWidth
                    type="email"
                  />

                  {editing && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                      >
                        Salvar Alterações
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => setEditing(false)}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preferências de Notificações
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure como e quando você deseja receber notificações
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Notificações por Email
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={<Switch checked={localPreferences.emailBudgetAlerts} onChange={handleNotificationChange('emailBudgetAlerts')} />}
                        label="Alertas de orçamento"
                      />
                      <FormControlLabel
                        control={<Switch checked={localPreferences.emailGoalMilestones} onChange={handleNotificationChange('emailGoalMilestones')} />}
                        label="Marcos de metas financeiras"
                      />
                      <FormControlLabel
                        control={<Switch checked={localPreferences.emailWeeklySummary} onChange={handleNotificationChange('emailWeeklySummary')} />}
                        label="Resumo semanal"
                      />
                      <FormControlLabel
                        control={<Switch checked={localPreferences.emailMonthlySummary} onChange={handleNotificationChange('emailMonthlySummary')} />}
                        label="Resumo mensal"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Notificações no App
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={<Switch checked={localPreferences.inAppBudgetAlerts} onChange={handleNotificationChange('inAppBudgetAlerts')} />}
                        label="Alertas de orçamento"
                      />
                      <FormControlLabel
                        control={<Switch checked={localPreferences.inAppGoalMilestones} onChange={handleNotificationChange('inAppGoalMilestones')} />}
                        label="Marcos de metas"
                      />
                      <FormControlLabel
                        control={<Switch checked={localPreferences.inAppDashboardActivity} onChange={handleNotificationChange('inAppDashboardActivity')} />}
                        label="Atividade do dashboard"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {loadingPreferences && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <CircularProgress size={24} />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Carregando preferências...
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={handleSavePreferences}
                disabled={updatePreferences.isPending}
              >
                {updatePreferences.isPending ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 3, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Alterar Senha
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Por segurança, você precisará confirmar sua senha atual para definir uma nova.
            </Alert>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Senha Atual"
                type="password"
                fullWidth
              />
              <TextField
                label="Nova Senha"
                type="password"
                fullWidth
              />
              <TextField
                label="Confirmar Nova Senha"
                type="password"
                fullWidth
              />

              <Button variant="contained" sx={{ alignSelf: 'flex-start' }}>
                Alterar Senha
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}
