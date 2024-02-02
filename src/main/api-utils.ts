import { spawn } from "child_process";
import dirTree, { DirectoryTree, DirectoryTreeOptions } from "directory-tree";
import {
  BrowserWindow,
  FileFilter,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  WebContents,
} from "electron";
import Ffmpeg from "fluent-ffmpeg";
import { JsonWaveformData } from "waveform-data";
import fs from "fs/promises";
import { EventEmitter } from "events";
import { constants as fsConstants } from "fs";
import express, { type Express } from "express";
import { pathToFileURL } from "url";
import cors from "cors";
import { binaries } from "./audiowaveform-recoder";

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

export async function decodeAudioDataFromPathInternal(
  filePath: string,
  pxpersecond: number,
): Promise<JsonWaveformData> {
  return new Promise<JsonWaveformData>((res) => {
    let tick = Date.now();

    // Spawn the audiowaveform child process
    const proc = spawn(binaries.audiowaveform, [
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
      .setFfmpegPath(binaries.ffmpeg)
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
