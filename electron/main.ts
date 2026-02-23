import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import updater from 'electron-updater';
import { UpdateDownloadedEvent } from 'electron-updater';
import { launchBackend, stopBackend } from './backend-launcher.js';

const { autoUpdater } = updater;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let backendProcess: any = null;
let isQuitting = false;
const isDev = !app.isPackaged;

// ─── Auto-updater Configuration ───
autoUpdater.autoDownload = false; // Don't download automatically, ask first
autoUpdater.autoInstallOnAppQuit = true;

// Single Instance Lock
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      // ✅ Launch Backend
      backendProcess = await launchBackend(isDev);

      await runPreLaunchChecks();

      createWindow();

      if (app.isPackaged) {
        // Check for updates after a short delay so the app feels ready
        setTimeout(() => autoUpdater.checkForUpdates(), 3000);
      }
    } catch (e: any) {
      console.error(e);
      dialog.showErrorBox('Startup Error', e.message);
      app.quit();
    }
  });
}

async function runPreLaunchChecks() {
  return new Promise<void>((resolve) => {
    const appRoot = path.resolve(app.getAppPath(), '..');
    splashWindow = new BrowserWindow({
      width: 500,
      height: 350,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'preload.cjs'),
      },
    });

    if (isDev) {
      splashWindow.loadFile(path.join(appRoot, 'frontend', 'public', 'splash.html'));
    } else {
      splashWindow.loadFile(
        path.join(process.resourcesPath, 'frontend', 'public', 'splash.html'),
      );
    }

    let retryInterval: NodeJS.Timeout;
    let isRetrying = false;

    const checkHealth = () => {
      if (isRetrying) return;
      http
        .get('http://localhost:3030/health', (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.k8sConnected) {
                clearInterval(retryInterval);
                splashWindow?.close();
                resolve();
              } else {
                splashWindow?.webContents.send(
                  'splash-status',
                  parsed.k8sState,
                  parsed.k8sError,
                );
              }
            } catch (e) {
              // parse error
            }
          });
        })
        .on('error', () => {
          splashWindow?.webContents.send(
            'splash-status',
            'INITIALIZING',
            'Starting backend services...',
          );
        });
    };

    ipcMain.on('splash-retry', () => {
      isRetrying = true;
      splashWindow?.webContents.send(
        'splash-status',
        'INITIALIZING',
        'Retrying connection...',
      );

      const req = http.request(
        { hostname: 'localhost', port: 3030, path: '/api/k8s/retry', method: 'POST' },
        (res) => {
          isRetrying = false;
          checkHealth();
        },
      );
      req.on('error', () => {
        isRetrying = false;
        checkHealth();
      });
      req.end();
    });

    ipcMain.on('splash-close', () => {
      app.quit();
    });

    retryInterval = setInterval(checkHealth, 2000);
    setTimeout(checkHealth, 500); // Initial fast check
  });
}

function createWindow() {
  const appRoot = path.resolve(app.getAppPath(), '..');

  let iconPath;
  if (isDev) {
    iconPath = path.join(appRoot, 'frontend', 'public', 'lumiov.ico');
  } else {
    iconPath = path.join(process.resourcesPath, 'frontend', 'public', 'lumiov.ico');
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    icon: iconPath,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
  });

  if (isDev) {
    mainWindow.loadFile(path.join(appRoot, 'frontend', 'dist', 'index.html'));
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(process.resourcesPath, 'frontend', 'dist', 'index.html'),
    );
  }
}

// ═══════════════ Auto-Update Flow ═══════════════
// Step 1: Update found → ask user if they want to download
autoUpdater.on('update-available', (info) => {
  if (!mainWindow) return;

  const version = info.version || 'unknown';

  dialog
    .showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (v${version}) is available.`,
      detail:
        'Would you like to download it now? The download happens in the background — you can keep working.',
      buttons: ['Download', 'Skip'],
      defaultId: 0,
      cancelId: 1,
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
});

// Step 2: Download progress → send to renderer (optional: show in title bar)
autoUpdater.on('download-progress', (progress) => {
  const percent = Math.round(progress.percent);
  if (mainWindow) {
    mainWindow.setTitle(`Lumiov — Downloading update ${percent}%`);
    mainWindow.setProgressBar(percent / 100);
  }
});

// Step 3: Download complete → ask to restart
// Step 3: Download complete → ask to restart
autoUpdater.on('update-downloaded', (info: UpdateDownloadedEvent) => {
  if (!mainWindow) return;

  // Reset title bar
  mainWindow.setTitle('Lumiov');
  mainWindow.setProgressBar(-1); // Remove progress bar

  dialog
    .showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail:
        'A restart is required to apply the new update. Would you like to restart now?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    })
    .then(async (result) => {
      if (result.response === 0) {
        // Gracefully stop backend before restarting
        isQuitting = true;
        if (backendProcess) {
          await stopBackend(backendProcess);
          backendProcess = null;
        }
        autoUpdater.quitAndInstall(false, true);
      }
    });
});

autoUpdater.on('error', (err) => {
  console.error('Auto-update error:', err);
});

// ─── Cleanup ───
app.on('before-quit', async (e) => {
  if (backendProcess && !isQuitting) {
    e.preventDefault();
    isQuitting = true;
    await stopBackend(backendProcess);
    backendProcess = null;
    app.quit();
  }
});

ipcMain.handle('get-platform', () => ({
  platform: process.platform,
  version: app.getVersion(),
}));
