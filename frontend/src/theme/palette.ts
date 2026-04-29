import { type PaletteMode } from '@mui/material';

// ----------------------------------------------------------------------
// Design Tokens — Global Color Primitives
// ----------------------------------------------------------------------

const BRAND = {
  blue: '#0969da',
  green: '#1a7f37',
};

const DARK = {
  background: { default: '#212121', paper: '#171717' },
  text: { primary: '#ececec', secondary: '#8e8e8e', disabled: '#555555' },
  divider: '#2e2e2e',
  action: {
    hover: 'rgba(255, 255, 255, 0.06)',
    selected: 'rgba(255, 255, 255, 0.10)',
    disabledBackground: 'rgba(255, 255, 255, 0.05)',
  },
};

const LIGHT = {
  background: { default: '#f8f8f8', paper: '#ffffff' },
  text: { primary: '#1a1a1a', secondary: '#6b6b6b', disabled: '#9e9e9e' },
  divider: '#e5e5e5',
  action: {
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabledBackground: 'rgba(0, 0, 0, 0.04)',
  },
};

// ----------------------------------------------------------------------
// Semantic Palette Builders
// ----------------------------------------------------------------------

const getSharedColors = () => ({
  primary: { main: BRAND.blue },
  secondary: { main: BRAND.green },
  error: { main: '#d32f2f' },
  warning: { main: '#ed6c02' },
  info: { main: '#0288d1' },
  success: { main: '#2e7d32' },
});

const getDarkPalette = () => ({
  ...getSharedColors(),
  background: DARK.background,
  text: DARK.text,
  divider: DARK.divider,
  action: DARK.action,
});

const getLightPalette = () => ({
  ...getSharedColors(),
  background: LIGHT.background,
  text: LIGHT.text,
  divider: LIGHT.divider,
  action: LIGHT.action,
});

export const getPalette = (mode: PaletteMode) => ({
  mode,
  ...(mode === 'dark' ? getDarkPalette() : getLightPalette()),
});
