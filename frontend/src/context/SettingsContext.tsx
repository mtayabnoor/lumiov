import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AppSettings {
  deleteEnabled: boolean;
  changeClusterContextEnabed: boolean;
}

interface SettingsContextType extends AppSettings {
  setDeleteEnabled: (enabled: boolean) => void;
  setChangeClusterContextEnabed: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

const STORAGE_KEY = 'lumiov-settings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { deleteEnabled: false, changeClusterContextEnabed: false, ...parsed };
    }
  } catch {
    // Corrupted storage — fall back to defaults
  }
  return { deleteEnabled: false, changeClusterContextEnabed: false };
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const setDeleteEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, deleteEnabled: enabled };
      saveSettings(next);
      return next;
    });
  }, []);

  const setChangeClusterContextEnabed = useCallback((enabled: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, changeClusterContextEnabed: enabled };
      saveSettings(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setDeleteEnabled,
        setChangeClusterContextEnabed,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
