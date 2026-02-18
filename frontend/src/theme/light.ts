import { createTheme, alpha } from '@mui/material/styles';
import { baseTheme, getThemedComponents } from './base';

const commonLightThemeColor = '#f6f8fa';

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#0969da', // Deep clear blue
      light: '#2188ff',
      dark: '#0550ae',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1a7f37', // Deep Green
      contrastText: '#ffffff',
    },
    error: {
      main: '#cf222e',
      light: '#ff5555',
    },
    warning: {
      main: '#9a6700',
      light: '#d4a72c',
    },
    success: {
      main: '#1a7f37',
      light: '#2da44e',
    },
    info: {
      main: '#0969da',
    },
    background: {
      default: '#f6f8fa', // Light gray background (Less glare than #ffffff)
      paper: '#ffffff', // Pure white cards
    },
    text: {
      primary: '#1f2328', // Soft black (Charcoal)
      secondary: '#656d76', // Slate gray
      disabled: '#8c959f',
    },
    divider: '#d0d7de',
    action: {
      active: '#24292f',
      hover: alpha('#0969da', 0.04),
      selected: alpha('#0969da', 0.08),
      disabled: '#8c959f',
      disabledBackground: alpha('#24292f', 0.12),
    },
  },
  // Call the function from base.ts
  components: getThemedComponents('light', commonLightThemeColor),
});
