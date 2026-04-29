// electron/preload.cts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  onUpdateAvailable: (callback: (value: unknown) => void) =>
    ipcRenderer.on('update-available', (_event, value) => callback(value)),
  onUpdateDownloaded: (callback: (value: unknown) => void) =>
    ipcRenderer.on('update-downloaded', (_event, value) => callback(value)),
  onSplashStatus: (callback: (status: string, errorMsg?: string) => void) =>
    ipcRenderer.on('splash-status', (_event, status, errorMsg) =>
      callback(status, errorMsg),
    ),
  retryInit: () => ipcRenderer.send('splash-retry'),
  closeApp: () => ipcRenderer.send('splash-close'),
  // Secure key storage backed by OS credential store (safeStorage)
  secureKeyStore: (plaintext: string): Promise<string | null> =>
    ipcRenderer.invoke('secure-key-store', plaintext),
  secureKeyRetrieve: (encrypted: string): Promise<string | null> =>
    ipcRenderer.invoke('secure-key-retrieve', encrypted),
  secureKeyDelete: (): Promise<boolean> =>
    ipcRenderer.invoke('secure-key-delete'),
});
