import { useState } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    useTheme,
    useMediaQuery,
    CssBaseline,
} from '@mui/material';
import {
    Brightness4,
    Brightness7,
    Logout,
    Dashboard as DashboardIcon,
    AccountBalanceWallet,
    Category,
    Flag,
    AttachMoney,
    EventRepeat,
    CompareArrows,
    Notifications,
    Menu as MenuIcon,
    ChevronLeft,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

interface DashboardLayoutProps {
    mode: 'light' | 'dark';
    onToggleTheme: () => void;
}

export default function DashboardLayout({ mode, onToggleTheme }: DashboardLayoutProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [open, setOpen] = useState(!isMobile);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { dashboardId } = useParams<{ dashboardId: string }>();
    const { user, logout } = useAuth();

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const menuItems = [
        { text: 'Visão Geral', icon: <DashboardIcon />, path: `/dashboard/${dashboardId}` },
        { text: 'Contas', icon: <AccountBalanceWallet />, path: `/dashboard/${dashboardId}/accounts` },
        { text: 'Categorias', icon: <Category />, path: `/dashboard/${dashboardId}/categories` },
        { text: 'Metas', icon: <Flag />, path: `/dashboard/${dashboardId}/goals` },
        { text: 'Orçamentos', icon: <AttachMoney />, path: `/dashboard/${dashboardId}/budgets` },
        { text: 'Recorrências', icon: <EventRepeat />, path: `/dashboard/${dashboardId}/recurrences` },
        { text: 'Transferências', icon: <CompareArrows />, path: `/dashboard/${dashboardId}/transfers` },
        { text: 'Alertas', icon: <Notifications />, path: `/dashboard/${dashboardId}/alerts` },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    background: mode === 'dark'
                        ? 'linear-gradient(120deg, #2d1b69 0%, #5b21b6 45%, #7c3aed 100%)'
                        : 'linear-gradient(120deg, #7c3aed 0%, #9333ea 50%, #a855f7 100%)',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        {open ? <ChevronLeft /> : <MenuIcon />}
                    </IconButton>

                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
                        FINANÇAS 360°
                    </Typography>

                    <IconButton color="inherit" onClick={onToggleTheme}>
                        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>

                    <IconButton
                        color="inherit"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ ml: 1 }}
                    >
                        <Avatar
                            src={user?.avatar}
                            alt={user?.name || user?.email}
                            sx={{ width: 32, height: 32 }}
                        >
                            {!user?.avatar && (user?.name?.[0] || user?.email?.[0] || '?').toUpperCase()}
                        </Avatar>
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                                {user?.name || 'Usuário'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {user?.email}
                            </Typography>
                        </Box>
                        <Divider />
                        <MenuItem onClick={() => navigate('/dashboards')}>
                            <ListItemIcon>
                                <DashboardIcon fontSize="small" />
                            </ListItemIcon>
                            Meus Dashboards
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setAnchorEl(null);
                                logout();
                                navigate('/login');
                            }}
                        >
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            Sair
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer
                variant={isMobile ? 'temporary' : 'persistent'}
                open={open}
                onClose={isMobile ? handleDrawerToggle : undefined}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    selected={location.pathname === item.path || (item.path !== `/dashboard/${dashboardId}` && location.pathname.startsWith(item.path))}
                                    onClick={() => {
                                        navigate(item.path);
                                        if (isMobile) setOpen(false);
                                    }}
                                >
                                    <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${open ? drawerWidth : 0}px)`, transition: theme.transitions.create('width') }}>
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
}
