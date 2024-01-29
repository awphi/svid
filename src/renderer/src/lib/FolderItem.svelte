<script setup lang="ts">
  import type { DirectoryTree } from "directory-tree";
  import { ipcClient } from "./utils";
  import { createEventDispatcher } from "svelte";
  import { ChevronDown, ChevronUp } from "radix-icons-svelte";

  export let item: DirectoryTree;
  export let level: number;
  export let selection: DirectoryTree | undefined = undefined;

  const dispatch = createEventDispatcher();

  let isOpen = false;

  let isFolder: boolean;
  $: isFolder = item.type === "directory";

  let isSelected: boolean;
  $: isSelected = selection?.path === item.path;

  async function openContextMenu(event: MouseEvent) {
    const ctxOpts: Parameters<typeof ipcClient.openContextMenu.query>[0] = {
      items: [{ label: "Open in File Explorer", id: "open" }],
      x: event.x,
      y: event.y,
    };

    if (level === 0) {
      ctxOpts.items.unshift({
        label: `Delete "${item.name.slice(0, 16)}...`,
        id: "delete",
      });
    }

    const res = await ipcClient.openContextMenu.query(ctxOpts);
    if (res === "delete") {
      dispatch("delete-tree", item);
    } else if (res === "open") {
      ipcClient.showItemInFolder.query({ path: item.path });
    }
  }
</script>

<button
  style={`padding-left: ${level * 10}px`}
  on:click={() => {
    if (!isFolder) {
      selection = item;
    } else {
      isOpen = !isOpen;
    }
  }}
  on:contextmenu={(e) => {
    if (isFolder) {
      openContextMenu(e);
    }
    if (isSelected) selection = undefined;
  }}
  class="flex items-center rounded-md gap-1 w-full min-h-fit"
  class:font-bold={isFolder}
  class:text-purple-500={isSelected}
  class:hover:text-purple-400={!isFolder && !isSelected}
>
  <h2 class="whitespace-nowrap text-ellipsis overflow-hidden">
    {item.name}
  </h2>
  {#if isFolder}
    {#if isOpen}
      <ChevronUp />
    {/if}
    {#if !isOpen}
      <ChevronDown />
    {/if}
  {/if}
</button>
{#if isFolder}
  <div class:hidden={!isOpen}>
    {#if item.children && item.children.length > 0}
      {#each item.children as child}
        <!-- assert child is not hidden if a file or not empty if a folder before rendering-->
        {#if (child.extension && child.extension !== "") || (child.children && child.children.length > 0)}
          <svelte:self bind:selection level={level + 1} item={child} />
        {/if}
      {/each}
    {/if}
  </div>
{/if}
