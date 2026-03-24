import { createTheme, type PaletteMode, type Theme, alpha } from '@mui/material/styles';
import { getPalette } from './palette';
import { typography } from './typography';
import './types';

export const getAppTheme = (mode: PaletteMode): Theme => {
  const palette = getPalette(mode);

  const baseTheme = createTheme({ palette, typography, shape: { borderRadius: 8 } });

  // Centralized component overrides — all in one place
  baseTheme.components = {
    // --- Global Baseline ---
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${baseTheme.palette.text.disabled} transparent`,
          '&::-webkit-scrollbar': { width: 8, height: 8 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: baseTheme.palette.text.disabled,
            borderRadius: 4,
            '&:hover': { backgroundColor: baseTheme.palette.text.secondary },
          },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        },
      },
    },

    // --- Surfaces ---
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${baseTheme.palette.divider}`,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, position: 'fixed' },
      styleOverrides: {
        root: {
          backgroundColor: baseTheme.palette.background.paper,
          borderBottom: `1px solid ${baseTheme.palette.divider}`,
          color: baseTheme.palette.text.primary,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: baseTheme.palette.background.paper,
          borderRight: `1px solid ${baseTheme.palette.divider}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: baseTheme.palette.background.paper,
          border: `1px solid ${baseTheme.palette.divider}`,
          boxShadow: baseTheme.shadows[8],
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'dark' ? '#2a2a2a' : '#333',
          color: mode === 'dark' ? baseTheme.palette.text.primary : '#fff',
          fontSize: '0.75rem',
          border: `1px solid ${baseTheme.palette.divider}`,
        },
      },
    },

    // --- Inputs ---
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: baseTheme.palette.divider,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: baseTheme.palette.text.disabled,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: baseTheme.palette.primary.main,
          },
        },
      },
    },

    // --- Navigation ---
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: baseTheme.shape.borderRadius,
          '&.Mui-selected': {
            backgroundColor: baseTheme.palette.action.selected,
          },
          '&.Mui-selected:hover': {
            backgroundColor: alpha(baseTheme.palette.primary.main, 0.15),
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 36, color: baseTheme.palette.text.secondary },
      },
    },

    // --- Data Display ---
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${baseTheme.palette.divider}`,
          padding: '10px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: baseTheme.palette.background.paper,
          color: baseTheme.palette.text.secondary,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: baseTheme.palette.action.hover },
          '&.Mui-selected': {
            backgroundColor: baseTheme.palette.action.selected,
            '&:hover': {
              backgroundColor: alpha(baseTheme.palette.primary.main, 0.12),
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
  };

  return baseTheme;
};
