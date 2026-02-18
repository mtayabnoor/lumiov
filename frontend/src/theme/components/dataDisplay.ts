import { type Theme, type Components, alpha } from '@mui/material/styles';

export const DataDisplayComponents = (theme: Theme): Components => {
  return {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${theme.palette.divider}`,
          padding: '8px 16px',
        },
        head: {
          fontWeight: 600,
          // Using our custom semantic token
          backgroundColor: theme.palette.neutral.main,
          color: theme.palette.text.secondary,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            // Uses standard action hover
            backgroundColor: theme.palette.action.hover,
          },
          '&.Mui-selected': {
            backgroundColor: theme.palette.action.selected,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
            },
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
        },
      },
    },
  };
};
