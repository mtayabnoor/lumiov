// theme/dark.ts - VS Code Dark+ Theme
import { createTheme, alpha } from "@mui/material/styles";
import { baseTheme } from "./base";

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#0078d4", // VS Code Blue
      light: "#1c8cd6",
      dark: "#005a9e",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#3794ff", // VS Code Selection Blue
      contrastText: "#ffffff",
    },
    error: {
      main: "#f14c4c", // VS Code Error Red
      light: "#f85149",
      dark: "#cf222e",
    },
    warning: {
      main: "#cca700", // VS Code Warning Yellow
      light: "#e9c46a",
    },
    success: {
      main: "#3fb950", // VS Code Success Green
      light: "#56d364",
    },
    info: {
      main: "#58a6ff", // VS Code Info Blue
    },
    background: {
      default: "#1e1e1e", // VS Code Editor Background
      paper: "#252526", // VS Code Sidebar Background
    },
    text: {
      primary: "#cccccc", // VS Code Default Text
      secondary: "#9d9d9d", // VS Code Description Text
      disabled: "#6e6e6e",
    },
    divider: "#404040", // VS Code Panel Border
    action: {
      active: "#cccccc",
      hover: alpha("#ffffff", 0.08),
      selected: alpha("#ffffff", 0.12),
      disabled: "#6e6e6e",
      disabledBackground: alpha("#ffffff", 0.12),
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#4a4a4a transparent",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: 10,
            height: 10,
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 0,
            backgroundColor: "#4a4a4a",
            minHeight: 20,
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            {
              backgroundColor: "#5a5a5a",
            },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "transparent",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 400,
        },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none", // Remove default gradient
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#323233", // VS Code Title Bar
          color: "#cccccc",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#252526",
          borderRight: "1px solid #404040",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "#404040",
        },
        head: {
          backgroundColor: "#2d2d2d",
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: alpha("#ffffff", 0.04),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#cccccc",
          "&:hover": {
            backgroundColor: alpha("#ffffff", 0.08),
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: alpha("#0078d4", 0.2),
            "&:hover": {
              backgroundColor: alpha("#0078d4", 0.25),
            },
          },
          "&:hover": {
            backgroundColor: alpha("#ffffff", 0.05),
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#383838",
          color: "#cccccc",
          border: "1px solid #454545",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardError: {
          backgroundColor: alpha("#f14c4c", 0.15),
          color: "#f14c4c",
        },
        standardSuccess: {
          backgroundColor: alpha("#3fb950", 0.15),
          color: "#3fb950",
        },
        standardWarning: {
          backgroundColor: alpha("#cca700", 0.15),
          color: "#cca700",
        },
        standardInfo: {
          backgroundColor: alpha("#58a6ff", 0.15),
          color: "#58a6ff",
        },
      },
    },
  },
});
