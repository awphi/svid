import {
  app,
  App,
  BrowserWindow,
  dialog,
  Event,
  FileFilter,
  ipcMain,
  IpcMainInvokeEvent,
  ipcRenderer,
  IpcRenderer,
  IpcRendererEvent,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  WebContents,
} from "electron";
import dirTree from "directory-tree";
import { DirectoryTree, DirectoryTreeOptions } from "directory-tree";
import express, { Router } from "express";
import cors from "cors";
import { Server } from "http";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

interface PreloadApiFunction {
  (event: IpcMainInvokeEvent, ...args: any[]): any;
}

interface SavedDirectoryTree {
  paths: string[];
  filters: FileFilter[];
}

const PORT = 8901;

const expressApp = express().use(
  cors({
    origin: "*",
  })
);

var fileServer: Server | undefined = undefined;

const fileRouter = Router();
expressApp.use("/files", fileRouter);

function buildPromiseMenu(template: Array<MenuItemConstructorOptions | MenuItem>): [Promise<string>, Menu] {
  var resolve: (value: Promise<string> | string) => void;

  const p = new Promise<string>((res, _) => {
    resolve = res;
  });

  const menu = Menu.buildFromTemplate(template);
  menu.items.forEach((i) => {
    const c = i.click;
    i.click = (event: KeyboardEvent, focusedWindow: BrowserWindow, focusedWebContents: WebContents) => {
      c(event, focusedWindow, focusedWebContents);
      resolve(i.id === undefined ? i.label.split(" ")[0].toLowerCase() : i.id);
    };
  });

  menu.addListener("menu-will-close", () => {
    setTimeout(() => resolve("close"), 10);
  });

  return [p, menu];
}

function getDirTrees(paths: string[], filters: FileFilter[]): DirectoryTree[] {
  const regexStr = filters.map((f) => f.extensions.join("|")).join("|");

  const opts: DirectoryTreeOptions = {
    attributes: ["extension", "type"],
    normalizePath: true,
    extensions: new RegExp(`\.${regexStr}$`),
  };

  return paths.map((path) => dirTree(path, opts));
}

async function selectDirectoryTrees(event: IpcMainInvokeEvent, filters: FileFilter[]): Promise<DirectoryTree[]> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Select Folder",
    filters,
    properties: ["openDirectory", "multiSelections"],
  });

  if (canceled) {
    return [];
  }

  return getDirTrees(filePaths, filters);
}

async function serveDirectoryTree(event: IpcMainInvokeEvent, tree: DirectoryTree) {
  const enc = encodeURI(tree.path);
  console.log("Serving:", `/files/${enc} =>`, tree.path);
  fileRouter.use(`/${enc}`, express.static(tree.path));
}

async function openSrcSelectorMenu(event: IpcMainInvokeEvent, x: number, y: number): Promise<string> {
  const [p, menu] = buildPromiseMenu([
    { label: "Delete from Menu", id: "delete" },
    {
      label: "Refresh Contents from Disk",
      id: "refresh",
    },
  ]);

  menu.popup({ x, y });

  return p;
}

async function loadSavedDirectoryTrees(
  event: IpcMainInvokeEvent,
  id: string,
  ext: string = "json"
): Promise<DirectoryTree[]> {
  const data = await fs.readFile(path.join(app.getPath("userData"), `${id}.${ext}`), { encoding: "utf-8" });
  const sdt = JSON.parse(data) as SavedDirectoryTree;

  return getDirTrees(sdt.paths, sdt.filters);
}

function saveDirectoryTrees(
  event: IpcMainInvokeEvent,
  id: string,
  paths: string[],
  filters: FileFilter[]
): Promise<void> {
  const data: SavedDirectoryTree = {
    paths,
    filters,
  };

  console.log(id, data);

  return fs.writeFile(path.join(app.getPath("userData"), `${id}.json`), JSON.stringify(data));
}

const API: { [name: string]: PreloadApiFunction } = {
  "dialog:selectDirectoryTrees": selectDirectoryTrees,
  "server:serveDirectoryTree": serveDirectoryTree,
  "menu:openSrcSelectorMenu": openSrcSelectorMenu,
  "storage:loadSavedDirectoryTrees": loadSavedDirectoryTrees,
  "storage:saveDirectoryTrees": saveDirectoryTrees,
};

export function registerApiListeners() {
  app.on("ready", () => {
    // Register ipcMain listeners
    Object.keys(API).forEach((k) => ipcMain.handle(k, API[k]));

    // Start local file server
    fileServer = expressApp.listen(PORT, () => {
      console.log(`Local express server started on :${PORT}`);
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      fileServer?.close();
    }
  });
}

export function groupApi(ipcRenderer: IpcRenderer) {
  const apiGrouped: { [name: string]: { [name: string]: (...args: any[]) => Promise<any> } } = {};

  Object.keys(API).forEach((k) => {
    const split = k.split(":");

    if (split.length !== 2) {
      console.error(`Malformed API key ${k} - must be in the form 'module:method'. Skipping...`);
      return;
    }

    if (!(split[0] in apiGrouped)) {
      apiGrouped[split[0]] = {};
    }

    apiGrouped[split[0]][split[1]] = (...args: any[]) => ipcRenderer.invoke(k, ...args);
  });

  return apiGrouped;
}
