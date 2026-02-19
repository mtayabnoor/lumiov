import { type ThemeOptions } from '@mui/material/styles';

const FONT_PRIMARY = [
  '"Segoe WPC"',
  'Inter',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'sans-serif',
].join(',');

export const typography: ThemeOptions['typography'] = {
  fontFamily: FONT_PRIMARY,
  fontSize: 13,
  htmlFontSize: 16,
  fontWeightRegular: 50,
  fontWeightMedium: 500,
  fontWeightBold: 500,
  h1: { fontWeight: 500, fontSize: '2rem', lineHeight: 1.2 },
  h2: { fontWeight: 500, fontSize: '1.5rem', lineHeight: 1.3 },
  h3: { fontWeight: 500, fontSize: '1.25rem', lineHeight: 1.4 },
  h4: { fontWeight: 500, fontSize: '1rem', lineHeight: 1.5 },
  h5: { fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.5 },
  h6: {
    fontWeight: 500,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  body1: { fontSize: '1rem', lineHeight: 1.5 },
  body2: { fontSize: '0.95rem', lineHeight: 1.5 },
  button: { textTransform: 'none', fontWeight: 500 },
};
