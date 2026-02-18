import { type Theme, type Components } from '@mui/material/styles';

export const SurfaceComponents = (theme: Theme): Components => {
  return {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 6,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, position: 'fixed' },
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default, // Dynamic
          color: theme.palette.text.primary,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          // Uses our new custom token!
          backgroundColor: theme.palette.sidebar.background,
          borderRight: `1px solid ${theme.palette.sidebar.border}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[3], // Use theme shadows
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          // Uses standard "grey[900]" equivalent or specific text color
          backgroundColor: theme.palette.text.primary,
          color: theme.palette.background.paper,
        },
      },
    },
  };
};
