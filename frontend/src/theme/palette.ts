import { type PaletteMode } from '@mui/material';

// ----------------------------------------------------------------------
// 1. PRIMITIVES (The DNA)
// ----------------------------------------------------------------------
const COLORS = {
  dark: {
    background: '#212121',
    paper: '#212121',
    divider: '#383838ff',
    text: {
      primary: '#ffffffff',
      secondary: '#ffffffff',
      disabled: '#ffffffff',
    },
    action: {
      hover: '#313131ff',
      selected: '#494949ff',
    },
    components: {
      common: {
        border: {
          color: '#383838ff',
        },
        scrollbar: {
          thumb: '#7e7e7eff',
          track: '#131313',
          thumbHover: '#7e7e7eff',
        },
        tooltip: {
          background: '#131313',
          color: '#dcdcdc',
        },
        menu: {
          background: '#131313',
          color: '#dcdcdc',
          border: '#131313',
        },
      },
      appbar: { background: '#131313', border: '#131313' },
      drawer: { background: '#131313', border: '#131313' },
      table: {
        cell: {
          headerBackgroundColor: '#131313',
          headerColor: '#dcdcdc',
        },
        row: {
          hoverBackgroundColor: '#303030',
        },
      },
    },
  },
  light: {
    background: '#ffffff',
    paper: '#ffffff',
    divider: '#acaaaaff',
    text: {
      primary: '#000000',
      secondary: '#000000',
      disabled: '#000000',
    },
    action: {
      hover: '#c7c7c7ff',
      selected: '#ccccccff',
    },
    components: {
      common: {
        border: {
          color: '#f3f3f3',
        },
        scrollbar: {
          thumb: '#aeaeae',
          track: '#f3f3f3',
          thumbHover: '#919191ff',
        },
        tooltip: {
          background: '#f3f3f3',
          color: '#0e0e0eff',
        },
        menu: {
          background: '#f3f3f3',
          color: '#0e0e0eff',
          border: '#f3f3f3',
        },
      },
      appbar: { background: '#f3f3f3', border: '#f3f3f3' },
      drawer: { background: '#f3f3f3', border: '#f3f3f3' },
      table: {
        cell: {
          headerBackgroundColor: '#f3f3f3',
          headerColor: '#0e0e0eff',
        },
        row: {
          hoverBackgroundColor: '#dfdfdf',
        },
      },
    },
  },
  brand: {
    blue: '#0969da',
    green: '#1a7f37',
    contrastText: '#9b9b9bff',
  },
};

// ----------------------------------------------------------------------
// 2. SEMANTIC DEFINITIONS (The Logic)
// ----------------------------------------------------------------------

const getLightPalette = () => ({
  // Standard MUI
  primary: { main: COLORS.brand.blue, contrastText: COLORS.brand.contrastText },
  secondary: { main: COLORS.brand.green, contrastText: COLORS.brand.contrastText },
  background: {
    default: COLORS.light.background,
    paper: COLORS.light.paper,
  },
  text: {
    primary: COLORS.light.text.primary,
    secondary: COLORS.light.text.secondary,
    disabled: COLORS.light.text.disabled,
  },
  divider: COLORS.light.divider,
  action: {
    hover: COLORS.light.action.hover,
    selected: COLORS.light.action.selected,
  },

  components: {
    common: {
      border: {
        color: COLORS.light.components.common.border.color,
      },
      scrollbar: {
        thumb: COLORS.light.components.common.scrollbar.thumb,
        track: COLORS.light.components.common.scrollbar.track,
        thumbHover: COLORS.light.components.common.scrollbar.thumbHover,
      },
      tooltip: {
        background: COLORS.light.components.common.tooltip.background,
        color: COLORS.light.components.common.tooltip.color,
      },
      menu: {
        background: COLORS.light.components.common.menu.background,
        color: COLORS.light.components.common.menu.color,
        border: COLORS.light.components.common.menu.border,
      },
    },
    appbar: {
      background: COLORS.light.components.appbar.background,
      border: COLORS.light.components.appbar.border,
    },
    drawer: {
      background: COLORS.light.components.drawer.background,
      border: COLORS.light.components.drawer.border,
    },
    table: {
      cell: {
        headerBackgroundColor: COLORS.light.components.table.cell.headerBackgroundColor,
        headerColor: COLORS.light.components.table.cell.headerColor,
      },
      row: {
        hoverBackgroundColor: COLORS.light.components.table.row.hoverBackgroundColor,
      },
    },
  },
});

const getDarkPalette = () => ({
  // Standard MUI
  primary: { main: COLORS.brand.blue, contrastText: COLORS.brand.contrastText },
  secondary: { main: COLORS.brand.green, contrastText: COLORS.brand.contrastText },
  background: {
    default: COLORS.dark.background,
    paper: COLORS.dark.paper,
  },
  text: {
    primary: COLORS.dark.text.primary,
    secondary: COLORS.dark.text.secondary,
    disabled: COLORS.dark.text.disabled,
  },
  divider: COLORS.dark.divider,
  action: {
    hover: COLORS.dark.action.hover,
    selected: COLORS.dark.action.selected,
  },

  components: {
    common: {
      border: {
        color: COLORS.dark.components.common.border.color,
      },
      scrollbar: {
        thumb: COLORS.dark.components.common.scrollbar.thumb,
        track: COLORS.dark.components.common.scrollbar.track,
        thumbHover: COLORS.dark.components.common.scrollbar.thumbHover,
      },
      tooltip: {
        background: COLORS.dark.components.common.tooltip.background,
        color: COLORS.dark.components.common.tooltip.color,
      },
      menu: {
        background: COLORS.dark.components.common.menu.background,
        color: COLORS.dark.components.common.menu.color,
        border: COLORS.dark.components.common.menu.border,
      },
    },
    appbar: {
      background: COLORS.dark.components.appbar.background,
      border: COLORS.dark.components.appbar.border,
    },
    drawer: {
      background: COLORS.dark.components.drawer.background,
      border: COLORS.dark.components.drawer.border,
    },
    table: {
      cell: {
        headerBackgroundColor: COLORS.dark.components.table.cell.headerBackgroundColor,
        headerColor: COLORS.dark.components.table.cell.headerColor,
      },
      row: {
        hoverBackgroundColor: COLORS.dark.components.table.row.hoverBackgroundColor,
      },
    },
  },
});

export const getPalette = (mode: PaletteMode) => ({
  mode,
  ...(mode === 'dark' ? getDarkPalette() : getLightPalette()),
});
