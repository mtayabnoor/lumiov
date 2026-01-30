import { useEffect, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { initSocket, closeSocket } from "./services/bootstrap";
import { AppRoutes } from "./routes";
import { lightTheme } from "./theme/light";
import { darkTheme } from "./theme/dark";

function App() {
  useEffect(() => {
    // Initialize persistent socket connection
    initSocket();

    return () => {
      // Optional: close socket on unmount if needed
      closeSocket();
    };
  }, []);

  //const [mode, _setMode] = useState<"light" | "dark">("dark");
  const mode = "dark";
  const theme = useMemo(
    () => (mode === "dark" ? darkTheme : lightTheme),
    [mode],
  );
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
