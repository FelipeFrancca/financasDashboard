import { createTheme, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    income: Palette['primary'];
    expense: Palette['primary'];
    net: Palette['primary'];
    gradients: {
      auth: string;
    };
  }

  interface PaletteOptions {
    income?: PaletteOptions['primary'];
    expense?: PaletteOptions['primary'];
    net?: PaletteOptions['primary'];
    gradients?: {
      auth: string;
    };
  }
}

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
        // Tema Claro
        primary: {
          main: '#7c3aed',
          light: '#a78bfa',
          dark: '#6d28d9',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#0ea5e9',
          light: '#38bdf8',
          dark: '#0284c7',
        },
        background: {
          default: '#f8fafc',
          paper: '#ffffff',
        },
        text: {
          primary: '#1e293b',
          secondary: '#475569',
        },
        income: {
          main: '#059669',
          light: '#34d399',
          dark: '#047857',
          contrastText: '#ffffff',
        },
        expense: {
          main: '#dc2626',
          light: '#f87171',
          dark: '#b91c1c',
          contrastText: '#ffffff',
        },
        net: {
          main: '#2563eb',
          light: '#60a5fa',
          dark: '#1d4ed8',
          contrastText: '#ffffff',
        },
        divider: 'rgba(15, 23, 42, 0.12)',
        gradients: {
          auth: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
      }
      : {
        // Tema Escuro
        primary: {
          main: '#9b6dff',
          light: '#b794ff',
          dark: '#7c3aed',
          contrastText: '#0a0118',
        },
        secondary: {
          main: '#60a5fa',
          light: '#93c5fd',
          dark: '#3b82f6',
        },
        background: {
          default: '#0a0118',
          paper: '#1e0f35',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#cbd5e1',
        },
        income: {
          main: '#34d399',
          light: '#6ee7b7',
          dark: '#059669',
          contrastText: '#0a0118',
        },
        expense: {
          main: '#f87171',
          light: '#fca5a5',
          dark: '#dc2626',
          contrastText: '#0a0118',
        },
        net: {
          main: '#60a5fa',
          light: '#93c5fd',
          dark: '#2563eb',
          contrastText: '#0a0118',
        },
        divider: 'rgba(139, 92, 246, 0.25)',
        gradients: {
          auth: 'linear-gradient(135deg, #0a0118 0%, #1e0f35 100%)', // Adjusted for dark mode
        },
      }),
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(155, 109, 255, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.4)'
            : '0 1px 3px rgba(0, 0, 0, 0.06)',
          border: mode === 'dark'
            ? '1px solid rgba(139, 92, 246, 0.25)'
            : '1px solid rgba(15, 23, 42, 0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme(getDesignTokens(mode));
};
