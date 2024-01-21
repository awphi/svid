<script setup lang="ts">
  import type { DirectoryTree } from "directory-tree";
  import FolderItem from "./FolderItem.svelte";
  import type { FileFilter } from "electron";
  import { onMount } from "svelte";
  import { client, omit } from "./utils";
  import type { Writable } from "svelte/store";
  import type { Dict } from "./types";
  import { addToObjectStore, removeFromObjectStore } from "./store";

  export let title: string;
  export let filters: FileFilter[];
  export let selection: DirectoryTree | undefined = undefined;
  export let trees: Writable<Dict<DirectoryTree>>;

  let clazz = "";
  export { clazz as class };

  // debounce tree updates
  const refreshDebounceTimers: { [path: string]: number } = Object.create(null);

  function serveTrees(): void {
    let erroredPaths: string[] = [];
    for (const path of Object.keys($trees)) {
      try {
        client.serveDirectoryTree.query({ path });
      } catch (e) {
        console.error(`Failed to load path ${path}`, e);
        erroredPaths.push(path);
      }
    }
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
      const freshTree = await client.getDirTrees.query({
        paths: [path],
        filters,
      });
      addToObjectStore(trees, { [path]: freshTree[0] });
    }, 10);
  }

  onMount(() => {
    serveTrees();

    client.sub.subscribe("treeChanged", {
      // TODO make more typesafe
      onData: (data) => updateTreeFromDisk(data as string),
    });
  });

  async function addButtonClicked() {
    try {
      const dirTrees = await client.selectDirectoryTrees.query({ filters });
      // Filter out trees already added
      dirTrees.forEach((treeIn: DirectoryTree) => {
        if ($trees[treeIn.path] === undefined) {
          addToObjectStore(trees, { [treeIn.path]: treeIn });
          client.serveDirectoryTree.query({ path: treeIn.path });
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
</script>

<div class={"flex flex-col w-full " + clazz}>
  <div
    class="px-2 py-1 flex flex-row items-center bg-neutral-700 border-neutral-800 border-t-[1px] border-b-[1px] shadow-sm text-gray-100"
  >
    <h2 class="text-2xl font-bold">{title}</h2>
    <div class="flex-1" />
    <button
      on:click={addButtonClicked}
      class="b-1 bg-neutral-800 hover:bg-neutral-900 px-3 py-0.5 rounded-full"
      >Add</button
    >
  </div>

  <div id="folders" class="flex flex-col w-full flex-1 overflow-y-scroll">
    <!-- pr-1 to compensate for the width added the scrollbar -->
    <div class="pl-2 pr-1 py-1 text-gray-100">
      {#each Object.values($trees) as tree}
        <FolderItem
          on:delete-tree={(e) => removeFromObjectStore(trees, e.detail.path)}
          bind:selection
          level={0}
          item={tree}
        />
      {/each}
    </div>
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
