import { type PaletteMode } from '@mui/material';

// ----------------------------------------------------------------------
// Design Tokens — Global Color Primitives
// ----------------------------------------------------------------------

const BRAND = {
  blue: '#0969da',
  green: '#1a7f37',
};

const LIGHT = {
  background: { default: '#ffffff', paper: '#f5f5f5' },
  text: { primary: '#1a1a1a', secondary: '#555555', disabled: '#9e9e9e' },
  divider: '#e0e0e0',
  action: { hover: 'rgba(0, 0, 0, 0.04)', selected: 'rgba(0, 0, 0, 0.08)' },
};

const DARK = {
  background: { default: '#121212', paper: '#1e1e1e' },
  text: { primary: '#e0e0e0', secondary: '#a0a0a0', disabled: '#616161' },
  divider: '#2e2e2e',
  action: { hover: 'rgba(255, 255, 255, 0.06)', selected: 'rgba(255, 255, 255, 0.10)' },
};

// ----------------------------------------------------------------------
// Semantic Palette Builders
// ----------------------------------------------------------------------

const getLightPalette = () => ({
  primary: { main: BRAND.blue },
  secondary: { main: BRAND.green },
  background: LIGHT.background,
  text: LIGHT.text,
  divider: LIGHT.divider,
  action: LIGHT.action,
});

const getDarkPalette = () => ({
  primary: { main: BRAND.blue },
  secondary: { main: BRAND.green },
  background: DARK.background,
  text: DARK.text,
  divider: DARK.divider,
  action: DARK.action,
});

export const getPalette = (mode: PaletteMode) => ({
  mode,
  ...(mode === 'dark' ? getDarkPalette() : getLightPalette()),
});
