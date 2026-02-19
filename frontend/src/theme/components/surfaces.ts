import { type Theme, type Components } from '@mui/material/styles';

export const SurfaceComponents = (theme: Theme): Components => {
  return {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          //border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          color: theme.palette.background.paper,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, position: 'fixed' },
      styleOverrides: {
        root: {
          //borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.components.appbar.background, // Dynamic
          //color: theme.palette.components.appbar.color,
          borderColor: theme.palette.components.appbar.border,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          // Uses our new custom token!
          backgroundColor: theme.palette.components.drawer.background,
          //borderRight: `1px solid ${theme.palette.sidebar.border}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.palette.components.common.menu.background,
          border: `1px solid ${theme.palette.components.common.menu.border}`,
          boxShadow: theme.shadows[3], // Use theme shadows
          color: theme.palette.components.common.menu.color,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          // Uses standard "grey[900]" equivalent or specific text color
          backgroundColor: theme.palette.components.common.tooltip.background,
          color: theme.palette.components.common.tooltip.color,
        },
      },
    },
  };
};
