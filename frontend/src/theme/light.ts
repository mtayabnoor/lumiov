// theme/light.ts - VS Code Light+ Theme
import { createTheme, alpha } from "@mui/material/styles";
import { baseTheme } from "./base";

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "light",
    primary: {
      main: "#0078d4", // VS Code Blue
      light: "#1c8cd6",
      dark: "#005a9e",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#005fb8", // VS Code Selection Blue (Light)
      contrastText: "#ffffff",
    },
    error: {
      main: "#d32f2f", // Error Red
      light: "#ef5350",
      dark: "#c62828",
    },
    warning: {
      main: "#bf8700", // VS Code Warning Yellow (Light)
      light: "#f9a825",
    },
    success: {
      main: "#1a7f37", // VS Code Success Green (Light)
      light: "#2da44e",
    },
    info: {
      main: "#0969da", // VS Code Info Blue (Light)
    },
    background: {
      default: "#ffffff", // VS Code Editor Background
      paper: "#f3f3f3", // VS Code Sidebar Background
    },
    text: {
      primary: "#1f1f1f", // VS Code Dark Text
      secondary: "#6e6e6e", // VS Code Description Text
      disabled: "#a0a0a0",
    },
    divider: "#e0e0e0", // VS Code Panel Border
    action: {
      active: "#1f1f1f",
      hover: alpha("#000000", 0.04),
      selected: alpha("#000000", 0.08),
      disabled: "#a0a0a0",
      disabledBackground: alpha("#000000", 0.12),
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#c1c1c1 transparent",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: 10,
            height: 10,
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 0,
            backgroundColor: "#c1c1c1",
            minHeight: 20,
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            {
              backgroundColor: "#a8a8a8",
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
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0078d4", // VS Code Blue Title Bar (Light)
          color: "#ffffff",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#f3f3f3",
          borderRight: "1px solid #e0e0e0",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "#e8e8e8",
        },
        head: {
          backgroundColor: "#f8f8f8",
          fontWeight: 600,
          color: "#1f1f1f",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: alpha("#000000", 0.02),
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
          color: "#616161",
          "&:hover": {
            backgroundColor: alpha("#000000", 0.04),
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: alpha("#0078d4", 0.12),
            "&:hover": {
              backgroundColor: alpha("#0078d4", 0.18),
            },
          },
          "&:hover": {
            backgroundColor: alpha("#000000", 0.04),
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#616161",
          color: "#ffffff",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardError: {
          backgroundColor: alpha("#d32f2f", 0.1),
          color: "#d32f2f",
        },
        standardSuccess: {
          backgroundColor: alpha("#1a7f37", 0.1),
          color: "#1a7f37",
        },
        standardWarning: {
          backgroundColor: alpha("#bf8700", 0.1),
          color: "#bf8700",
        },
        standardInfo: {
          backgroundColor: alpha("#0969da", 0.1),
          color: "#0969da",
        },
      },
    },
  },
});
