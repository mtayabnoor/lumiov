import { type Theme, type Components } from '@mui/material/styles';
import { GlobalComponents } from './globals';
import { InputComponents } from './inputs';
import { SurfaceComponents } from './surfaces';
import { DataDisplayComponents } from './dataDisplay';

export const getComponents = (theme: Theme): Components => ({
  ...GlobalComponents(theme),
  ...InputComponents(theme),
  ...SurfaceComponents(theme),
  ...DataDisplayComponents(theme),
});
