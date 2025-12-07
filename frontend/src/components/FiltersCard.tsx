import { useState } from 'react';
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
} from '@mui/material';
import {
  FilterList,
  ExpandMore,
  Clear,
  TuneRounded,
  CalendarMonth,
} from '@mui/icons-material';
import { fadeIn } from '../utils/animations';
import type { TransactionFilters, Transaction, Account } from '../types';

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

  const handleChange = (field: keyof TransactionFilters, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleReset = () => {
    onFiltersChange({});
    setExpandedAccordion(false);
  };

  const applyBillingCycle = () => {
    if (!filters.accountId) return;
    
    const account = accounts.find(a => a.id === filters.accountId);
    if (!account || account.type !== 'CREDIT_CARD' || !account.closingDay || !account.dueDay) return;

    const now = new Date();
    const currentDay = now.getDate();
    
    // Se hoje é antes do fechamento, estamos na fatura atual (que fecha neste mês)
    // Se hoje é depois do fechamento, estamos na próxima fatura (que fecha no próximo mês)
    
    let targetMonth = now.getMonth();
    let targetYear = now.getFullYear();

    if (currentDay > account.closingDay) {
      targetMonth++;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear++;
      }
    }

    // Data de fechamento da fatura alvo
    const closingDate = new Date(targetYear, targetMonth, account.closingDay);
    
    // Data de início da fatura (dia seguinte ao fechamento anterior)
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
  // Se apiCategories for fornecido, usa ele para extrair nomes. Caso contrário, fallback para transações.
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
    filters.accountId
  );

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
        {/* Filtros Básicos */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Data Inicial"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
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
                      height: 56,
                      width: 56,
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
              label="Tipo"
              value={filters.entryType || ''}
              onChange={(e) => handleChange('entryType', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Receita">Receita</MenuItem>
              <MenuItem value="Despesa">Despesa</MenuItem>
            </TextField>
          </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Conta"
                  value={filters.accountId || ''}
                  onChange={(e) => handleChange('accountId', e.target.value)}
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
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Descrição, categoria..."
                  value={filters.search || ''}
                  onChange={(e) => handleChange('search', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Fluxo"
                  value={filters.flowType || ''}
                  onChange={(e) => handleChange('flowType', e.target.value)}
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
