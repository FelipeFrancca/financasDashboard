import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { dashboardService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function SharedPreviewPage() {
  const { code } = useParams<{ code: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    if (!code) return;
    
    const loadPreview = async () => {
      try {
        const data = await dashboardService.getSharedPreview(code);
        setPreview(data);
        
        // If user is not authenticated, store the code for later acceptance
        if (!isAuthenticated) {
          localStorage.setItem('pendingShareCode', code);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao carregar compartilhamento');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [code, isAuthenticated]);

  const handleAccept = async () => {
    if (!code) return;
    
    if (!isAuthenticated) {
      // Store code and redirect to login
      localStorage.setItem('pendingShareCode', code);
      navigate('/login');
      return;
    }

    try {
      await dashboardService.acceptInvite(code);
      navigate('/dashboards');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao aceitar convite');
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Você foi convidado para um Dashboard
            </Typography>
            
            {preview && (
              <>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  {preview.dashboard.title}
                </Typography>
                
                {preview.dashboard.description && (
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    {preview.dashboard.description}
                  </Typography>
                )}

                <Typography variant="body2" sx={{ mt: 2 }}>
                  Função: <strong>{preview.role}</strong>
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Convidado por: {preview.inviter.name}
                </Typography>

                {preview.expiresAt && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Expira em: {new Date(preview.expiresAt).toLocaleDateString()}
                  </Typography>
                )}

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    onClick={handleAccept}
                    fullWidth
                  >
                    {isAuthenticated ? 'Aceitar Convite' : 'Entrar para Aceitar'}
                  </Button>
                  
                  {!isAuthenticated && (
                    <Button 
                      variant="outlined" 
                      size="large" 
                      onClick={() => {
                        localStorage.setItem('pendingShareCode', code!);
                        navigate('/login?register=true');
                      }}
                      fullWidth
                    >
                      Criar Conta
                    </Button>
                  )}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
