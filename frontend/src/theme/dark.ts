// theme/dark.ts
import { createTheme } from "@mui/material/styles";
import { baseTheme } from "./base";

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#007fd4", // VS Code Blue
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#007fd4", // Keep consistent
    },
    background: {
      default: "#1f1f1f", // VS Code Editor Bg
      paper: "#252526", // VS Code Sidebar/Widget Bg
    },
    text: {
      primary: "#cccccc", // VS Code Default Text
      secondary: "#969696", // VS Code Description Text
    },
    divider: "#2b2b2b", // VS Code borders
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#424242 transparent",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: 10,
            height: 10,
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 0, // VS Code scrollbars are square
            backgroundColor: "#424242",
            minHeight: 20,
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            {
              backgroundColor: "#4f4f4f",
            },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "transparent",
          },
        },
      },
    },
  },
});
