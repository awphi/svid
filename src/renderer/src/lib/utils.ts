import type { DirectoryTree } from "directory-tree";
import { default as toWebVTT } from "srt-webvtt";
import { createTRPCProxyClient } from "@trpc/client";
import { ipcLink } from "electron-trpc/renderer";
import type { AppRouter } from "../../../main/trpc-api";
import { get, type Writable } from "svelte/store";
import type { Range, Subtitle, SubtitleGroup } from "./types";

export const ipcClient = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});

export const BASE_URL = "http://localhost:8901/files";

export function formatFileUrl(
  tree: DirectoryTree | undefined,
  base = BASE_URL,
): string {
  if (tree === undefined) {
    return "";
  }
  const url = new URL(tree.path, BASE_URL);
  return base + url.pathname;
}

export async function getVttSubsUrl(subs: DirectoryTree): Promise<string> {
  const res = await fetch(formatFileUrl(subs));

  const blob = await res.blob();
  // TODO .ass parsing
  if (subs.path.endsWith(".srt")) {
    return await toWebVTT(blob);
  } else if (subs.path.endsWith(".vtt")) {
    return URL.createObjectURL(blob);
  }
  return "";
}

export function omit<T extends {}>(obj: T, removeBase: keyof T | (keyof T)[]) {
  let result = {} as T;
  let remove: (keyof T)[] = [];
  if (typeof removeBase === "string") {
    remove = [].slice.call(arguments, 1);
  }
  for (let prop in obj) {
    if (!obj.hasOwnProperty || obj.hasOwnProperty(prop)) {
      if (remove.indexOf(prop) === -1) {
        result[prop] = obj[prop];
      }
    }
  }
  return result;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(Math.min(v, max), min);
}

export function removeFromObjectStore<T extends object, K extends keyof T>(
  dict: Writable<T>,
  target: K | K[],
) {
  dict.set(omit(get(dict), target));
}

export function addToObjectStore<T extends object>(
  dict: Writable<T>,
  newValues: Partial<T>,
): void {
  dict.set(Object.assign(get(dict), newValues));
}

export function clipText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  suffix = "...",
) {
  var metrics = ctx.measureText(text);
  var suffixMetrics = ctx.measureText(suffix);
  var textClipped = text;
  var clipped = false;
  while (metrics.width > maxWidth && metrics.width > suffixMetrics.width) {
    textClipped = textClipped.slice(0, -1);
    metrics = ctx.measureText(textClipped + suffix);
    clipped = true;
  }

  if (clipped) {
    textClipped += suffix;
  }

  return textClipped;
}

function initSubtitleGroup(sub: Subtitle): SubtitleGroup {
  return { ...sub, contents: [sub] };
}

function groupSubtitles(subs: Subtitle[]): SubtitleGroup[] {
  // Sort ranges by their start value
  subs.sort((a, b) => a.start - b.start);

  const subGroups: SubtitleGroup[] = [];
  let currentSub = initSubtitleGroup(subs[0]);

  for (let i = 1; i < subs.length; i++) {
    const nextSub = subs[i];
    // Check if the current range overlaps with the next range
    if (currentSub.end >= nextSub.start) {
      // Merge the two ranges
      currentSub.end = Math.max(currentSub.end, nextSub.end);
      currentSub.contents.push(nextSub);
    } else {
      // No overlap, push the current range to mergedRanges and update currentRange
      subGroups.push(currentSub);
      currentSub = initSubtitleGroup(nextSub);
    }
  }

  subGroups.push(currentSub);

  return subGroups;
}

/**
 * Finds distinct groups of overlapping subtitles and assigns each one a `row` property such that they do not overlap
 * with the minimum amount of rows possible.
 */
export function assignRows(subs: Subtitle[]): number {
  const groups = groupSubtitles(subs);
  let maxRows = 1;
  for (const { contents } of groups) {
    const rows: Subtitle[][] = [];

    contents.forEach((sub) => {
      let placed = false;
      // Try to place the range in an existing row
      for (let i = 0; i < rows.length && !placed; i++) {
        if (rows[i][rows[i].length - 1].end < sub.start) {
          // No overlap, place the range in this row
          sub.row = i;
          rows[i].push(sub);
          placed = true;
        }
      }
      // If the range wasn't placed in any row, add a new row
      if (!placed) {
        rows.push([sub]);
        sub.row = rows.length - 1;
      }
    });

    maxRows = Math.max(maxRows, rows.length);
  }

  return maxRows;
}
