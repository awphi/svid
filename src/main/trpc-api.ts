import { initTRPC } from "@trpc/server";
import { dialog, shell } from "electron";
import { z } from "zod";
import {
  buildPromiseMenu,
  ee,
  getDirTreesInternal,
  serveDirectoryTreeInternal,
} from "./api-utils";
import { observable } from "@trpc/server/observable";
import { WaveformAPI } from "./wav-api";

let currentAudioWaveformRecoder: WaveformAPI | undefined = undefined;

const t = initTRPC.create({ isServer: true });

const fileFilter = z.object({
  name: z.string(),
  extensions: z.array(z.string()),
});

const selectDirectoryTrees = t.procedure
  .input(z.object({ filters: z.array(fileFilter) }))
  .query(async (req) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Select Folder",
      filters: req.input.filters,
      properties: ["openDirectory", "multiSelections"],
    });

    if (canceled) {
      return [];
    }

    return getDirTreesInternal(req.input.filters, filePaths);
  });

const showItemInFolder = t.procedure
  .input(
    z.object({
      path: z.string(),
    }),
  )
  .query((req) => shell.openExternal(req.input.path));

const getDirTrees = t.procedure
  .input(
    z.object({
      paths: z.array(z.string()),
      filters: z.array(fileFilter),
    }),
  )
  .query((req) => getDirTreesInternal(req.input.filters, req.input.paths));

const prepareWaveformAPI = t.procedure
  .input(
    z.object({
      filePath: z.string(),
      pxpersecond: z.number().int().gt(0),
      maxChunkSize: z.number().gt(0),
    }),
  )
  .query(async ({ input }) => {
    currentAudioWaveformRecoder = await WaveformAPI.create(
      input.filePath,
      input.maxChunkSize,
      input.pxpersecond,
    );

    return currentAudioWaveformRecoder.metadata;
  });

const getWaveformChunk = t.procedure
  .input(z.object({ index: z.number().int() }))
  .query(({ input }) => {
    if (currentAudioWaveformRecoder === undefined) {
      return undefined;
    }

    return currentAudioWaveformRecoder.get(input.index);
  });

const openContextMenu = t.procedure
  .input(
    z.object({
      // TODO is there a way of typing this properly with zod? perhaps electron-trpc provides it?
      items: z.array(z.any()),
      x: z.number(),
      y: z.number(),
    }),
  )
  .query((req) => {
    const { items, x, y } = req.input;
    const [p, menu] = buildPromiseMenu(items);
    menu.popup({ x, y });
    return p;
  });

const serveDirectoryTree = t.procedure
  .input(
    z.object({
      path: z.string(),
    }),
  )
  .query((req) => serveDirectoryTreeInternal(req.input.path));

const sub = t.procedure.input(z.string()).subscription((req) => {
  return observable((emit) => {
    function fn(dat: any) {
      emit.next(dat);
    }

    ee.on(req.input, fn);

    return () => {
      ee.off(req.input, fn);
    };
  });
});

export const appRouter = t.router({
  sub,
  selectDirectoryTrees,
  getDirTrees,
  openContextMenu,
  showItemInFolder,
  serveDirectoryTree,
  prepareAudioWaveformRecoder: prepareWaveformAPI,
  getAudioWaveformChunk: getWaveformChunk,
});

export type AppRouter = typeof appRouter;
