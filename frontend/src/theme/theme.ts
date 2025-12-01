import { createTheme, ThemeOptions, responsiveFontSizes } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    income: Palette['primary'];
    expense: Palette['primary'];
    net: Palette['primary'];
    gradients: {
      auth: string;
      primary: string;
      secondary: string;
    };
  }

  interface PaletteOptions {
    income?: PaletteOptions['primary'];
    expense?: PaletteOptions['primary'];
    net?: PaletteOptions['primary'];
    gradients?: {
      auth: string;
      primary: string;
      secondary: string;
    };
  }
}

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
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
          primary: 'linear-gradient(120deg, #7c3aed 0%, #9333ea 50%, #a855f7 100%)',
          secondary: 'linear-gradient(120deg, #0ea5e9 0%, #06b6d4 50%, #22d3ee 100%)',
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
          auth: 'linear-gradient(135deg, #0a0118 0%, #1e0f35 100%)',
          primary: 'linear-gradient(120deg, #2d1b69 0%, #5b21b6 45%, #7c3aed 100%)',
          secondary: 'linear-gradient(120deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
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
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(155, 109, 255, 0.3)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '0.9375rem',
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
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: mode === 'dark'
            ? '1px solid rgba(139, 92, 246, 0.15)'
            : '1px solid rgba(15, 23, 42, 0.08)',
        },
        head: {
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateX(4px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'dark'
            ? '0 1px 3px rgba(0, 0, 0, 0.5)'
            : '0 1px 3px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
});

export const createAppTheme = (mode: 'light' | 'dark') => {
  const theme = createTheme(getDesignTokens(mode));
  return responsiveFontSizes(theme, {
    breakpoints: ['sm', 'md', 'lg'],
    factor: 2,
  });
};
