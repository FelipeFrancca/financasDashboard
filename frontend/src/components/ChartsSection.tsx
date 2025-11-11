import { Grid, Card, CardHeader, CardContent } from '@mui/material';
import { ShowChart, PieChart } from '@mui/icons-material';
import { LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from '../types';

interface ChartsSectionProps {
  transactions: Transaction[];
}

const COLORS = ['#9b6dff', '#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a855f7', '#14b8a6', '#f97316'];

export default function ChartsSection({ transactions }: ChartsSectionProps) {
  // Preparar dados do gráfico de linha (evolução mensal)
  const monthlyData = (() => {
    const months = 12;
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === monthStart.getMonth() && tDate.getFullYear() === monthStart.getFullYear();
      });

      const income = monthTransactions.filter(t => t.entryType === 'Receita').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions.filter(t => t.entryType === 'Despesa').reduce((sum, t) => sum + t.amount, 0);

      data.push({
        month: format(monthStart, 'MMM yy', { locale: ptBR }),
        receitas: income,
        despesas: expense,
        saldo: income - expense,
      });
    }
    return data;
  })();

  // Preparar dados do gráfico de pizza (categorias)
  const categoryData = (() => {
    const expenses = transactions.filter(t => t.entryType === 'Despesa');
    const categoryMap = new Map<string, number>();
    
    expenses.forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + t.amount);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8
  })();

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} lg={8}>
        <Card>
          <CardHeader
            avatar={<ShowChart />}
            title="Evolução Mensal"
            titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="receitas" stroke="#34d399" strokeWidth={2} name="Receitas" />
                <Line type="monotone" dataKey="despesas" stroke="#f87171" strokeWidth={2} name="Despesas" />
                <Line type="monotone" dataKey="saldo" stroke="#9b6dff" strokeWidth={3} name="Saldo" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card>
          <CardHeader
            avatar={<PieChart />}
            title="Despesas por Categoria"
            titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <RechartsPie>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
