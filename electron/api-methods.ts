import {
  app,
  BrowserWindow,
  dialog,
  type FileFilter,
  type IpcMainInvokeEvent,
  Menu,
  MenuItem,
  type MenuItemConstructorOptions,
  shell,
  type WebContents,
} from "electron";
import dirTree from "directory-tree";
import type { DirectoryTree, DirectoryTreeOptions } from "directory-tree";
import express, { Router } from "express";
import fs from "fs/promises";
import { constants as fsConstants } from "fs";
import path from "path";
import type { APIMethodsDefs, PreloadApiFunction } from "./api";
import { path as audiowaveformPath } from "@audiowaveform-installer/audiowaveform";
import ffmpegPath from "ffmpeg-static";
import Ffmpeg from "fluent-ffmpeg";
import { spawn } from "child_process";
import type { JsonWaveformData } from "waveform-data";

interface SavedDirectoryTree {
  paths: string[];
  filters: FileFilter[];
}

function buildPromiseMenu(
  template: Array<MenuItemConstructorOptions | MenuItem>
): [Promise<string>, Menu] {
  var resolve: (value: Promise<string> | string) => void;

  const p = new Promise<string>((res, _) => {
    resolve = res;
  });

  const menu = Menu.buildFromTemplate(template);
  menu.items.forEach((i) => {
    const c = i.click;
    i.click = (
      event: KeyboardEvent,
      focusedWindow: BrowserWindow,
      focusedWebContents: WebContents
    ) => {
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

async function selectDirectoryTrees(
  event: IpcMainInvokeEvent,
  filters: FileFilter[]
): Promise<DirectoryTree[]> {
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

async function openContextMenu(
  event: IpcMainInvokeEvent,
  items: Electron.MenuItemConstructorOptions[],
  x: number,
  y: number
): Promise<string> {
  const [p, menu] = buildPromiseMenu(items);
  menu.popup({ x, y });
  return p;
}

async function showItemInFolder(
  event: IpcMainInvokeEvent,
  path: string
): Promise<void> {
  shell.openExternal(path);
}

async function loadSavedDirectoryTrees(
  event: IpcMainInvokeEvent,
  id: string,
  ext = "json"
): Promise<DirectoryTree[]> {
  const data = await fs.readFile(
    path.join(app.getPath("userData"), `${id}.${ext}`),
    { encoding: "utf-8" }
  );
  console.log(data);
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

  const pth = path.join(app.getPath("userData"), `${id}.json`);
  console.log("Saving trees:", pth, data);

  return fs.writeFile(pth, JSON.stringify(data));
}

function getBinaryPathInAsar(path: string): string {
  // Ensure we access the unpacked binaries if app is packaged
  return app.isPackaged ? path.replace("app.asar", "app.asar.unpacked") : path;
}

async function decodeAudioDataFromPath(
  event: IpcMainInvokeEvent,
  filePath: string,
  pxpersecond: number
): Promise<any> {
  return new Promise<JsonWaveformData>((res) => {
    let tick = Date.now();

    // Spawn the audiowaveform child process
    // audiowaveform needs 'brew install libsndfile libgd libmad libid3tag' on macOS
    const proc = spawn(getBinaryPathInAsar(audiowaveformPath), [
      "--input-file",
      "-",
      "--input-format",
      "wav",
      "--output-format",
      "json",
      "--output-file",
      "-",
      "--quiet",
      "--pixels-per-second",
      String(pxpersecond),
    ]);

    // Spawn the ffmpeg command - use wav as its uncompressed so very fast to decode
    Ffmpeg()
      .setFfmpegPath(getBinaryPathInAsar(ffmpegPath!))
      .input(filePath)
      .audioChannels(1)
      .addOption("-map", "a")
      .format("wav")
      .noVideo()
      .pipe(proc.stdin, { end: true });

    const bufs: Buffer[] = [];
    proc.stdout.on("data", (b: Buffer) => bufs.push(b));
    proc.on("exit", async () => {
      console.log("waveform done in", Date.now() - tick);
      const json = JSON.parse(Buffer.concat(bufs).toString("utf-8"));
      res(json);
    });
  });
}

export function makeAPIMethodDefs(
  fileRouter: Router | undefined,
  mainWindow: BrowserWindow | undefined
): APIMethodsDefs {
  async function serveDirectoryTree(
    event: IpcMainInvokeEvent,
    path: string
  ): Promise<void> {
    const enc = encodeURI(path);
    await fs.access(path, fsConstants.F_OK);
    console.log(`Serving tree: /files/${enc} @ ${path}`);
    fileRouter!.use(
      enc.startsWith("/") ? enc : "/" + enc,
      express.static(path)
    );
    const watcher = fs.watch(path, {
      recursive: true,
    });
    for await (const event of watcher) {
      mainWindow!.webContents.send("treeChanged", path);
    }
  }

  return {
    dialog: {
      selectDirectoryTrees,
      showItemInFolder,
    },
    server: {
      serveDirectoryTree,
    },
    menu: {
      openContextMenu,
    },
    storage: {
      saveDirectoryTrees,
      loadSavedDirectoryTrees,
      getDirTrees: (_, paths, filters) => getDirTrees(paths, filters),
    },
    audio: {
      decodeAudioDataFromPath,
    },
  };
}

export function makeAPIMethodMap(apiMethodDefs: APIMethodsDefs): {
  [name: string]: PreloadApiFunction;
} {
  const apiMethodMap: { [name: string]: PreloadApiFunction } = {};
  Object.keys(apiMethodDefs).forEach((k1) => {
    const section = k1 as keyof APIMethodsDefs;
    Object.keys(apiMethodDefs[section]).forEach(
      (k2) => (apiMethodMap[k1 + ":" + k2] = apiMethodDefs[section][k2])
    );
  });
  return apiMethodMap;
}
