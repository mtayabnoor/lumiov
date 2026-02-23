// electron/preload.cts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  onUpdateAvailable: (callback: any) =>
    ipcRenderer.on('update-available', (_event, value) => callback(value)),
  onUpdateDownloaded: (callback: any) =>
    ipcRenderer.on('update-downloaded', (_event, value) => callback(value)),
  onSplashStatus: (callback: any) =>
    ipcRenderer.on('splash-status', (_event, status, errorMsg) =>
      callback(status, errorMsg),
    ),
  retryInit: () => ipcRenderer.send('splash-retry'),
  closeApp: () => ipcRenderer.send('splash-close'),
});
