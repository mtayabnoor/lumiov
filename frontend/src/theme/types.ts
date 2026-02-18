// Extend the Palette interface to add our custom semantic groups
declare module '@mui/material/styles' {
  interface Palette {
    neutral: {
      main: string;
      dark: string;
      light: string;
    };
    sidebar: {
      background: string;
      border: string;
    };
    scrollbar: {
      thumb: string;
      track: string;
      thumbHover: string;
    };
  }

  interface PaletteOptions {
    neutral?: {
      main: string;
      dark: string;
      light: string;
    };
    sidebar?: {
      background: string;
      border: string;
    };
    scrollbar?: {
      thumb: string;
      track: string;
      thumbHover: string;
    };
  }
}
