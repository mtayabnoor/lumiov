import { type Theme, type Components } from '@mui/material/styles';

export const GlobalComponents = (theme: Theme): Components => {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${theme.palette.components.common.scrollbar.thumb} ${theme.palette.components.common.scrollbar.track}`,
          '&::-webkit-scrollbar': { width: 10, height: 10 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.components.common.scrollbar.thumb,
            border: `2px solid ${theme.palette.components.common.border.color}`,
            backgroundClip: 'content-box',
            '&:hover': {
              backgroundColor: theme.palette.components.common.scrollbar.thumbHover,
            },
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.components.common.scrollbar.track,
          },
        },
      },
    },
  };
};
