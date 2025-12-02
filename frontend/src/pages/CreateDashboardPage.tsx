import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useCreateDashboard } from '../hooks/api/useDashboards';

export default function CreateDashboardPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  
  const createDashboardMutation = useCreateDashboard();

  const steps = ['Informações Básicas', 'Confirmação'];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCreate = async () => {
    try {
      const dashboard = await createDashboardMutation.mutateAsync({ title, description });
      navigate(`/dashboard/${dashboard.id}`);
    } catch (error) {
      console.error('Error creating dashboard:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Criar Novo Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Configure um novo dashboard para gerenciar suas finanças
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 4 }}>
          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Título do Dashboard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
                autoFocus
                helperText="Ex: Finanças Pessoais, Orçamento Familiar, Investimentos"
              />
              <TextField
                label="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={4}
                helperText="Descreva o propósito deste dashboard (opcional)"
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button onClick={() => navigate('/dashboards')}>Cancelar</Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!title.trim()}
                  endIcon={<CheckCircleIcon />}
                >
                  Próximo
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" gutterBottom>
                Revisão
              </Typography>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Título
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {title}
                </Typography>
              </Box>
              {description && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Descrição
                  </Typography>
                  <Typography variant="body1">{description}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button onClick={handleBack}>Voltar</Button>
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={createDashboardMutation.isPending}
                  startIcon={<AddIcon />}
                >
                  {createDashboardMutation.isPending ? 'Criando...' : 'Criar Dashboard'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
