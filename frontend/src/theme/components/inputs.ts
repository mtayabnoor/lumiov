import { type Theme, type Components, alpha } from '@mui/material/styles';

export const InputComponents = (theme: Theme): Components => {
  return {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 0,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.divider,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.action.hover,
          },
          '& .MuiMenuItem-root.Mui-selected': {
            backgroundColor: theme.palette.action.selected,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.action.selected,
          },
        },
        //input: { padding: '8px 12px' },
      },
    },
  };
};
