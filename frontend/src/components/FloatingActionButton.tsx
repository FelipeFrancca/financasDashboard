import { ReactNode } from 'react';
import { Fab, Zoom, SpeedDial, SpeedDialAction, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useResponsive } from '../hooks/useResponsive';

interface FloatingActionButtonProps {
    onClick?: () => void;
    icon?: ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    showOnDesktop?: boolean;
    actions?: Array<{
        icon: ReactNode;
        name: string;
        onClick: () => void;
    }>;
}

/**
 * Floating Action Button - aparece principalmente em mobile
 * Com suporte para Speed Dial (múltiplas ações)
 */
export default function FloatingActionButton({
    onClick,
    icon = <AddIcon />,
    color = 'primary',
    showOnDesktop = false,
    actions,
}: FloatingActionButtonProps) {
    const theme = useTheme();
    const { isMobile } = useResponsive();

    // Só mostra em mobile por padrão, ou sempre se showOnDesktop for true
    const shouldShow = isMobile || showOnDesktop;

    if (!shouldShow) return null;

    // Se tem ações, usa SpeedDial
    if (actions && actions.length > 0) {
        return (
            <Zoom in={shouldShow} timeout={theme.transitions.duration.enteringScreen}>
                <SpeedDial
                    ariaLabel="Ações rápidas"
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 16, sm: 24 },
                        right: { xs: 16, sm: 24 },
                        zIndex: theme.zIndex.fab,
                    }}
                    icon={icon}
                    FabProps={{
                        color,
                    }}
                >
                    {actions.map((action) => (
                        <SpeedDialAction
                            key={action.name}
                            icon={action.icon}
                            tooltipTitle={action.name}
                            onClick={action.onClick}
                            FabProps={{
                                sx: {
                                    boxShadow: 3,
                                    '&:hover': {
                                        transform: 'scale(1.1)',
                                    },
                                },
                            }}
                        />
                    ))}
                </SpeedDial>
            </Zoom>
        );
    }

    // FAB simples
    return (
        <Zoom in={shouldShow} timeout={theme.transitions.duration.enteringScreen}>
            <Fab
                color={color}
                aria-label="add"
                onClick={onClick}
                sx={{
                    position: 'fixed',
                    bottom: { xs: 16, sm: 24 },
                    right: { xs: 16, sm: 24 },
                    zIndex: theme.zIndex.fab,
                    boxShadow: 6,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: 12,
                    },
                    '&:active': {
                        transform: 'scale(0.95)',
                    },
                }}
            >
                {icon}
            </Fab>
        </Zoom>
    );
}
