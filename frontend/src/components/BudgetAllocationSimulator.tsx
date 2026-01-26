/**
 * Budget Allocation Simulator Component
 * Componente para simular e gerenciar alocações de orçamento por porcentagem
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Slider,
  IconButton,
  Button,
  Stack,
  Chip,
  Alert,
  Tooltip,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  InputAdornment,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  AutoAwesome as AIIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import budgetAllocationService, {
  AllocationCategory,
  AllocationProfile,
  AllocationSimulation,
  AllocationAnalysis,
} from '../services/budgetAllocationService';

// ============================================
// TIPOS
// ============================================

interface BudgetAllocationSimulatorProps {
  dashboardId: string;
  onSaveProfile?: (profile: AllocationProfile) => void;
}

// Cores padrão
const DEFAULT_COLORS = [
  '#EF4444', // red
  '#8B5CF6', // violet
  '#10B981', // emerald
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function BudgetAllocationSimulator({ dashboardId, onSaveProfile }: BudgetAllocationSimulatorProps) {
  const theme = useTheme();
  
  // Estados
  const [monthlyIncome, setMonthlyIncome] = useState<number>(5000);
  const [allocations, setAllocations] = useState<AllocationCategory[]>([]);
  const [simulation, setSimulation] = useState<AllocationSimulation | null>(null);
  const [analysis, setAnalysis] = useState<AllocationAnalysis | null>(null);
  const [profile, setProfile] = useState<AllocationProfile | null>(null);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');

  // Carregar perfil padrão ao montar
  useEffect(() => {
    loadDefaultProfile();
  }, [dashboardId]);

  // Simular quando alocações ou receita mudam
  useEffect(() => {
    if (allocations.length > 0 && monthlyIncome > 0) {
      simulateAllocations();
    }
  }, [allocations, monthlyIncome]);

  // ============================================
  // FUNÇÕES
  // ============================================

  const loadDefaultProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const defaultProfile = await budgetAllocationService.getDefaultProfile(dashboardId);
      setProfile(defaultProfile);
      setAllocations(defaultProfile.allocations || []);
    } catch (err) {
      // Se não tem perfil, usar padrões do sistema
      const defaults = await budgetAllocationService.getDefaults();
      setAllocations(defaults);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await budgetAllocationService.analyzeAllocations(dashboardId);
      setAnalysis(data);
      if (data.totalIncome > 0) {
        setMonthlyIncome(data.totalIncome);
      }
    } catch (err: any) {
      setError('Erro ao carregar análise');
    } finally {
      setLoading(false);
    }
  };

  const simulateAllocations = async () => {
    try {
      const result = await budgetAllocationService.simulate(monthlyIncome, allocations);
      setSimulation(result);
    } catch (err) {
      console.error('Erro ao simular:', err);
    }
  };

  const loadAIInsights = async () => {
    try {
      setLoadingAI(true);
      const { analysis: analysisData, aiInsights: insights } = await budgetAllocationService.getAIAnalysis(dashboardId);
      setAnalysis(analysisData);
      setAiInsights(insights);
      if (analysisData.totalIncome > 0) {
        setMonthlyIncome(analysisData.totalIncome);
      }
    } catch (err: any) {
      setError('Erro ao obter análise de IA');
    } finally {
      setLoadingAI(false);
    }
  };

  const handlePercentageChange = (index: number, value: number) => {
    const newAllocations = [...allocations];
    newAllocations[index] = { ...newAllocations[index], percentage: value };
    setAllocations(newAllocations);
  };

  const handleNameChange = (index: number, name: string) => {
    const newAllocations = [...allocations];
    newAllocations[index] = { ...newAllocations[index], name };
    setAllocations(newAllocations);
  };

  const addAllocation = () => {
    const usedColors = allocations.map(a => a.color);
    const nextColor = DEFAULT_COLORS.find(c => !usedColors.includes(c)) || DEFAULT_COLORS[0];
    
    setAllocations([
      ...allocations,
      {
        name: 'Nova Categoria',
        percentage: 0,
        color: nextColor,
        order: allocations.length,
        linkedCategories: [],
      },
    ]);
  };

  const removeAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const balancePercentages = () => {
    const totalCurrent = allocations.reduce((sum, a) => sum + a.percentage, 0);
    if (totalCurrent === 0) return;

    const factor = 100 / totalCurrent;
    const balanced = allocations.map(a => ({
      ...a,
      percentage: Math.round(a.percentage * factor * 10) / 10,
    }));
    
    // Ajustar arredondamento
    const newTotal = balanced.reduce((sum, a) => sum + a.percentage, 0);
    if (newTotal !== 100 && balanced.length > 0) {
      balanced[0].percentage += 100 - newTotal;
    }
    
    setAllocations(balanced);
  };

  const resetToDefaults = async () => {
    const defaults = await budgetAllocationService.getDefaults();
    setAllocations(defaults);
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      
      const newProfile: AllocationProfile = {
        name: profileName || 'Meu Perfil',
        description: profileDescription,
        isDefault: true,
        dashboardId,
        allocations,
      };

      if (profile?.id) {
        await budgetAllocationService.updateProfile(profile.id, newProfile);
      } else {
        await budgetAllocationService.createProfile(newProfile);
      }

      setSaveDialogOpen(false);
      onSaveProfile?.(newProfile);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CÁLCULOS
  // ============================================

  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.1;

  const chartData = allocations.map(a => ({
    name: a.name,
    value: a.percentage,
    color: a.color || DEFAULT_COLORS[allocations.indexOf(a) % DEFAULT_COLORS.length],
    amount: monthlyIncome * (a.percentage / 100),
  }));

  // ============================================
  // RENDER
  // ============================================

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            💰 Alocação de Orçamento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Defina como distribuir sua receita mensal
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Carregar análise real">
            <IconButton onClick={loadAnalysis} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Análise com IA">
            <IconButton onClick={loadAIInsights} disabled={loadingAI} color="secondary">
              {loadingAI ? <RefreshIcon className="spinning" /> : <AIIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Painel de Configuração */}
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            {/* Receita Mensal */}
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Receita Mensal
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Indicador de Total */}
            <Box mb={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">
                  Total Alocado
                </Typography>
                <Chip
                  label={`${totalPercentage.toFixed(1)}%`}
                  color={isValidTotal ? 'success' : 'error'}
                  size="small"
                  icon={isValidTotal ? <CheckIcon /> : <WarningIcon />}
                />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(totalPercentage, 100)}
                color={isValidTotal ? 'success' : 'error'}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
              {!isValidTotal && (
                <Stack direction="row" spacing={1} mt={1}>
                  <Typography variant="caption" color="error">
                    A soma deve ser 100%
                  </Typography>
                  <Button size="small" onClick={balancePercentages}>
                    Balancear
                  </Button>
                </Stack>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Lista de Alocações */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2">Categorias de Alocação</Typography>
                <Button startIcon={<AddIcon />} size="small" onClick={addAllocation}>
                  Adicionar
                </Button>
              </Stack>

              {loading ? (
                <LinearProgress />
              ) : (
                <Stack spacing={2}>
                  {allocations.map((allocation, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: `2px solid ${alpha(allocation.color || DEFAULT_COLORS[index], 0.3)}`,
                        borderRadius: 2,
                        bgcolor: alpha(allocation.color || DEFAULT_COLORS[index], 0.05),
                      }}
                    >
                      <Stack spacing={1}>
                        {/* Nome e Controles */}
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: allocation.color || DEFAULT_COLORS[index],
                            }}
                          />
                          {editingIndex === index ? (
                            <TextField
                              size="small"
                              value={allocation.name}
                              onChange={(e) => handleNameChange(index, e.target.value)}
                              onBlur={() => setEditingIndex(null)}
                              autoFocus
                              sx={{ flex: 1 }}
                            />
                          ) : (
                            <Typography
                              variant="subtitle2"
                              sx={{ flex: 1, cursor: 'pointer' }}
                              onClick={() => setEditingIndex(index)}
                            >
                              {allocation.name}
                            </Typography>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => removeAllocation(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>

                        {/* Slider de Porcentagem */}
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Slider
                            value={allocation.percentage}
                            onChange={(_, value) => handlePercentageChange(index, value as number)}
                            min={0}
                            max={100}
                            step={1}
                            sx={{
                              color: allocation.color || DEFAULT_COLORS[index],
                              '& .MuiSlider-thumb': {
                                bgcolor: 'white',
                                border: `2px solid ${allocation.color || DEFAULT_COLORS[index]}`,
                              },
                            }}
                          />
                          <TextField
                            size="small"
                            type="number"
                            value={allocation.percentage}
                            onChange={(e) => handlePercentageChange(index, Number(e.target.value))}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                            sx={{ width: 90 }}
                          />
                        </Stack>

                        {/* Valor Calculado */}
                        <Typography variant="body2" color="text.secondary">
                          = R$ {(monthlyIncome * (allocation.percentage / 100)).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Ações */}
            <Stack direction="row" spacing={1} mt={3}>
              <Button variant="outlined" onClick={resetToDefaults} startIcon={<RefreshIcon />}>
                Restaurar Padrão
              </Button>
              <Button
                variant="contained"
                onClick={() => setSaveDialogOpen(true)}
                startIcon={<SaveIcon />}
                disabled={!isValidTotal}
              >
                Salvar Perfil
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Painel de Visualização */}
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Distribuição Visual
            </Typography>

            {/* Gráfico de Pizza */}
            <Box height={250}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value}% (R$ ${props.payload.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Resumo da Simulação */}
            {simulation && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Resumo da Simulação
                </Typography>
                <List dense>
                  {simulation.allocations.map((alloc, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: alloc.color || DEFAULT_COLORS[index],
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={alloc.name}
                        secondary={`${alloc.percentage}%`}
                      />
                      <Typography variant="body2" fontWeight="medium">
                        R$ {alloc.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Análise Real (se disponível) */}
            {analysis && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Gastos Reais vs Planejado</Typography>
                    <Chip
                      label={analysis.summary.overallStatus}
                      color={
                        analysis.summary.overallStatus === 'healthy'
                          ? 'success'
                          : analysis.summary.overallStatus === 'warning'
                          ? 'warning'
                          : 'error'
                      }
                      size="small"
                    />
                  </Stack>

                  <List dense>
                    {analysis.allocations.map((alloc, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {alloc.status === 'on_track' ? (
                            <CheckIcon color="success" fontSize="small" />
                          ) : alloc.status === 'over' ? (
                            <WarningIcon color="error" fontSize="small" />
                          ) : (
                            <InfoIcon color="info" fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={alloc.name}
                          secondary={
                            <Stack direction="row" spacing={1}>
                              <Typography variant="caption">
                                Meta: {alloc.targetPercentage}%
                              </Typography>
                              <Typography variant="caption">
                                Real: {alloc.actualPercentage.toFixed(1)}%
                              </Typography>
                            </Stack>
                          }
                        />
                        <Chip
                          size="small"
                          label={`${alloc.difference >= 0 ? '+' : ''}R$ ${alloc.difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          color={alloc.status === 'over' ? 'error' : alloc.status === 'under' ? 'info' : 'success'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </>
            )}

            {/* Insights de IA */}
            {aiInsights && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <AIIcon color="secondary" fontSize="small" />
                    <Typography variant="subtitle2">Análise de IA</Typography>
                  </Stack>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.secondary.main, 0.05),
                      borderRadius: 2,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <Typography variant="body2">{aiInsights}</Typography>
                  </Paper>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Dialog para Salvar Perfil */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Salvar Perfil de Alocação</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome do Perfil"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              fullWidth
              placeholder="Ex: Conservador, Agressivo, Padrão..."
            />
            <TextField
              label="Descrição (opcional)"
              value={profileDescription}
              onChange={(e) => setProfileDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Descreva o objetivo deste perfil..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveProfile} disabled={loading}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
