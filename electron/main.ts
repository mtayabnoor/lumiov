import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import updater from "electron-updater";
import { UpdateDownloadedEvent } from "electron-updater";
import { launchBackend, stopBackend } from "./backend-launcher.js";

app.disableHardwareAcceleration();

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
  let iconPath;
  if (isDev) {
    iconPath = path.join(__dirname, "../../../frontend/public/lumiov.ico");
  } else {
    iconPath = path.join(process.resourcesPath, "lumiov.ico");
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    icon: iconPath,
    backgroundColor: "#1a1a1a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow!.show();
  });

  if (isDev) {
    mainWindow.loadFile(
      path.resolve(__dirname, "../../../frontend/dist/index.html"),
    );
    mainWindow.webContents.openDevTools();
  } else {
    // In production, files are packaged in the asar archive
    // __dirname is inside app.asar/electron/dist/electron/
    // frontend/dist is at app.asar/frontend/dist/
    mainWindow.loadFile(
      path.join(__dirname, "..", "..", "..", "frontend", "dist", "index.html"),
    );
  }
}

// Auto-updates
autoUpdater.on("update-downloaded", (info: UpdateDownloadedEvent) => {
  // Ensure we have a valid string for the message
  const releaseNotes =
    typeof info.releaseNotes === "string"
      ? info.releaseNotes
      : "New features and bug fixes.";
  const messageText =
    process.platform === "win32" ? releaseNotes : info.releaseName;

  const dialogOpts = {
    type: "info" as const,
    buttons: ["Restart", "Later"],
    title: "Application Update",
    // ✅ The '||' ensures that if messageText is null/undefined, we use the backup string
    message: messageText || "A new version is available.",
    detail:
      "A new version has been downloaded. Restart the application to apply the updates.",
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
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
