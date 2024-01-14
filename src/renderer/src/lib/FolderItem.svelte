<script setup lang="ts">
  import type { DirectoryTree } from "directory-tree";
  import Icon from "@iconify/svelte";
  import { isSubs } from "./utils";
  import { createEventDispatcher } from "svelte";

  export let item: DirectoryTree;
  export let level: number;
  export let selection: DirectoryTree | undefined;

  const dispatch = createEventDispatcher();

  let isFolder: boolean;
  $: isFolder = item.type === "directory";

  let isHidden: boolean;
  $: isHidden = item.extension === "";

  let isSelected: boolean;
  $: isSelected = selection?.path === item.path;

  let isOpen = false;

  let icon: string;
  $: {
    if (level === 0) {
      icon = "bx:folder";
    } else {
      if (isFolder) {
        icon = "bx:subdirectory-right";
      } else {
        icon = isSubs(item) ? "bx:file" : "bx:movie";
      }
    }
  }

  async function openContextMenu(event: MouseEvent) {
    if (level !== 0) {
      return;
    }

    const res = await window.api.menu.openContextMenu(
      [
        { label: "Delete from Menu", id: "delete" },
        { label: "Open in File Explorer", id: "open" },
      ],
      event.x,
      event.y,
    );
    if (res === "delete") {
      dispatch("delete-tree", item);
    } else if (res === "open") {
      window.api.dialog.showItemInFolder(item.path);
    }
  }
</script>

{#if !isHidden}
  <div
    class="overflow-x-hidden"
    class:cursor-pointer={!isFolder}
    class:cursor-default={isFolder}
    style={`padding-left: ${level * 10}px`}
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <button
      on:click={() => {
        if (!isFolder) selection = item;
      }}
      on:contextmenu={() => {
        if (isSelected) selection = undefined;
      }}
      class="flex items-center rounded-md px-1"
      class:font-bold={isFolder}
      class:hover:bg-neutral-700={!isFolder}
      class:bg-neutral-800={isSelected}
      class:hover:bg-neutral-800={isSelected}
    >
      <Icon class="mr-1 min-w-min" {icon} />
      <h2 class="whitespace-nowrap text-ellipsis overflow-hidden">
        {item.name}
      </h2>
      {#if isFolder}
        <div class="flex-1" />
      {/if}
      {#if isFolder}
        <button
          on:click={() => (isOpen = !isOpen)}
          on:contextmenu={openContextMenu}
          class="flex items-center justify-center rounded-md h-5 ml-5 bg-neutral-700 hover:bg-neutral-800 w-auto aspect-square"
        >
          <Icon icon="bx:chevron-down" vFlip={isOpen} />
        </button>
      {/if}
    </button>
    {#if isFolder}
      <hr class=" border-black opacity-10" />
      <div class:hidden={!isOpen}>
        {#each item.children as child}
          <svelte:self bind:selection level={level + 1} item={child} />
        {/each}
      </div>
    {/if}
  </div>
{/if}
