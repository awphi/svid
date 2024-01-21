import { persisted } from "svelte-persisted-store";

export const videoDirectoryTrees = persisted("video", {});
export const subsDirectoryTrees = persisted("subs", {});
