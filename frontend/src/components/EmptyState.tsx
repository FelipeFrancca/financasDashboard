import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'contained' | 'outlined' | 'text';
  startIcon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'inherit';
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  sx?: SxProps<Theme>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actions = [],
  sx = {},
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 4,
        minHeight: 400,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(66, 66, 66, 0.3) 0%, rgba(33, 33, 33, 0.5) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 242, 245, 0.9) 100%)',
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        borderRadius: 2,
        ...sx,
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          fontSize: '80px',
          mb: 3,
          opacity: 0.6,
          animation: 'float 3s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-10px)' },
          },
        }}
      >
        {icon}
      </Box>

      {/* Title */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          mb: 1,
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          maxWidth: 500,
          mb: 4,
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>

      {/* Actions */}
      {actions.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'contained'}
              color={action.color || 'primary'}
              startIcon={action.startIcon}
              onClick={action.onClick}
              size="large"
              sx={{
                minWidth: 160,
                boxShadow: action.variant === 'contained' ? 2 : 0,
                '&:hover': {
                  boxShadow: action.variant === 'contained' ? 4 : 0,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default EmptyState;
