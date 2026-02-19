// Extend the Palette interface to add our custom semantic groups
declare module '@mui/material/styles' {
  interface Palette {
    components: {
      common: {
        border: {
          color: string;
        };
        scrollbar: {
          thumb: string;
          track: string;
          thumbHover: string;
        };
        tooltip: {
          background: string;
          color: string;
        };
        menu: {
          background: string;
          color: string;
          border: string;
        };
      };
      appbar: { background: string; border: string };
      drawer: {
        background: string;
        border: string;
      };
      table: {
        cell: {
          headerBackgroundColor: string;
          headerColor: string;
        };
        row: {
          hoverBackgroundColor: string;
        };
      };
    };
  }

  interface PaletteOptions {
    components?: {
      common?: {
        border?: {
          color: string;
        };
        scrollbar?: {
          thumb: string;
          track: string;
          thumbHover: string;
        };
        tooltip?: {
          background: string;
          color: string;
        };
        menu?: {
          background: string;
          color: string;
          border: string;
        };
      };
      appbar?: { background: string; border: string };
      drawer?: {
        background: string;
        border: string;
      };
      table?: {
        cell: {
          headerBackgroundColor: string;
          headerColor: string;
        };
        row: {
          hoverBackgroundColor: string;
        };
      };
    };
  }
}
