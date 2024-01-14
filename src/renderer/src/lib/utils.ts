import type { DirectoryTree } from "directory-tree";
import { default as toWebVTT } from "srt-webvtt";

export function isSubs(d: DirectoryTree): boolean {
  return (
    d.path.endsWith(".srt") ||
    d.path.endsWith(".vtt") ||
    d.path.endsWith(".ass")
  );
}

export const BASE_URL = "http://localhost:8901/files/";

export function formatFileUrl(
  tree: DirectoryTree | undefined,
  base = BASE_URL,
): string {
  return tree === undefined ? "" : base + encodeURI(tree.path);
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
