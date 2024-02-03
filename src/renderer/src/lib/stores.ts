import type { DirectoryTree } from "directory-tree";
import { persisted } from "svelte-persisted-store";
import type { Dict, UserPreferences } from "./types";

export const videoDirectoryTrees = persisted<Dict<DirectoryTree>>("video", {});
export const subsDirectoryTrees = persisted<Dict<DirectoryTree>>("subs", {});
export const preferences = persisted<UserPreferences>("preferences", {
  sourceSelectorPaneSize: 20,
  visPaneSize: 25,
});
