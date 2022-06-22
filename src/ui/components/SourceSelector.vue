<script setup lang="ts">
import { DirectoryTree } from 'directory-tree';
import FolderItem from './FolderItem.vue';
import { Ref, ref, watch } from 'vue';
import { FileFilter, ipcRenderer } from 'electron';

const props = defineProps<{
  title: string,
  filters: FileFilter[],
  id: string
}>();

// Selection stuff
const emits = defineEmits(['selectionChanged']);

// has to be in an object to prevent the template unwrapping it :(
const refs: { selection: Ref<DirectoryTree | undefined> } = {
  selection: ref(undefined)
};

watch(refs.selection, (sel, prevSel) =>
  emits('selectionChanged', sel, prevSel)
);


const trees: Ref<DirectoryTree[]> = ref([]);

// trees serialization
window.api.storage.loadSavedDirectoryTrees(props.id)
  .then((d: DirectoryTree[]) => trees.value = d)
  .catch((e: any) => console.error(`Failed to load saved trees '${props.id}'`, e));

window.addEventListener('beforeunload', async (event) => {
  await window.api.storage.saveDirectoryTrees(props.id, trees.value.map((i) => i.path), props.filters)
    .catch((e: any) => console.error(`Failed to write trees '${props.id}' to disk`, e))
});


async function addButtonClicked() {
  try {
    const dirTrees = await window.api.dialog.selectDirectoryTrees(props.filters);
    trees.value.push(...dirTrees);
    dirTrees.forEach((d: DirectoryTree) => window.api.server.serveDirectoryTree(d))
  } catch (e) {
    console.error(e);
  }
}

// TODO move this into FolderItem component, make it only work on folders (not files), make it edit the trees ref in here
async function openFolderItemMenu(e: MouseEvent, tree: DirectoryTree) {
  window.api.menu.openSrcSelectorMenu(e.x, e.y).then((res: string) => {
    if (res === 'refresh') {
      // TODO
    } else if (res === 'delete') {
      // TODO
    }
  });
}
</script>

<template>
  <div class="flex flex-col w-full">
    <div class="px-2 py-1 flex flex-row items-center bg-zinc-600  shadow-sm  text-gray-100">
      <h2 class="text-2xl font-bold">{{ title }}</h2>
      <div class="flex-1"></div>
      <button @click="addButtonClicked" class="b-1 bg-zinc-700 hover:bg-zinc-800 px-3 py-0.5 rounded-full">Add</button>
    </div>

    <div class="flex flex-col w-full flex-1 overflow-y-scroll">
      <div class="px-2 py-1 text-gray-100">
        <FolderItem @contextmenu="(e) => openFolderItemMenu(e, tree)" :selection="refs.selection" :level="0"
          v-for="tree in trees" :item="tree" />
      </div>
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  @apply w-1 h-1;
}

::-webkit-scrollbar-thumb {
  @apply rounded-full bg-zinc-700;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-zinc-800;
}


::-webkit-scrollbar-thumb:active {
  @apply bg-zinc-700;
}

::-webkit-scrollbar-track {
  @apply bg-zinc-600 bg-opacity-50 rounded-md;
}

::-webkit-scrollbar-corner {
  background: transparent;
}
</style>