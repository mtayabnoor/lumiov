// theme/dark.ts
import { createTheme } from "@mui/material/styles";
import { baseTheme } from "./base";

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#60a5fa", // softer blue for dark bg
    },
    secondary: {
      main: "#f472b6",
    },
    background: {
      default: "#38393bff", // app background
      paper: "#4a4b4dff", // cards / drawers
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#475569 #020617",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#020617",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#475569",
            minHeight: 24,
            border: "3px solid #020617",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            {
              backgroundColor: "#64748b",
            },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "#020617",
          },
        },
      },
    },
  },
});
