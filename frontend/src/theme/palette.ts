import { type PaletteMode, alpha } from '@mui/material';

// ----------------------------------------------------------------------
// 1. PRIMITIVES (The DNA)
// ----------------------------------------------------------------------
const COLORS = {
  slate: {
    50: '#f8fafc', // Very subtle grey (Paper)
    100: '#f1f5f9', // App Background
    200: '#e2e8f0', // Borders
    300: '#cbd5e1', // Disabled
    400: '#94a3b8',
    500: '#64748b', // Icons
    600: '#475569',
    700: '#334155', // Text Primary
    800: '#1e293b', // Tooltips
    900: '#0f172a',
  },
  dark: {
    bg: '#1e1e1e', // VS Code Main
    paper: '#252526', // VS Code Sidebar
    border: '#333333',
    text: '#cccccc',
  },
  brand: {
    blue: '#0969da',
    green: '#1a7f37',
  },
};

// ----------------------------------------------------------------------
// 2. SEMANTIC DEFINITIONS (The Logic)
// ----------------------------------------------------------------------

const getLightPalette = () => ({
  // Standard MUI
  primary: { main: COLORS.brand.blue, contrastText: '#fff' },
  secondary: { main: COLORS.brand.green, contrastText: '#fff' },
  background: {
    default: COLORS.slate[100], // Light Grey Canvas
    paper: '#ffffff', // Pure White Cards
  },
  text: {
    primary: COLORS.slate[900],
    secondary: COLORS.slate[500],
    disabled: COLORS.slate[300],
  },
  divider: COLORS.slate[200],
  action: {
    hover: alpha(COLORS.slate[500], 0.08),
    selected: alpha(COLORS.slate[500], 0.16),
  },

  // Custom Semantic Tokens
  neutral: { main: COLORS.slate[200], dark: COLORS.slate[200], light: COLORS.slate[50] },
  sidebar: {
    background: COLORS.slate[50], // Slightly off-white for sidebar
    border: COLORS.slate[200],
  },
  scrollbar: {
    thumb: COLORS.slate[300],
    thumbHover: COLORS.slate[400],
    track: 'transparent',
  },
});

const getDarkPalette = () => ({
  // Standard MUI
  primary: { main: '#007acc', contrastText: '#fff' }, // VS Code Blue
  secondary: { main: COLORS.brand.green, contrastText: '#fff' },
  background: {
    default: COLORS.dark.bg,
    paper: COLORS.dark.bg, // In dark mode, paper blends more
  },
  text: {
    primary: COLORS.dark.text,
    secondary: alpha(COLORS.dark.text, 0.7),
    disabled: alpha(COLORS.dark.text, 0.5),
  },
  divider: COLORS.dark.border,
  action: {
    hover: alpha('#fff', 0.04),
    selected: alpha('#fff', 0.08),
  },

  // Custom Semantic Tokens
  neutral: { main: COLORS.dark.paper, dark: '#000', light: '#333' },
  sidebar: {
    background: COLORS.dark.paper,
    border: COLORS.dark.border,
  },
  scrollbar: {
    thumb: '#424242',
    thumbHover: '#585858',
    track: 'transparent',
  },
});

export const getPalette = (mode: PaletteMode) => ({
  mode,
  ...(mode === 'dark' ? getDarkPalette() : getLightPalette()),
});
