import {
  type ThemeOptions,
  type Components,
  type Theme,
  type PaletteMode,
  alpha,
} from '@mui/material/styles';

// 1. Typography & Shape (Shared)
export const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: [
      '"Segoe WPC"',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'sans-serif',
    ].join(','),
    fontSize: 13,
    h1: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.4 },
    h4: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
    h5: { fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.5 },
    h6: {
      fontWeight: 600,
      fontSize: '0.85rem',
      lineHeight: 1.5,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    body1: { fontSize: '13px', lineHeight: 1.6 },
    body2: { fontSize: '12px', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 500, fontSize: '13px' },
    code: { fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '12px' }, // Custom typography variant
  } as any, // 'as any' allows custom variants if you add them to module augmentation
  shape: {
    borderRadius: 0, // Slightly softer than 2/4
  },
};

// 2. Shared Component Logic (The "Component Thing")
// We pass the 'mode' (light/dark) to customize subtle details automatically.
export const getThemedComponents = (
  mode: PaletteMode,
  commonDarkThemeColor: string,
): Components<Omit<Theme, 'components'>> => {
  const isDark = mode === 'dark';

  // Colors for scrollbars & borders based on mode
  const scrollbarColor = isDark ? '#424242' : '#d1d5db';
  const scrollbarHover = isDark ? '#585858' : '#9ca3af';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${scrollbarColor} transparent`,
          '&::-webkit-scrollbar': { width: 10, height: 10 },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 4,
            backgroundColor: scrollbarColor,
            border: '2px solid transparent',
            backgroundClip: 'content-box',
            '&:hover': { backgroundColor: scrollbarHover },
          },
          '&::-webkit-scrollbar-corner': { backgroundColor: 'transparent' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          '&:active': { boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${borderColor}`, // Adds subtle definition to cards
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        position: 'fixed',
      },
      styleOverrides: {
        root: {
          // borderBottom: `1px solid ${borderColor}`,
          backgroundColor: isDark ? commonDarkThemeColor : '#2a2c2eff', // Semantic background
          color: isDark ? '#f0f6fc' : '#1f2328',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? commonDarkThemeColor : '#f6f8fa', // Sidebar distinction
          borderRight: `1px solid ${borderColor}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${borderColor}`,
          padding: '8px 16px', // Denser data tables
        },
        head: {
          backgroundColor: isDark ? '#343536ff' : '#f6f8fa',
          fontWeight: 600,
          color: isDark ? '#8b949e' : '#57606a', // Muted headers
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? commonDarkThemeColor : '#f6f8fa',
          '&:hover': {
            backgroundColor: isDark ? alpha('#35383aff', 0.03) : alpha('#000000', 0.02),
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: borderColor,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark ? '#8b949e' : '#6e7781',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: isDark ? '#24292f' : '#24292f',
          color: '#ffffff',
          border: `1px solid ${alpha('#ffffff', 0.1)}`,
          fontSize: '0.75rem',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? commonDarkThemeColor : '#f6f8fa',
          color: isDark ? '#f0f6fc' : '#1f2328',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: isDark ? '#f0f6fc' : '#1f2328',
          backgroundColor: isDark ? commonDarkThemeColor : '#f6f8fa',
        },
      },
    },
  };
};
