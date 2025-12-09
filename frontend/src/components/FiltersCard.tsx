import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Button,
  Box,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Tooltip,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  FilterList,
  ExpandMore,
  Clear,
  TuneRounded,
  CalendarMonth,
  ChevronLeft,
  ChevronRight,
  Event,
  InfoOutlined,
} from '@mui/icons-material';
import { fadeIn } from '../utils/animations';
import type { TransactionFilters, Transaction, Account } from '../types';

// Nomes dos meses em português
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface FiltersCardProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  transactions: Transaction[];
  accounts?: Account[];
  categories?: any[];
}

export default function FiltersCard({ filters, onFiltersChange, transactions, accounts = [], categories: apiCategories = [] }: FiltersCardProps) {
  const theme = useTheme();
  const [expandedAccordion, setExpandedAccordion] = useState<boolean>(false);

  // Derivar mês e ano dos filtros recebidos (ou usar mês atual como fallback)
  const { derivedMonth, derivedYear } = useMemo(() => {
    if (filters.startDate) {
      const date = new Date(filters.startDate + 'T00:00:00');
      return { derivedMonth: date.getMonth(), derivedYear: date.getFullYear() };
    }
    const now = new Date();
    return { derivedMonth: now.getMonth(), derivedYear: now.getFullYear() };
  }, [filters.startDate]);

  // Estado local para mês e ano (sincronizado com filtros)
  const [selectedMonth, setSelectedMonth] = useState<number>(derivedMonth);
  const [selectedYear, setSelectedYear] = useState<number>(derivedYear);

  // Sincronizar quando os filtros mudarem externamente
  useEffect(() => {
    setSelectedMonth(derivedMonth);
    setSelectedYear(derivedYear);
  }, [derivedMonth, derivedYear]);

  const handleChange = useCallback((field: keyof TransactionFilters, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  }, [filters, onFiltersChange]);

  const handleReset = useCallback(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    onFiltersChange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
    setExpandedAccordion(false);
  }, [onFiltersChange]);

  // Handler para mudança do campo de filtro de data
  const handleDateFilterFieldChange = useCallback((newValue: 'date' | 'dueDate') => {
    onFiltersChange({
      ...filters,
      dateFilterField: newValue,
    });
  }, [filters, onFiltersChange]);

  // Handler para mudança de mês (direto pelo seletor ou toggle buttons)
  const handleMonthChange = useCallback((newMonth: number) => {
    const startDate = new Date(selectedYear, newMonth, 1);
    const endDate = new Date(selectedYear, newMonth + 1, 0);

    setSelectedMonth(newMonth);
    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }, [selectedYear, filters, onFiltersChange]);

  // Handler para navegar entre meses
  const handlePreviousMonth = useCallback(() => {
    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    const startDate = new Date(newYear, newMonth, 1);
    const endDate = new Date(newYear, newMonth + 1, 0);

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }, [selectedMonth, selectedYear, filters, onFiltersChange]);

  const handleNextMonth = useCallback(() => {
    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    const startDate = new Date(newYear, newMonth, 1);
    const endDate = new Date(newYear, newMonth + 1, 0);

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }, [selectedMonth, selectedYear, filters, onFiltersChange]);

  const handleYearChange = useCallback((newYear: number) => {
    const startDate = new Date(newYear, selectedMonth, 1);
    const endDate = new Date(newYear, selectedMonth + 1, 0);

    setSelectedYear(newYear);
    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }, [selectedMonth, filters, onFiltersChange]);

  const applyBillingCycle = () => {
    if (!filters.accountId) return;

    const account = accounts.find(a => a.id === filters.accountId);
    if (!account || account.type !== 'CREDIT_CARD' || !account.closingDay || !account.dueDay) return;

    const now = new Date();
    const currentDay = now.getDate();

    let targetMonth = now.getMonth();
    let targetYear = now.getFullYear();

    if (currentDay > account.closingDay) {
      targetMonth++;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear++;
      }
    }

    const closingDate = new Date(targetYear, targetMonth, account.closingDay);
    const startDate = new Date(closingDate);
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(startDate.getDate() + 1);

    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: closingDate.toISOString().split('T')[0],
    });
  };

  const selectedAccount = accounts.find(a => a.id === filters.accountId);
  const showBillingCycleOption = selectedAccount?.type === 'CREDIT_CARD' && selectedAccount?.closingDay;

  // Extrair categorias e instituições únicas
  const categories = apiCategories.length > 0
    ? apiCategories.map((c: any) => c.name).sort()
    : Array.from(new Set(transactions.map(t => t.category))).sort();

  const institutions = Array.from(new Set(transactions.map(t => t.institution).filter(Boolean))).sort();

  // Verifica se há filtros avançados ativos
  const hasAdvancedFilters = !!(
    filters.category ||
    filters.institution ||
    filters.minAmount ||
    filters.search ||
    filters.accountId ||
    filters.startDate ||
    filters.endDate
  );

  // Anos disponíveis para seleção (5 anos para trás e 1 para frente)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  return (
    <Card id="filters-section" sx={{ ...fadeIn, scrollMarginTop: '100px' }}>
      <CardHeader
        avatar={<FilterList color="primary" />}
        title="Filtros Inteligentes"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <Button
            size="small"
            startIcon={<Clear />}
            onClick={handleReset}
            variant="outlined"
            sx={{
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            Limpar
          </Button>
        }
      />
      <CardContent>
        {/* Seletor de Mês Principal */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <IconButton onClick={handlePreviousMonth} size="small">
              <ChevronLeft />
            </IconButton>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)',
            }}>
              <TextField
                select
                size="small"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                variant="standard"
                sx={{
                  minWidth: 120,
                  '& .MuiInput-underline:before': { borderBottom: 'none' },
                  '& .MuiInput-underline:hover:before': { borderBottom: 'none' },
                  '& .MuiInput-underline:after': { borderBottom: 'none' },
                  '& .MuiSelect-select': {
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    textAlign: 'center',
                  },
                }}
              >
                {MONTH_NAMES.map((name, index) => (
                  <MenuItem key={index} value={index}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                variant="standard"
                sx={{
                  minWidth: 80,
                  '& .MuiInput-underline:before': { borderBottom: 'none' },
                  '& .MuiInput-underline:hover:before': { borderBottom: 'none' },
                  '& .MuiInput-underline:after': { borderBottom: 'none' },
                  '& .MuiSelect-select': {
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  },
                }}
              >
                {availableYears.map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </TextField>
            </Box>
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Quick month buttons for mobile */}
          <Box sx={{
            display: { xs: 'none', sm: 'flex' },
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 0.5,
          }}>
            <ToggleButtonGroup
              value={selectedMonth}
              exclusive
              onChange={(_, value) => value !== null && handleMonthChange(value)}
              size="small"
              sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {MONTH_NAMES.map((name, index) => (
                <ToggleButton
                  key={index}
                  value={index}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {name.substring(0, 3)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Toggle de Filtro por Data */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          mb: 3,
          flexWrap: 'wrap',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Event fontSize="small" color="action" />
            <ToggleButtonGroup
              value={filters.dateFilterField || 'date'}
              exclusive
              onChange={(_, value) => value && handleDateFilterFieldChange(value)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 2,
                  py: 0.5,
                  textTransform: 'none',
                  fontSize: '0.8rem',
                },
              }}
            >
              <ToggleButton value="date">
                📅 Data da Compra
              </ToggleButton>
              <ToggleButton value="dueDate">
                💳 Data de Vencimento
              </ToggleButton>
            </ToggleButtonGroup>
            <Tooltip title="Data da Compra: quando a transação foi realizada. Data de Vencimento: quando a fatura do cartão vence.">
              <InfoOutlined sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
            </Tooltip>
          </Box>
        </Box>

        {/* Filtros Básicos (sem datas agora) */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="Tipo"
              value={filters.entryType || ''}
              onChange={(e) => handleChange('entryType', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Receita">Receita</MenuItem>
              <MenuItem value="Despesa">Despesa</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="Propriedade"
              value={filters.ownership || 'all'}
              onChange={(e) => handleChange('ownership', e.target.value)}
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="client">Minhas</MenuItem>
              <MenuItem value="thirdParty">Terceiros</MenuItem>
            </TextField>
          </Grid>

        </Grid>

        {/* Filtros Avançados - Accordion */}
        <Accordion
          expanded={expandedAccordion}
          onChange={() => setExpandedAccordion(!expandedAccordion)}
          sx={{
            mt: 2,
            boxShadow: 'none',
            border: 1,
            borderColor: hasAdvancedFilters ? 'primary.main' : 'divider',
            transition: 'all 0.3s',
            '&:before': {
              display: 'none',
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(124, 58, 237, 0.04)',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(124, 58, 237, 0.08)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TuneRounded fontSize="small" color={hasAdvancedFilters ? 'primary' : 'action'} />
              <Box>
                <Box sx={{ fontWeight: 600 }}>
                  Filtros Avançados
                </Box>
                {hasAdvancedFilters && (
                  <Box sx={{ fontSize: '0.75rem', color: 'primary.main', mt: 0.25 }}>
                    Filtros ativos
                  </Box>
                )}
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Datas customizadas */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Data Inicial"
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Data Final"
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                  {showBillingCycleOption && (
                    <Tooltip title="Aplicar período da fatura atual">
                      <IconButton
                        onClick={applyBillingCycle}
                        color="primary"
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                        }}
                      >
                        <CalendarMonth />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Conta"
                  value={filters.accountId || ''}
                  onChange={(e) => handleChange('accountId', e.target.value)}
                  size="small"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Categoria"
                  value={filters.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                  size="small"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Instituição"
                  value={filters.institution || ''}
                  onChange={(e) => handleChange('institution', e.target.value)}
                  size="small"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {institutions.map((inst) => (
                    <MenuItem key={inst} value={inst!}>{inst}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Valor mínimo"
                  type="number"
                  value={filters.minAmount || ''}
                  onChange={(e) => handleChange('minAmount', e.target.value)}
                  InputProps={{ startAdornment: 'R$' }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Fluxo"
                  value={filters.flowType || ''}
                  onChange={(e) => handleChange('flowType', e.target.value)}
                  size="small"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Fixa">Fixa</MenuItem>
                  <MenuItem value="Variável">Variável</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}
