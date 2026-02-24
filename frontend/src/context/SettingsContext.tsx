import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ─── Settings Shape ────────────────────────────────────────────
// Extend this interface as new settings are added

interface AppSettings {
  deleteEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  deleteEnabled: false, // Safe default — user must opt in
};

const STORAGE_KEY = 'lumiov-settings';

// ─── Context ───────────────────────────────────────────────────

interface SettingsContextType extends AppSettings {
  setDeleteEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

// ─── Provider ──────────────────────────────────────────────────

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Corrupted storage — fall back to defaults
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const setDeleteEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, deleteEnabled: enabled };
      saveSettings(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setDeleteEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
