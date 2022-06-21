import { App, dialog, FileFilter, ipcMain, IpcMainInvokeEvent, IpcRenderer, Menu, MenuItem } from "electron";
import dirTree from "directory-tree";
import { DirectoryTree, DirectoryTreeOptions } from "directory-tree";
import express, { Router } from "express";
import cors from "cors";

interface PreloadApiFunction {
  (event: IpcMainInvokeEvent, ...args: any[]): any;
}

var folderItemMenu: Menu | undefined;

export const expressApp = express().use(
  cors({
    origin: "*",
  })
);

const fileRouter = Router();
expressApp.use("/files", fileRouter);

function fileFiltersToRegex(filters: FileFilter[], includeDot: boolean = false): RegExp {
  const regexStr = filters.map((f) => f.extensions.join("|")).join("|");
  return new RegExp(`\.${regexStr}$`);
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

  const opts: DirectoryTreeOptions = {
    attributes: ["extension", "type"],
    normalizePath: true,
    extensions: fileFiltersToRegex(filters),
  };

  return filePaths.map((path) => dirTree(path, opts));
}

async function serveDirectoryTree(event: IpcMainInvokeEvent, tree: DirectoryTree) {
  const enc = encodeURI(tree.path);
  console.log("Serving:", `/files/${enc} =>`, tree.path);
  fileRouter.use(`/${enc}`, express.static(tree.path));
}

const openSrcSelectorMenu: PreloadApiFunction = async function (
  event: IpcMainInvokeEvent,
  x: number,
  y: number,
  dirPath: string
) {
  // TODO on click send ipc event bacck to renderer process to delete tree with dirPath
  folderItemMenu?.popup({ x, y });
};

const API: { [name: string]: PreloadApiFunction } = {
  "dialog:selectDirectoryTrees": selectDirectoryTrees,
  "server:serveDirectoryTree": serveDirectoryTree,
  "menu:openSrcSelectorMenu": openSrcSelectorMenu,
};

export function registerApiListeners(app: App) {
  app.on("ready", () => {
    // Register ipcMain listeners
    Object.keys(API).forEach((k) => ipcMain.handle(k, API[k]));

    folderItemMenu = Menu.buildFromTemplate([
      new MenuItem({ label: "Delete", click: console.log }),
      new MenuItem({ label: "Refresh", click: console.log }),
    ]);
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
