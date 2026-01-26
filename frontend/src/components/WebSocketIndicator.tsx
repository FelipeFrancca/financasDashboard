/**
 * WebSocket Status Indicator
 * Mostra o status da conexão WebSocket de forma discreta
 */

import { Box, Tooltip, keyframes } from '@mui/material';
import { Wifi, WifiOff, Sync } from '@mui/icons-material';
import { useDashboardSync } from '../hooks/useWebSocket';

interface WebSocketIndicatorProps {
    dashboardId?: string;
    showLabel?: boolean;
}

const pulse = keyframes`
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
`;

export default function WebSocketIndicator({ dashboardId, showLabel = false }: WebSocketIndicatorProps) {
    const { syncStatus } = useDashboardSync(dashboardId);

    const getStatusConfig = () => {
        switch (syncStatus) {
            case 'connected':
                return {
                    icon: <Wifi sx={{ fontSize: 16 }} />,
                    color: '#10B981',
                    label: 'Sincronizado',
                    tooltip: 'Conexão em tempo real ativa',
                };
            case 'connecting':
                return {
                    icon: <Sync sx={{ fontSize: 16, animation: `${pulse} 1.5s ease-in-out infinite` }} />,
                    color: '#F59E0B',
                    label: 'Conectando...',
                    tooltip: 'Estabelecendo conexão em tempo real',
                };
            case 'error':
                return {
                    icon: <WifiOff sx={{ fontSize: 16 }} />,
                    color: '#EF4444',
                    label: 'Erro',
                    tooltip: 'Erro na conexão. Tentando reconectar...',
                };
            default:
                return {
                    icon: <WifiOff sx={{ fontSize: 16 }} />,
                    color: '#6B7280',
                    label: 'Desconectado',
                    tooltip: 'Sem conexão em tempo real',
                };
        }
    };

    const config = getStatusConfig();

    // Não mostrar se não há dashboardId
    if (!dashboardId) {
        return null;
    }

    return (
        <Tooltip title={config.tooltip} arrow>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: config.color,
                    cursor: 'default',
                    transition: 'color 0.3s ease',
                }}
            >
                {config.icon}
                {showLabel && (
                    <Box
                        component="span"
                        sx={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                        }}
                    >
                        {config.label}
                    </Box>
                )}
            </Box>
        </Tooltip>
    );
}
