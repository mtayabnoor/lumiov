import { createTheme, type PaletteMode, type Theme } from '@mui/material/styles';
import { getPalette } from './palette';
import { typography } from './typography';
import './types'; // Import types extension (currently empty)

export const getAppTheme = (mode: PaletteMode): Theme =>
  createTheme({
    palette: getPalette(mode),
    typography,
    shape: { borderRadius: 8 },
  });
