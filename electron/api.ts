import {
  app,
  BrowserWindow,
  type FileFilter,
  ipcMain,
  type IpcMainInvokeEvent,
  type IpcRenderer,
} from "electron";
import type { DirectoryTree } from "directory-tree";
import express, { Router } from "express";
import cors from "cors";
import type { Server } from "http";
import { makeAPIMethodDefs, makeAPIMethodMap } from "./api-methods";
import type { JsonWaveformData } from "waveform-data";

// Types
export interface PreloadApiFunction {
  (event: IpcMainInvokeEvent, ...args: any[]): any;
}

export interface API {
  dialog: {
    selectDirectoryTrees(filters: FileFilter[]): Promise<DirectoryTree[]>;
    showItemInFolder(path: string): Promise<void>;
  };
  server: {
    serveDirectoryTree(path: string): Promise<void>;
  };
  menu: {
    openContextMenu(
      items: Electron.MenuItemConstructorOptions[],
      x: number,
      y: number
    ): Promise<string>;
  };
  storage: {
    loadSavedDirectoryTrees(
      id: string,
      ext?: string
    ): Promise<(DirectoryTree | null)[]>;
    saveDirectoryTrees(
      id: string,
      paths: string[],
      filters: FileFilter[]
    ): Promise<void>;
    getDirTrees(
      paths: string[],
      filters: FileFilter[]
    ): Promise<DirectoryTree[]>;
  };
  audio: {
    decodeAudioDataFromPath(
      url: string,
      pxpersecond: number
    ): Promise<JsonWaveformData>;
  };
  on(
    ev: "treeChanged",
    handler: (treePath: string) => void | Promise<void>
  ): void;
  off(
    eventName: string | symbol,
    listener: (...args: any[]) => void | Promise<void>
  ): void;
}

export type APIMethodsDefs = Omit<
  { [P in keyof API]: { [name: string]: PreloadApiFunction } },
  "on" | "off"
>;

// Makes a file server, a real method map and registers some listeners on ipcMain to watch for invocations from the renderer
export function makeApiMain(window: BrowserWindow): void {
  // File server
  const PORT = 8901;
  const expressApp = express().use(
    cors({
      origin: "*",
    })
  );
  var fileServer: Server | undefined = undefined;
  const fileRouter = Router();
  expressApp.use("/files", fileRouter);

  // Start api on main proc
  const apiMethodMap = makeAPIMethodMap(makeAPIMethodDefs(fileRouter, window));

  // Register ipcMain listeners
  Object.entries(apiMethodMap).forEach(([k, v]) => {
    ipcMain.handle(k, v);
  });

  // Start local file server
  fileServer = expressApp.listen(PORT, () => {
    console.log(`Local express server started on :${PORT}`);
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      fileServer?.close();
    }
  });
}

// We make a dummy map of "section:method" -> function ensuring to never calling any of these functions as they are for the main process only
// then, take those keys and build a vararg function to invoke the ipcRenderer with "section:method"
// It's quite ugly but it works and TypeScript enforces some relative safety.
export function makeApiRenderer(ipcRenderer: IpcRenderer): API {
  // Some types for building up the API from the method map
  type APISection = { [name: string]: (...args: any[]) => Promise<any> };
  type APIEventListener = (
    ev: string,
    handler: (...args: any) => void | Promise<void>
  ) => void;
  type PartialAPI = {
    [name in keyof API]: APISection | APIEventListener;
  };

  const apiMethodMap = makeAPIMethodMap(
    makeAPIMethodDefs(undefined, undefined)
  );
  const apiGrouped: PartialAPI = Object.create(null);

  // Register methods as invokers
  Object.keys(apiMethodMap).forEach((k) => {
    const split = k.split(":");
    const key = split[0] as keyof API;

    let section = apiGrouped[key] as APISection;
    if (section === undefined) {
      section = Object.create(null);
      apiGrouped[key] = section;
    }

    section[split[1]] = (...args: any[]) => ipcRenderer.invoke(k, ...args);
  });

  // Register the event listeners on/off
  // We wrap the ipcRenderer.on/off methods in no return functions AND we strip off the first arg from their handlers to avoid exposing ipcRenderer to the window
  apiGrouped.on = (e, h) => {
    ipcRenderer.on(e, (_, ...args) => {
      h(...args);
    });
  };
  apiGrouped.off = (e, h) => {
    ipcRenderer.off(e, h);
  };

  return apiGrouped as API;
}
