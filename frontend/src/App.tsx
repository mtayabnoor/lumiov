import { useEffect } from 'react';
import { initSocket, closeSocket } from './services/bootstrap';
import { AppRoutes } from './routes';
import { ThemeProvider } from './context/ThemeContext';
import { AgentProvider } from './context/AgentContext';

function App() {
  useEffect(() => {
    initSocket();
    return () => closeSocket();
  }, []);

  return (
    <ThemeProvider>
      <AgentProvider>
        <AppRoutes />
      </AgentProvider>
    </ThemeProvider>
  );
}

export default App;
