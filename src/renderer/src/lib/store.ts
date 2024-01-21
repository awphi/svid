import type { DirectoryTree } from "directory-tree";
import { persisted } from "svelte-persisted-store";
import type { Dict, UserPreferences } from "./types";
import { get, type Writable } from "svelte/store";
import { omit } from "./utils";

export const videoDirectoryTrees = persisted<Dict<DirectoryTree>>("video", {});
export const subsDirectoryTrees = persisted<Dict<DirectoryTree>>("subs", {});
export const preferences = persisted<UserPreferences>("preferences", {
  sourceSelectorPaneSize: 20,
  visPaneSize: 25,
});

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
