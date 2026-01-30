// electron/main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import updater from "electron-updater";
import { spawn } from "child_process";

const { autoUpdater } = updater;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let backendProcess: any = null;

// --- 1. PREVENT DOUBLE WINDOWS ---
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
    startBackend();
    createWindow();

    // Check for updates ONLY in production
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
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
      // POINT TO THE COMPILED .cjs FILE
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // ROBUST PATH FOR PRODUCTION
    mainWindow.loadFile(
      path.resolve(__dirname, "../../frontend/build/index.html"),
    );
  }
}

function startBackend() {
  if (app.isPackaged) {
    // In prod, launch the compiled backend from resources
    const backendPath = path.join(
      process.resourcesPath,
      "backend",
      "dist",
      "server.js",
    );
    // Using 'node' directly assuming it's bundled or available,
    // or better: spawn the binary if you packaged it.
    // For now, this assumes node is available or bundled.
    backendProcess = spawn("node", [backendPath], { stdio: "inherit" });
  } else {
    console.log("Dev mode: Backend managed by 'concurrently'");
  }
}

// --- AUTO UPDATE EVENTS ---
autoUpdater.on("update-downloaded", () => {
  // Silent install and restart
  autoUpdater.quitAndInstall();
});

// --- CLEANUP ---
app.on("before-quit", () => {
  if (backendProcess) backendProcess.kill();
});

ipcMain.handle("get-platform", () => ({
  platform: process.platform,
  version: app.getVersion(),
}));
