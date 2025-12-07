import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    AppBar,
    Toolbar,
    useTheme,
    Stack,
    Paper,
    Chip,
    LinearProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    alpha,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    PersonAdd as PersonAddIcon,
    AccountBalanceWallet as WalletIcon,
    Receipt as ReceiptIcon,
    Insights as InsightsIcon,
    Language as LanguageIcon,
    Apple as AppleIcon,
    Android as AndroidIcon,
    DesktopWindows as WindowsIcon,
    Laptop as LaptopIcon,
    Computer as ComputerIcon,
    Lock as LockIcon,
    VerifiedUser as VerifiedUserIcon,
    Policy as PolicyIcon,
    Backup as BackupIcon,
    Shield as ShieldIcon,
    GppGood as GppGoodIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import AnimatedCounter from '../components/AnimatedCounter';
import FeatureCarousel from '../components/FeatureCarousel';
import TestimonialCarousel from '../components/TestimonialCarousel';
import ScrollAnimation from '../components/ScrollAnimation';
import {
    monthlyIncomeExpenses,
    categoryData,
    budgetProgress,
    trendData,
    features,
    howItWorksSteps,
    platforms,
    testimonials,
    statistics,
    securityFeatures,
    faqItems,
} from '../data/landingData';

export default function LandingPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleLoginClick = () => {
        if (isAuthenticated) {
            navigate('/dashboards');
        } else {
            navigate('/login');
        }
    };

    const iconMap: Record<string, any> = {
        PersonAdd: PersonAddIcon,
        AccountBalanceWallet: WalletIcon,
        Receipt: ReceiptIcon,
        Insights: InsightsIcon,
        Lock: LockIcon,
        VerifiedUser: VerifiedUserIcon,
        Policy: PolicyIcon,
        Backup: BackupIcon,
        Shield: ShieldIcon,
        GppGood: GppGoodIcon,
        Language: LanguageIcon,
        Apple: AppleIcon,
        Android: AndroidIcon,
        DesktopWindows: WindowsIcon,
        Laptop: LaptopIcon,
        Computer: ComputerIcon,
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Animated Background */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    opacity: 0.4,
                    background: theme.palette.mode === 'dark'
                        ? 'radial-gradient(circle at 50% 50%, #2d1b69 0%, #0a0118 60%)'
                        : 'radial-gradient(circle at 50% 50%, #f3e8ff 0%, #f8fafc 60%)',
                    pointerEvents: 'none',
                }}
            />

            {/* AppBar with scroll effect */}
            <AppBar
                position="fixed"
                elevation={scrolled ? 4 : 0}
                sx={{
                    bgcolor: scrolled ? alpha(theme.palette.background.paper, 0.95) : 'transparent',
                    backdropFilter: scrolled ? 'blur(10px)' : 'none',
                    borderBottom: scrolled ? 1 : 0,
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    zIndex: 1100,
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Logo
                                variant="full"
                                width={{ xs: 140, sm: 180 }}
                                sx={{ cursor: 'pointer' }}
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            />
                        </Box>
                        <Stack direction="row" spacing={{ xs: 1, sm: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                sx={{ borderRadius: 50, display: { xs: 'none', md: 'inline-flex' } }}
                            >
                                Recursos
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleLoginClick}
                                sx={{ px: { xs: 2, sm: 3 }, borderRadius: 50 }}
                            >
                                {isAuthenticated ? 'Acessar App' : 'Entrar'}
                            </Button>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero Section with parallax */}
            <Box
                sx={{
                    pt: { xs: 14, md: 20 },
                    pb: { xs: 8, md: 12 },
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Stack spacing={3} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                                <Typography
                                    variant="h1"
                                    sx={{
                                        fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                                        fontWeight: 900,
                                        lineHeight: 1.1,
                                        background: 'linear-gradient(120deg, #7c3aed 0%, #2563eb 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        animation: 'fadeInUp 0.8s ease-out',
                                        '@keyframes fadeInUp': {
                                            from: { opacity: 0, transform: 'translateY(30px)' },
                                            to: { opacity: 1, transform: 'translateY(0)' },
                                        },
                                    }}
                                >
                                    Domine suas Finanças Pessoais
                                </Typography>
                                <Typography
                                    variant="h5"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 400,
                                        lineHeight: 1.6,
                                        animation: 'fadeInUp 0.8s ease-out 0.2s both',
                                    }}
                                >
                                    A ferramenta completa para organizar, planejar e multiplicar seu patrimônio.
                                    Simples, bonita e extremamente eficiente.
                                </Typography>

                                {/* Platform badges */}
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                    sx={{
                                        justifyContent: { xs: 'center', md: 'flex-start' },
                                        gap: 1,
                                        animation: 'fadeInUp 0.8s ease-out 0.4s both',
                                    }}
                                >
                                    <Chip icon={<LanguageIcon />} label="Web" size="small" />
                                    <Chip icon={<AppleIcon />} label="iOS" size="small" />
                                    <Chip icon={<AndroidIcon />} label="Android" size="small" />
                                    <Chip icon={<WindowsIcon />} label="Windows" size="small" />
                                </Stack>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 2,
                                        justifyContent: { xs: 'center', md: 'flex-start' },
                                        flexWrap: 'wrap',
                                        animation: 'fadeInUp 0.8s ease-out 0.6s both',
                                    }}
                                >
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleLoginClick}
                                        sx={{
                                            px: 4,
                                            py: 1.5,
                                            fontSize: '1.1rem',
                                            borderRadius: 50,
                                            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                                            '&:hover': {
                                                boxShadow: '0 12px 32px rgba(124, 58, 237, 0.6)',
                                                transform: 'translateY(-2px)',
                                            },
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        Começar Grátis
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                                        sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 50 }}
                                    >
                                        Ver Demo
                                    </Button>
                                </Box>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
                                    transition: 'transform 0.1s ease-out',
                                    animation: 'fadeInUp 0.8s ease-out 0.3s both',
                                }}
                            >
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
                                            filter: 'blur(30px)',
                                            zIndex: 0,
                                            animation: 'pulse 3s ease-in-out infinite',
                                            '@keyframes pulse': {
                                                '0%, 100%': { opacity: 0.2 },
                                                '50%': { opacity: 0.4 },
                                            },
                                        },
                                    }}
                                >
                                    <Card
                                        sx={{
                                            position: 'relative',
                                            zIndex: 1,
                                            overflow: 'hidden',
                                            borderRadius: 4,
                                            boxShadow: 24,
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src="/dashboard-preview.png"
                                            alt="Dashboard Preview"
                                            sx={{ width: '100%', height: 'auto', display: 'block' }}
                                        />
                                    </Card>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Statistics Section */}
            <Box sx={{ py: { xs: 6, md: 8 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        {statistics.map((stat, index) => (
                            <Grid item xs={6} md={3} key={index}>
                                <ScrollAnimation animation="fadeIn" delay={index * 100}>
                                    <Box
                                        sx={{
                                            textAlign: 'center',
                                        }}
                                    >
                                        <AnimatedCounter
                                            end={stat.value}
                                            prefix={stat.prefix}
                                            suffix={stat.suffix}
                                            decimals={stat.suffix === 'Bi' ? 1 : 0}
                                        />
                                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                                            {stat.label}
                                        </Typography>
                                    </Box>
                                </ScrollAnimation>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Live Charts Demo Section */}
            <Box id="demo" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper', position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Stack spacing={2} sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                            Veja Suas Finanças Ganharem Vida
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
                            Gráficos interativos e visualizações poderosas para entender seu dinheiro
                        </Typography>
                    </Stack>

                    <Grid container spacing={4}>
                        {/* Income vs Expenses */}
                        <Grid item xs={12} md={6}>
                            <ScrollAnimation animation="slideInLeft">
                                <Card
                                    elevation={3}
                                    sx={{
                                        p: 3,
                                        height: '100%',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: 12,
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Receitas vs Despesas
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Acompanhe o fluxo mensal do seu dinheiro
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={monthlyIncomeExpenses}>
                                            <defs>
                                                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                                            <YAxis stroke={theme.palette.text.secondary} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: theme.palette.background.paper,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    borderRadius: 8,
                                                }}
                                            />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="receitas"
                                                stroke="#10b981"
                                                fillOpacity={1}
                                                fill="url(#colorReceitas)"
                                                name="Receitas (R$)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="despesas"
                                                stroke="#ef4444"
                                                fillOpacity={1}
                                                fill="url(#colorDespesas)"
                                                name="Despesas (R$)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Card>
                            </ScrollAnimation>
                        </Grid>

                        {/* Category Distribution */}
                        <Grid item xs={12} md={6}>
                            <ScrollAnimation animation="slideInRight">
                                <Card
                                    elevation={3}
                                    sx={{
                                        p: 3,
                                        height: '100%',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: 12,
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Distribuição por Categoria
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Entenda para onde vai seu dinheiro
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: theme.palette.background.paper,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    borderRadius: 8,
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card>
                            </ScrollAnimation>
                        </Grid>

                        {/* Budget Progress */}
                        <Grid item xs={12} md={6}>
                            <ScrollAnimation animation="slideInLeft" delay={200}>
                                <Card
                                    elevation={3}
                                    sx={{
                                        p: 3,
                                        height: '100%',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: 12,
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Progresso de Orçamentos
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Controle seus gastos por categoria
                                    </Typography>
                                    <Stack spacing={3}>
                                        {budgetProgress.map((budget, index) => (
                                            <Box key={index}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {budget.category}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        R$ {budget.spent} / R$ {budget.budget}
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={budget.percentage}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 4,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor:
                                                                budget.percentage >= 90
                                                                    ? '#ef4444'
                                                                    : budget.percentage >= 75
                                                                        ? '#f59e0b'
                                                                        : '#10b981',
                                                            borderRadius: 4,
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        ))}
                                    </Stack>
                                </Card>
                            </ScrollAnimation>
                        </Grid>

                        {/* Trend Lines */}
                        <Grid item xs={12} md={6}>
                            <ScrollAnimation animation="slideInRight" delay={200}>
                                <Card
                                    elevation={3}
                                    sx={{
                                        p: 3,
                                        height: '100%',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: 12,
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Evolução Patrimonial
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Acompanhe o crescimento do seu patrimônio
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={trendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                                            <YAxis stroke={theme.palette.text.secondary} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: theme.palette.background.paper,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    borderRadius: 8,
                                                }}
                                            />
                                            <Legend />
                                            <Line type="monotone" dataKey="economia" stroke="#7c3aed" strokeWidth={2} name="Economia (R$)" />
                                            <Line type="monotone" dataKey="investimentos" stroke="#2563eb" strokeWidth={2} name="Investimentos (R$)" />
                                            <Line type="monotone" dataKey="reserva" stroke="#10b981" strokeWidth={2} name="Reserva (R$)" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Card>
                            </ScrollAnimation>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Carousel */}
            <Box id="features" sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Stack spacing={2} sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                            Recursos Poderosos
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Tudo que você precisa em um só lugar
                        </Typography>
                    </Stack>
                    <FeatureCarousel features={features} />
                </Container>
            </Box>

            {/* How It Works */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper', position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Stack spacing={2} sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                            Como Funciona
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Comece em minutos, não em horas
                        </Typography>
                    </Stack>

                    <Grid container spacing={4}>
                        {howItWorksSteps.map((step, index) => {
                            const IconComponent = iconMap[step.icon] || DashboardIcon;
                            return (
                                <Grid item xs={12} sm={6} md={3} key={index}>
                                    <ScrollAnimation animation="scaleIn" delay={index * 150}>
                                        <Card
                                            elevation={2}
                                            sx={{
                                                p: 3,
                                                pt: 4,
                                                height: '100%',
                                                textAlign: 'center',
                                                position: 'relative',
                                                overflow: 'visible',
                                                '&:hover': {
                                                    transform: 'translateY(-8px)',
                                                    boxShadow: 8,
                                                },
                                                transition: 'all 0.3s ease',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: -20,
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '50%',
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: '1.4rem',
                                                    boxShadow: 3,
                                                    zIndex: 10,
                                                }}
                                            >
                                                {step.step}
                                            </Box>
                                            <Box sx={{ mb: 2, mt: 2 }}>
                                                <IconComponent sx={{ fontSize: 50, color: 'primary.main' }} />
                                            </Box>
                                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                                {step.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {step.description}
                                            </Typography>
                                        </Card>
                                    </ScrollAnimation>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Container>
            </Box>

            {/* Platform Compatibility */}
            <Box sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Stack spacing={2} sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                            Disponível em Todas as Plataformas
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Use onde e quando quiser
                        </Typography>
                    </Stack>

                    <Grid container spacing={3}>
                        {platforms.map((platform, index) => {
                            const IconComponent = iconMap[platform.icon] || LanguageIcon;
                            return (
                                <Grid item xs={6} sm={4} md={2} key={index}>
                                    <ScrollAnimation animation="fadeIn" delay={index * 80}>
                                        <Paper
                                            elevation={2}
                                            sx={{
                                                p: 3,
                                                textAlign: 'center',
                                                height: '100%',
                                                '&:hover': {
                                                    transform: 'translateY(-4px) scale(1.03)',
                                                    boxShadow: 6,
                                                },
                                                transition: 'all 0.3s ease',
                                                opacity: platform.available ? 1 : 0.5,
                                            }}
                                        >
                                            <IconComponent sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                            <Typography variant="body2" fontWeight={600}>
                                                {platform.name}
                                            </Typography>
                                            {platform.available && (
                                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mt: 1 }} />
                                            )}
                                        </Paper>
                                    </ScrollAnimation>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Container>
            </Box>

            {/* Security Features */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper', position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Stack spacing={2} sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                            Segurança em Primeiro Lugar
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Seus dados protegidos com tecnologia de ponta
                        </Typography>
                    </Stack>

                    <Grid container spacing={3}>
                        {securityFeatures.map((feature, index) => {
                            const IconComponent = iconMap[feature.icon] || LockIcon;
                            return (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <ScrollAnimation animation="slideInUp" delay={index * 100}>
                                        <Card
                                            elevation={1}
                                            sx={{
                                                p: 3,
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                textAlign: 'center',
                                                '&:hover': {
                                                    transform: 'translateY(-8px)',
                                                    boxShadow: 4,
                                                },
                                                transition: 'all 0.3s ease',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: '50%',
                                                    bgcolor: alpha('#ef4444', 0.1),
                                                    mb: 2,
                                                }}
                                            >
                                                <IconComponent sx={{ fontSize: 35, color: '#ef4444' }} />
                                            </Box>
                                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                                {feature.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {feature.description}
                                            </Typography>
                                        </Card>
                                    </ScrollAnimation>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Container>
            </Box>

            {/* Testimonials */}
            <Box sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Stack spacing={2} sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                            O Que Dizem Nossos Usuários
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Milhares de pessoas já transformaram suas finanças
                        </Typography>
                    </Stack>
                    <TestimonialCarousel testimonials={testimonials} />
                </Container>
            </Box>

            {/* FAQ */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper', position: 'relative', zIndex: 1 }}>
                <Container maxWidth="md">
                    <Stack spacing={2} sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                            Perguntas Frequentes
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Tudo que você precisa saber
                        </Typography>
                    </Stack>

                    {faqItems.map((item, index) => (
                        <Accordion
                            key={index}
                            elevation={0}
                            sx={{
                                mb: 1,
                                '&:before': { display: 'none' },
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '8px !important',
                                '&:hover': {
                                    boxShadow: 2,
                                },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={600}>{item.question}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">{item.answer}</Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Container>
            </Box>

            {/* Final CTA */}
            <Box
                sx={{
                    py: { xs: 10, md: 14 },
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #2d1b69 0%, #5b21b6 50%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #a855f7 100%)',
                    position: 'relative',
                    zIndex: 1,
                    overflow: 'hidden',
                }}
            >
                <Container maxWidth="md">
                    <Stack spacing={4} alignItems="center" textAlign="center" sx={{ position: 'relative', zIndex: 2 }}>
                        <Typography
                            variant="h2"
                            fontWeight={800}
                            color="white"
                            sx={{ fontSize: { xs: '2rem', md: '3rem' } }}
                        >
                            Pronto para Transformar suas Finanças?
                        </Typography>
                        <Typography variant="h5" color="rgba(255,255,255,0.9)" sx={{ maxWidth: 600 }}>
                            Junte-se a mais de 50.000 usuários que já estão no controle do seu dinheiro
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleLoginClick}
                                sx={{
                                    px: 5,
                                    py: 2,
                                    fontSize: '1.2rem',
                                    bgcolor: 'white',
                                    color: 'primary.main',
                                    borderRadius: 50,
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.9)',
                                        transform: 'scale(1.05)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Começar Grátis Agora
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                sx={{
                                    px: 5,
                                    py: 2,
                                    fontSize: '1.2rem',
                                    borderColor: 'white',
                                    color: 'white',
                                    borderRadius: 50,
                                    '&:hover': {
                                        borderColor: 'white',
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                    },
                                }}
                            >
                                Falar com Vendas
                            </Button>
                        </Stack>
                    </Stack>
                </Container>

                {/* Decorative elements */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        filter: 'blur(60px)',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -100,
                        left: -100,
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        filter: 'blur(60px)',
                    }}
                />
            </Box>

            {/* Footer */}
            <Box sx={{ py: 6, borderTop: 1, borderColor: 'divider', position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ mb: 2 }}>
                                <Logo variant="full" width={160} />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                A ferramenta definitiva para gerenciamento financeiro pessoal e empresarial.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Recursos
                            </Typography>
                            <Stack spacing={1}>
                                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                    Dashboard
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                    Análises
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                    Relatórios
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                    Integrações
                                </Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Empresa
                            </Typography>
                            <Stack spacing={1}>
                                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                    Sobre Nós
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                    Contato
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                    Privacidade
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                    Termos de Uso
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 4 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            © {new Date().getFullYear()} Elynce - elynce.com.br. Todos os direitos reservados.
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                LGPD
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                Segurança
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                                Status
                            </Typography>
                        </Stack>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}
