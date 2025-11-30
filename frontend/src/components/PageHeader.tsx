import { Box, Typography, Button, Breadcrumbs, Link as MuiLink, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';

interface PageHeaderProps {
    title: string;
    breadcrumbs?: { label: string; to?: string }[];
    actionLabel?: string;
    onAction?: () => void;
    actionIcon?: React.ReactNode;
}

export default function PageHeader({
    title,
    breadcrumbs = [],
    actionLabel,
    onAction,
    actionIcon = <AddIcon />
}: PageHeaderProps) {
    const theme = useTheme();

    return (
        <Box sx={{ mb: 4 }}>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                    sx={{ mb: 2 }}
                >
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return isLast ? (
                            <Typography key={index} color="text.primary" fontWeight={500}>
                                {crumb.label}
                            </Typography>
                        ) : (
                            <MuiLink
                                key={index}
                                component={RouterLink}
                                to={crumb.to || '#'}
                                underline="hover"
                                color="inherit"
                            >
                                {crumb.label}
                            </MuiLink>
                        );
                    })}
                </Breadcrumbs>
            )}

            {/* Title and Action */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Typography variant="h4" component="h1" fontWeight={700} sx={{
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, #fff 30%, #a78bfa 90%)'
                        : 'linear-gradient(45deg, #1e293b 30%, #7c3aed 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    {title}
                </Typography>

                {actionLabel && onAction && (
                    <Button
                        variant="contained"
                        startIcon={actionIcon}
                        onClick={onAction}
                        sx={{
                            px: 3,
                            background: theme.palette.gradients?.auth || theme.palette.primary.main
                        }}
                    >
                        {actionLabel}
                    </Button>
                )}
            </Box>
        </Box>
    );
}
