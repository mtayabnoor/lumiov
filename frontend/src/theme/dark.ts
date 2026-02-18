import { createTheme, alpha } from '@mui/material/styles';
import { baseTheme, getThemedComponents } from './base';

const commonDarkThemeColor = '#232425ff';

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#58a6ff', // GitHub Blue (Softer than #0078d4)
      light: '#79c0ff',
      dark: '#1f6feb',
      contrastText: '#0d1117',
    },
    secondary: {
      main: '#3fb950', // Use Green as secondary for "Running/Healthy" vibes
      contrastText: '#0d1117',
    },
    error: {
      main: '#f85149', // Softer red
      light: '#ff7b72',
      dark: '#da3633',
    },
    warning: {
      main: '#d29922', // Golden amber
      light: '#e3b341',
    },
    success: {
      main: '#238636',
      light: '#3fb950',
    },
    info: {
      main: '#58a6ff',
    },
    background: {
      default: commonDarkThemeColor, // Deep blue-black (Less harsh than #1e1e1e)
      paper: commonDarkThemeColor, // Slightly lighter surface
    },
    text: {
      primary: '#e6edf3', // Off-white (eases contrast strain)
      secondary: '#8b949e', // Blue-gray muted text
      disabled: '#484f58',
    },
    divider: '#30363d', // Subtle border
    action: {
      active: '#e6edf3',
      hover: alpha('#e6edf3', 0.08),
      selected: alpha('#58a6ff', 0.12),
      disabled: '#484f58',
      disabledBackground: alpha('#e6edf3', 0.12),
    },
  },
  // Call the function from base.ts
  components: getThemedComponents('dark', commonDarkThemeColor),
});
