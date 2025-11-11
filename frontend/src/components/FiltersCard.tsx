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
  Collapse,
} from '@mui/material';
import { FilterList, ExpandMore, Clear } from '@mui/icons-material';
import type { TransactionFilters, Transaction } from '../types';

interface FiltersCardProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  transactions: Transaction[];
}

export default function FiltersCard({ filters, onFiltersChange, transactions }: FiltersCardProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof TransactionFilters, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  // Extrair categorias únicas
  const categories = Array.from(new Set(transactions.map(t => t.category))).sort();
  const institutions = Array.from(new Set(transactions.map(t => t.institution).filter(Boolean))).sort();

  return (
    <Card>
      <CardHeader
        avatar={<FilterList />}
        title="Filtros Inteligentes"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={handleReset}
              variant="outlined"
            >
              Limpar
            </Button>
            <Button
              size="small"
              endIcon={<ExpandMore sx={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outlined"
            >
              Avançado
            </Button>
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Data Inicial"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Data Final"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
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

        <Collapse in={showAdvanced}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Valor Mínimo"
                type="number"
                value={filters.minAmount || ''}
                onChange={(e) => handleChange('minAmount', e.target.value)}
                InputProps={{ startAdornment: 'R$' }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Descrição, categoria..."
                value={filters.search || ''}
                onChange={(e) => handleChange('search', e.target.value)}
              />
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
}
