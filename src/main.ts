import electronReload from "electron-reload";
electronReload(__dirname, {});

import path from "path";
import { app, BrowserWindow, ipcMain } from "electron";
import { API, expressApp } from "./api";
import { Server } from "http";

const PORT = 8901;

var server: Server | undefined = undefined;

const isDev: boolean = process.env.IS_DEV == "true" ? true : false;

function createWindow(): void {
  server = expressApp.listen(PORT, () => {
    console.log(`Local express server started on :${PORT}`);
  });

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    title: "sVid",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      devTools: isDev,
    },
  });

  mainWindow.loadURL(isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../out/ui/index.html")}`);

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Register ipcMain hooks
  Object.keys(API).forEach((k) => {
    ipcMain.handle(k, API[k]);
  });

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    server?.close();
    app.quit();
  }
});
