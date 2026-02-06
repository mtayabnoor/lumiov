import { useEffect } from "react";
import { initSocket, closeSocket } from "./services/bootstrap";
import { AppRoutes } from "./routes";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  useEffect(() => {
    initSocket();
    return () => closeSocket();
  }, []);

  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
