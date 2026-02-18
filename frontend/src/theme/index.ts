import { createTheme, type PaletteMode, type Theme } from '@mui/material/styles';
import { getPalette } from './palette';
import { typography } from './typography';
import { getComponents } from './components';
import './types'; // Important: Import types extension

export const getAppTheme = (mode: PaletteMode): Theme => {
  const palette = getPalette(mode);

  // 1. Create Base Theme with Colors & Typography
  const baseTheme = createTheme({
    palette,
    typography,
    shape: { borderRadius: 4 },
  });

  // 2. Inject Components (Now they rely 100% on baseTheme variables)
  baseTheme.components = getComponents(baseTheme);

  return baseTheme;
};
