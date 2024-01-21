import type { DirectoryTree } from "directory-tree";
import { default as toWebVTT } from "srt-webvtt";
import { createTRPCProxyClient } from "@trpc/client";
import { ipcLink } from "electron-trpc/renderer";
import type { AppRouter } from "../../../main/trpc-api";

export const client = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});

export function isSubs(d: DirectoryTree): boolean {
  return (
    d.path.endsWith(".srt") ||
    d.path.endsWith(".vtt") ||
    d.path.endsWith(".ass")
  );
}

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
