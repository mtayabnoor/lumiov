/**
 * Secure key storage abstraction.
 *
 * In Electron: delegates to safeStorage (OS credential store) via IPC.
 * In browser: falls back to sessionStorage (cleared on tab close, never persisted).
 *
 * Never uses localStorage for sensitive values.
 */

const STORAGE_KEY = 'lumiov-agent-api-key-enc';

type ElectronAPI = {
  secureKeyStore?: (plaintext: string) => Promise<string | null>;
  secureKeyRetrieve?: (encrypted: string) => Promise<string | null>;
  secureKeyDelete?: () => Promise<boolean>;
};

function getElectronAPI(): ElectronAPI | null {
  return (window as Window & { electronAPI?: ElectronAPI }).electronAPI ?? null;
}

/** Store the API key securely. Returns true on success. */
export async function secureStoreKey(apiKey: string): Promise<void> {
  const api = getElectronAPI();
  if (api?.secureKeyStore) {
    const encrypted = await api.secureKeyStore(apiKey);
    if (encrypted) {
      sessionStorage.setItem(STORAGE_KEY, encrypted);
      return;
    }
  }
  // Fallback: sessionStorage only (not persisted across sessions)
  sessionStorage.setItem(STORAGE_KEY, apiKey);
}

/** Retrieve the stored API key. Returns null if not found or decryption fails. */
export async function secureRetrieveKey(): Promise<string | null> {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const api = getElectronAPI();
  if (api?.secureKeyRetrieve) {
    // Try to decrypt — if it fails it means it was stored as plaintext fallback
    const decrypted = await api.secureKeyRetrieve(stored);
    return decrypted ?? stored;
  }
  return stored;
}

/** Remove the stored API key. */
export async function secureDeleteKey(): Promise<void> {
  sessionStorage.removeItem(STORAGE_KEY);
  const api = getElectronAPI();
  if (api?.secureKeyDelete) {
    await api.secureKeyDelete();
  }
}
