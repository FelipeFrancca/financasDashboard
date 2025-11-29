import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    AppBar,
    Toolbar,
    useTheme,
    Stack,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleLoginClick = () => {
        if (isAuthenticated) {
            navigate('/dashboards');
        } else {
            navigate('/login');
        }
    };

    const features = [
        {
            icon: <DashboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Dashboard Intuitivo',
            description: 'Visualize todas as suas contas, receitas e despesas em um único lugar com gráficos interativos.',
        },
        {
            icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'income.main' }} />,
            title: 'Controle Financeiro',
            description: 'Acompanhe o fluxo do seu dinheiro e tome decisões inteligentes para o seu futuro.',
        },
        {
            icon: <SecurityIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
            title: 'Segurança Total',
            description: 'Seus dados são criptografados e protegidos com as melhores práticas de segurança do mercado.',
        },
        {
            icon: <SpeedIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
            title: 'Alta Performance',
            description: 'Uma interface rápida e responsiva para você gerenciar suas finanças sem perder tempo.',
        },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
            {/* AppBar */}
            <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ letterSpacing: 1 }}>
                                FINANÇAS 360°
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={handleLoginClick}
                            sx={{ px: 3, borderRadius: 50 }}
                        >
                            {isAuthenticated ? 'Acessar App' : 'Entrar / Criar Conta'}
                        </Button>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero Section */}
            <Box
                sx={{
                    pt: { xs: 12, md: 20 },
                    pb: { xs: 8, md: 12 },
                    background: theme.palette.mode === 'dark'
                        ? 'radial-gradient(circle at 50% 0%, #2d1b69 0%, #0a0118 60%)'
                        : 'radial-gradient(circle at 50% 0%, #f3e8ff 0%, #f8fafc 60%)',
                    flexGrow: 1,
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={6} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Stack spacing={3} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                                <Typography
                                    variant="h1"
                                    sx={{
                                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                                        fontWeight: 800,
                                        lineHeight: 1.2,
                                        background: 'linear-gradient(120deg, #7c3aed 0%, #2563eb 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Domine suas Finanças Pessoais
                                </Typography>
                                <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 400, lineHeight: 1.6 }}>
                                    A ferramenta completa para você organizar, planejar e multiplicar seu patrimônio. Simples, bonita e eficiente.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleLoginClick}
                                        sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 50 }}
                                    >
                                        Começar Agora
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        href="#features"
                                        sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 50 }}
                                    >
                                        Saiba Mais
                                    </Button>
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: -20,
                                        left: -20,
                                        right: -20,
                                        bottom: -20,
                                        background: 'linear-gradient(120deg, #7c3aed 0%, #2563eb 100%)',
                                        borderRadius: 8,
                                        opacity: 0.2,
                                        filter: 'blur(20px)',
                                        zIndex: 0,
                                    },
                                }}
                            >
                                <Card sx={{ position: 'relative', zIndex: 1, overflow: 'hidden', borderRadius: 4, boxShadow: 24 }}>
                                    <Box
                                        component="img"
                                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                        alt="Dashboard Preview"
                                        sx={{ width: '100%', height: 'auto', display: 'block' }}
                                    />
                                </Card>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
                <Container maxWidth="lg">
                    <Typography variant="h3" textAlign="center" fontWeight={700} sx={{ mb: 8 }}>
                        Tudo que você precisa
                    </Typography>
                    <Grid container spacing={4}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        p: 2,
                                        transition: 'transform 0.3s',
                                        '&:hover': { transform: 'translateY(-8px)' },
                                    }}
                                    elevation={0}
                                >
                                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: '50%' }}>
                                        {feature.icon}
                                    </Box>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom fontWeight={600}>
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {feature.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ py: 4, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                    © {new Date().getFullYear()} Finanças 360°. Todos os direitos reservados.
                </Typography>
            </Box>
        </Box>
    );
}
