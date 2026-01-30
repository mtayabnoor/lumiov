import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import updater from "electron-updater";
// ✅ Import the launcher
import { launchBackend, stopBackend } from "./backend-launcher.js";

const { autoUpdater } = updater;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let backendProcess: any = null;
const isDev = !app.isPackaged;

// Single Instance Lock
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      // ✅ Launch Backend (The launcher now handles the 'dist' path logic)
      backendProcess = await launchBackend(isDev);

      createWindow();

      if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    } catch (e: any) {
      console.error(e);
      // Show error popup so you know exactly what failed
      dialog.showErrorBox("Startup Error", e.message);
      app.quit();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: "#1a1a1a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.resolve(__dirname, "../../frontend/build/index.html"),
    );
  }
  mainWindow.webContents.openDevTools();
}

// Auto-updates
autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall();
});

// Cleanup
app.on("before-quit", async (e) => {
  if (backendProcess) {
    e.preventDefault();
    await stopBackend(backendProcess);
    backendProcess = null;
    app.quit();
  }
});

ipcMain.handle("get-platform", () => ({
  platform: process.platform,
  version: app.getVersion(),
}));
