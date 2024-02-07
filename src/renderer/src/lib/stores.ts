import type { DirectoryTree } from "directory-tree";
import { persisted } from "svelte-persisted-store";
import type { Dict, UserPreferences } from "./types";
import { writable } from "svelte/store";
import type { WaveformAPIConsumerInfo } from "./wav-api-consumer";

export const videoDirectoryTrees = persisted<Dict<DirectoryTree>>("video", {});
export const subsDirectoryTrees = persisted<Dict<DirectoryTree>>("subs", {});
export const preferences = persisted<UserPreferences>("preferences", {
  sourceSelectorPaneSize: 20,
  visPaneSize: 25,
});
export const waveformInfo = writable<WaveformAPIConsumerInfo>({
  loadedChunks: 0,
  loadingChunks: 0,
  totalChunks: 0,
});
