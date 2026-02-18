import { type Theme, type Components } from '@mui/material/styles';

export const GlobalComponents = (theme: Theme): Components => {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${theme.palette.scrollbar.thumb} ${theme.palette.scrollbar.track}`,
          '&::-webkit-scrollbar': { width: 10, height: 10 },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 4,
            backgroundColor: theme.palette.scrollbar.thumb,
            border: `2px solid ${theme.palette.background.default}`, // Creates padding effect
            backgroundClip: 'content-box',
            '&:hover': {
              backgroundColor: theme.palette.scrollbar.thumbHover,
            },
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.scrollbar.track,
          },
        },
      },
    },
  };
};
