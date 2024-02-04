<script setup lang="ts">
  import type { DirectoryTree } from "directory-tree";
  import FolderItem from "./FolderItem.svelte";
  import type { FileFilter } from "electron";
  import { onMount } from "svelte";
  import {
    ipcClient,
    omit,
    addToObjectStore,
    removeFromObjectStore,
  } from "../utils";
  import type { Writable } from "svelte/store";
  import type { Dict } from "../types";

  export let title: string;
  export let filters: FileFilter[];
  export let selection: DirectoryTree | undefined = undefined;
  export let trees: Writable<Dict<DirectoryTree>>;

  // debounce tree updates
  const refreshDebounceTimers: { [path: string]: number } = Object.create(null);

  async function serveTrees(): Promise<void> {
    let erroredPaths: string[] = [];
    const p = Object.keys($trees).map(async (path) => {
      try {
        return await ipcClient.serveDirectoryTree.query({ path });
      } catch (e) {
        console.error(`Failed to load path ${path}`, e);
        erroredPaths.push(path);
      }
    });

    await Promise.all(p);
    trees.set(omit($trees, erroredPaths));
  }

  function updateTreeFromDisk(path: string): void {
    const tree = $trees[path];
    if (tree === undefined) {
      return;
    }

    if (path in refreshDebounceTimers) {
      window.clearTimeout(refreshDebounceTimers[path]);
    }

    refreshDebounceTimers[path] = window.setTimeout(async () => {
      const freshTree = await ipcClient.getDirTrees.query({
        paths: [path],
        filters,
      });
      addToObjectStore(trees, { [path]: freshTree[0] });
    }, 10);
  }

  onMount(() => {
    serveTrees();

    const changeSubscriber = ipcClient.sub.subscribe("treeChanged", {
      // TODO make more typesafe
      onData: (data) => updateTreeFromDisk(data as string),
    });

    return () => {
      changeSubscriber.unsubscribe();
    };
  });

  async function addButtonClicked() {
    try {
      const dirTrees = await ipcClient.selectDirectoryTrees.query({ filters });
      // Filter out trees already added
      dirTrees.forEach((treeIn: DirectoryTree) => {
        if ($trees[treeIn.path] === undefined) {
          addToObjectStore(trees, { [treeIn.path]: treeIn });
          ipcClient.serveDirectoryTree.query({ path: treeIn.path });
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
</script>

<div class="flex flex-col w-full">
  <div class="px-2 py-1 flex flex-row items-center bg-neutral-900 shadow-sm">
    <h2 class="text-2xl font-bold">{title}</h2>
    <div class="flex-1" />
    <button
      on:click={addButtonClicked}
      class="b-1 bg-purple-700 hover:bg-purple-800 px-3 py-0.5 rounded-md"
      >Add</button
    >
  </div>

  <div
    class="flex flex-col w-full flex-1 overflow-y-scroll bg-neutral-800 px-2 py-1"
  >
    {#each Object.values($trees) as tree}
      <FolderItem
        on:delete-tree={(e) => removeFromObjectStore(trees, e.detail.path)}
        on:select-tree={(e) => (selection = e.detail)}
        {selection}
        level={0}
        item={tree}
      />
    {/each}
  </div>
</div>

<style lang="postcss">
  ::-webkit-scrollbar {
    @apply w-1 h-1;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-neutral-700 bg-opacity-50;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-opacity-80;
  }

  ::-webkit-scrollbar-thumb:active {
    @apply bg-neutral-700;
  }

  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  ::-webkit-scrollbar-corner {
    background: transparent;
  }
</style>
