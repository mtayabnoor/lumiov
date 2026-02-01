"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// electron/preload.cts
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    getPlatform: () => electron_1.ipcRenderer.invoke("get-platform"),
    onUpdateAvailable: (callback) => electron_1.ipcRenderer.on("update-available", (_event, value) => callback(value)),
    onUpdateDownloaded: (callback) => electron_1.ipcRenderer.on("update-downloaded", (_event, value) => callback(value)),
});
