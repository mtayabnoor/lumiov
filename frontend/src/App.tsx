import { useEffect } from 'react';
import { initSocket, closeSocket } from './services/bootstrap';
import { AppRoutes } from './routes';
import { ThemeProvider } from './context/ThemeContext';
import { AgentProvider } from './context/AgentContext';
import { ErrorProvider } from './context/ErrorContext';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  useEffect(() => {
    initSocket();
    return () => closeSocket();
  }, []);

  return (
    <ThemeProvider>
      <ErrorProvider>
        <SettingsProvider>
          <AgentProvider>
            <AppRoutes />
          </AgentProvider>
        </SettingsProvider>
      </ErrorProvider>
    </ThemeProvider>
  );
}

export default App;
