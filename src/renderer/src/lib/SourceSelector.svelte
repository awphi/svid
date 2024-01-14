<script setup lang="ts">
  import type { DirectoryTree } from "directory-tree";
  import FolderItem from "./FolderItem.svelte";
  import type { FileFilter } from "electron";
  import { onMount } from "svelte";

  export let title: string;
  export let filters: FileFilter[];
  export let id: string;
  export let selection: DirectoryTree | undefined = undefined;

  let clazz = "";
  export { clazz as class };

  let trees: { [name: string]: DirectoryTree } = Object.create(null);

  onMount(() => {
    // trees deserialization
    window.api.storage
      .loadSavedDirectoryTrees(id)
      .then((d) => d.filter((v) => v !== null))
      .then((d) => {
        d.forEach((t) => {
          trees[t!.path] = t!;
        });
        return d;
      })
      .then((d) => {
        d.forEach((t) => {
          window.api.server
            .serveDirectoryTree(t!.path)
            .catch((e) => console.error(`Failed to load path ${t!.path}`, e));
        });
      });

    // Deals with reloading file trees when they change on the disk
    // We employ some throttling as we get a large spray of treeChanged events sometimes
    const refreshThrottles: { [path: string]: number } = Object.create(null);
    window.api.on("treeChanged", (path) => {
      const tree = trees[path];
      if (tree !== undefined) {
        if (path in refreshThrottles) {
          window.clearTimeout(refreshThrottles[path]);
        }
        refreshThrottles[path] = window.setTimeout(async () => {
          const freshTree = await window.api.storage.getDirTrees(
            [path],
            filters,
          );
          trees[path] = freshTree[0];
        }, 10);
      }
    });
  });

  onMount(() => {
    window.addEventListener("beforeunload", async () => {
      await window.api.storage
        .saveDirectoryTrees(
          id,
          Object.values(trees).map((i) => i.path),
          filters,
        )
        .catch((e: any) =>
          console.error(`Failed to write trees '${id}' to disk`, e),
        );
    });
  });

  async function addButtonClicked() {
    try {
      const dirTrees = await window.api.dialog.selectDirectoryTrees(filters);
      // Filter out trees already added
      dirTrees.forEach((treeIn: DirectoryTree) => {
        if (trees[treeIn.path] === undefined) {
          trees[treeIn.path] = treeIn;
          window.api.server.serveDirectoryTree(treeIn.path);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  function removeTree(target: DirectoryTree) {
    delete trees[target.path];
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
      {#each Object.values(trees) as tree}
        <FolderItem
          on:delete-tree={(e) => removeTree(e.detail)}
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
