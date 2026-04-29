import { type ThemeOptions } from '@mui/material/styles';

const FONT_PRIMARY = ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'].join(',');

export const typography: ThemeOptions['typography'] = {
  fontFamily: FONT_PRIMARY,
  fontSize: 13,
  htmlFontSize: 16,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 },
  h2: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.3 },
  h3: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.4 },
  h4: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
  h5: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
  h6: {
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  body1: { fontSize: '0.875rem', lineHeight: 1.6 },
  body2: { fontSize: '0.8125rem', lineHeight: 1.6 },
  button: { textTransform: 'none', fontWeight: 500, fontSize: '0.8125rem' },
  caption: { fontSize: '0.75rem', lineHeight: 1.5 },
  overline: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};
