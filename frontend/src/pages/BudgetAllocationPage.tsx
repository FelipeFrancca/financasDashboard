/**
 * Budget Allocation Page
 * Página para gerenciar alocações de orçamento por porcentagem
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Stack,
  Alert,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PieChart as PieChartIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import BudgetAllocationSimulator from '../components/BudgetAllocationSimulator';
import budgetAllocationService, {
  AllocationProfile,
  AllocationAlert,
} from '../services/budgetAllocationService';
import { showSuccess, showError, showConfirm } from '../utils/notifications';

// ============================================
// COMPONENTE DE TAB PANEL
// ============================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function BudgetAllocationPage() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [profiles, setProfiles] = useState<AllocationProfile[]>([]);
  const [alerts, setAlerts] = useState<AllocationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    if (dashboardId) {
      loadData();
    }
  }, [dashboardId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profilesData, alertsData] = await Promise.all([
        budgetAllocationService.listProfiles(dashboardId),
        budgetAllocationService.getAlerts(dashboardId!),
      ]);

      setProfiles(profilesData);
      setAlerts(alertsData);
    } catch (err: any) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (profileId: string) => {
    try {
      await budgetAllocationService.updateProfile(profileId, { isDefault: true });
      showSuccess('Perfil definido como padrão');
      loadData();
    } catch (err) {
      showError('Erro ao definir perfil padrão');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    const result = await showConfirm(
      'Tem certeza que deseja excluir este perfil de alocação?',
      { title: 'Confirmar exclusão' }
    );

    if (result.isConfirmed) {
      try {
        await budgetAllocationService.deleteProfile(profileId);
        showSuccess('Perfil excluído');
        loadData();
      } catch (err) {
        showError('Erro ao excluir perfil');
      }
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (!dashboardId) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Dashboard não encontrado</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Alocação de Orçamento"
        subtitle="Defina regras de distribuição da sua receita mensal"
      />

      {/* Alertas de Alocação */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {alerts.length > 0 && (
        <Box mb={3}>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.type === 'critical' ? 'error' : 'warning'}
              sx={{ mb: 1 }}
              icon={<WarningIcon />}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Tabs de Navegação */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PieChartIcon />} label="Simulador" />
          <Tab icon={<HistoryIcon />} label="Meus Perfis" />
          <Tab icon={<TrendingUpIcon />} label="Análise" />
        </Tabs>
      </Card>

      {/* Tab: Simulador */}
      <TabPanel value={tabValue} index={0}>
        <BudgetAllocationSimulator
          dashboardId={dashboardId}
          onSaveProfile={() => {
            loadData();
            showSuccess('Perfil salvo com sucesso!');
          }}
        />
      </TabPanel>

      {/* Tab: Meus Perfis */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Perfis de Alocação Salvos
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : profiles.length === 0 ? (
              <Alert severity="info">
                Você ainda não tem perfis salvos. Use o simulador para criar seu primeiro perfil!
              </Alert>
            ) : (
              <List>
                {profiles.map((profile) => (
                  <ListItem
                    key={profile.id}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={profile.isDefault ? 'Perfil padrão' : 'Definir como padrão'}>
                          <IconButton onClick={() => handleSetDefault(profile.id!)}>
                            {profile.isDefault ? (
                              <StarIcon color="warning" />
                            ) : (
                              <StarBorderIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir perfil">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteProfile(profile.id!)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      <PieChartIcon color={profile.isDefault ? 'primary' : 'action'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography fontWeight="medium">{profile.name}</Typography>
                          {profile.isDefault && (
                            <Chip label="Padrão" size="small" color="primary" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <>
                          {profile.description && (
                            <Typography variant="body2" color="text.secondary">
                              {profile.description}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                            {profile.allocations?.map((alloc, index) => (
                              <Chip
                                key={index}
                                label={`${alloc.name}: ${alloc.percentage}%`}
                                size="small"
                                sx={{
                                  bgcolor: alloc.color,
                                  color: 'white',
                                  fontSize: '0.7rem',
                                }}
                              />
                            ))}
                          </Stack>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab: Análise */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Análise de Alocação
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Acompanhe como seus gastos reais se comparam com as metas de alocação definidas.
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              Use o botão de "Análise com IA" no simulador para obter insights personalizados
              sobre sua distribuição de gastos.
            </Alert>

            {/* Informações sobre a regra 50/30/20 */}
            <Box mt={3}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                💡 Sobre a Regra 50/30/20
              </Typography>
              <Typography variant="body2" paragraph>
                A regra 50/30/20 é uma estratégia popular de orçamento pessoal criada pela
                senadora americana Elizabeth Warren:
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="50% - Necessidades"
                    secondary="Despesas essenciais como moradia, alimentação, contas, transporte"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="30% - Desejos"
                    secondary="Lazer, entretenimento, restaurantes, hobbies"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="20% - Poupança/Investimentos"
                    secondary="Reserva de emergência, investimentos, pagamento de dívidas"
                  />
                </ListItem>
              </List>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Personalize para sua realidade!</strong> A regra 50/30/20 é apenas um
                ponto de partida. Use o simulador para criar alocações que façam sentido para
                sua situação financeira específica.
              </Alert>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
    </Container>
  );
}
