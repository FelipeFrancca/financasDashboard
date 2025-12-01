import { ReactNode } from 'react';
import { Box, Skeleton, Stack, Card, CardContent } from '@mui/material';

interface LoadingSkeletonProps {
    variant?: 'card' | 'table' | 'list' | 'chart' | 'text';
    count?: number;
    height?: number | string;
    animate?: boolean;
}

/**
 * Componente de skeleton loading reutilizável
 */
export default function LoadingSkeleton({
    variant = 'card',
    count = 1,
    height,
    animate = true
}: LoadingSkeletonProps) {
    const animation = animate ? 'wave' : false;

    // Card Skeleton
    if (variant === 'card') {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                {Array.from({ length: count }).map((_, index) => (
                    <Card key={index}>
                        <CardContent>
                            <Skeleton animation={animation} variant="rectangular" height={140} sx={{ mb: 2, borderRadius: 2 }} />
                            <Skeleton animation={animation} variant="text" width="60%" height={32} sx={{ mb: 1 }} />
                            <Skeleton animation={animation} variant="text" width="100%" />
                            <Skeleton animation={animation} variant="text" width="80%" />
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <Skeleton animation={animation} variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                                <Skeleton animation={animation} variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        );
    }

    // Table Skeleton
    if (variant === 'table') {
        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Skeleton animation={animation} variant="text" width={200} height={40} />
                        <Skeleton animation={animation} variant="rectangular" width={120} height={36} sx={{ borderRadius: 2 }} />
                    </Box>
                    <Stack spacing={1}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', gap: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} animation={animation} variant="text" width="20%" height={24} />
                            ))}
                        </Box>
                        {/* Rows */}
                        {Array.from({ length: count }).map((_, rowIndex) => (
                            <Box key={rowIndex} sx={{ display: 'flex', gap: 2, py: 1 }}>
                                {Array.from({ length: 5 }).map((_, cellIndex) => (
                                    <Skeleton key={cellIndex} animation={animation} variant="text" width="20%" />
                                ))}
                            </Box>
                        ))}
                    </Stack>
                </CardContent>
            </Card>
        );
    }

    // List Skeleton
    if (variant === 'list') {
        return (
            <Stack spacing={2}>
                {Array.from({ length: count }).map((_, index) => (
                    <Card key={index}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Skeleton animation={animation} variant="circular" width={40} height={40} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton animation={animation} variant="text" width="40%" height={24} />
                                    <Skeleton animation={animation} variant="text" width="60%" />
                                </Box>
                                <Skeleton animation={animation} variant="rectangular" width={80} height={32} sx={{ borderRadius: 2 }} />
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        );
    }

    // Chart Skeleton
    if (variant === 'chart') {
        return (
            <Card>
                <CardContent>
                    <Skeleton animation={animation} variant="text" width={200} height={32} sx={{ mb: 2 }} />
                    <Skeleton
                        animation={animation}
                        variant="rectangular"
                        height={height || 300}
                        sx={{ borderRadius: 2 }}
                    />
                </CardContent>
            </Card>
        );
    }

    // Text Skeleton
    return (
        <Stack spacing={1}>
            {Array.from({ length: count }).map((_, index) => (
                <Skeleton
                    key={index}
                    animation={animation}
                    variant="text"
                    height={height || 20}
                    width={index === count - 1 ? '60%' : '100%'}
                />
            ))}
        </Stack>
    );
}

// Skeleton específico para métricas/cards de estatísticas
export function MetricCardSkeleton({ count = 4 }: { count?: number }) {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
            {Array.from({ length: count }).map((_, index) => (
                <Card key={index}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Skeleton variant="text" width="60%" height={24} />
                            <Skeleton variant="circular" width={40} height={40} />
                        </Box>
                        <Skeleton variant="text" width="80%" height={48} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="50%" height={20} />
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
}
