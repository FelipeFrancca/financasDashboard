import { Box, Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import SmartIngestion from '../components/SmartIngestion';

export default function IngestionPage() {
  const { dashboardId } = useParams<{ dashboardId: string }>();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/dashboards" color="inherit" underline="hover">
            Dashboards
          </Link>
          <Link 
            component={RouterLink} 
            to={`/dashboard/${dashboardId}`} 
            color="inherit" 
            underline="hover"
          >
            Visão Geral
          </Link>
          <Typography color="text.primary">Importar Documentos</Typography>
        </Breadcrumbs>

        <PageHeader
          title="Importar Documentos"
        />
        <Box sx={{ mb: 4, mt: -2 }}>
            <Typography variant="subtitle1" color="text.secondary">
                Envie notas fiscais e boletos para extração automática de dados
            </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <SmartIngestion />
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Seus documentos são processados de forma segura.
            <br />
            Dados extraídos via Inteligência Artificial podem requerer revisão.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
