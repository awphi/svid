import dirTree, { DirectoryTree, DirectoryTreeOptions } from "directory-tree";
import {
  BrowserWindow,
  FileFilter,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  WebContents,
} from "electron";
import fs from "fs/promises";
import { EventEmitter } from "events";
import { constants as fsConstants } from "fs";
import express, { type Express } from "express";
import { pathToFileURL } from "url";
import cors from "cors";

export const ee = new EventEmitter();
export const expressApp: Express = express();

expressApp.use(cors());

export function getDirTreesInternal(
  filters: FileFilter[],
  paths: string[],
): DirectoryTree[] {
  const regexStr = filters.map((f) => f.extensions.join("|")).join("|");

  const opts: DirectoryTreeOptions = {
    attributes: ["extension", "type"],
    normalizePath: true,
    extensions: new RegExp(`\.${regexStr}$`),
  };

  return paths.map((path) => dirTree(path, opts));
}

export function buildPromiseMenu(
  template: Array<MenuItemConstructorOptions | MenuItem>,
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
      focusedWebContents: WebContents,
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

export async function serveDirectoryTreeInternal(path: string): Promise<void> {
  await fs.access(path, fsConstants.F_OK);
  const url = pathToFileURL(path);
  console.log(`Serving: ${path} @ http://localhost:8901/files${url.pathname}`);
  expressApp.use(`/files${url.pathname}`, express.static(path));
  const watcher = fs.watch(path, {
    recursive: true,
  });
  for await (const _event of watcher) {
    ee.emit("treeChanged", path);
  }
}
