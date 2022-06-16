<script setup lang="ts">
import { DirectoryTree } from 'directory-tree';
import FolderItem from './FolderItem.vue';
import { defineEmits, Ref, ref, watch } from 'vue';

import data from './data.json';

const props = defineProps<{
  title: string
}>();

const emits = defineEmits(['selectionChanged']);

// has to be in an object to prevent the template unwrapping it :(
const refs: { selection: Ref<DirectoryTree | undefined> } = {
  selection: ref(undefined)
};

watch(refs.selection, (sel, prevSel) =>
  emits('selectionChanged', sel, prevSel)
);

// TODO dynamic tree from dialog selections saved in user prefs or whatever...
const trees: DirectoryTree[] = [
  data as DirectoryTree
];

</script>

<template>
  <div class="flex flex-col w-full">
    <div class="px-2 py-1 flex flex-row items-center bg-zinc-600  shadow-sm  text-gray-100">
      <h2 class="text-2xl font-bold">{{ title }}</h2>
      <div class="flex-1"></div>
      <button class="b-1 bg-zinc-700 px-3 py-0.5 rounded-full">Add</button>
    </div>

    <div class="flex flex-col w-full flex-1 overflow-y-scroll">
      <div class="px-2 py-1 text-gray-100">
        <FolderItem :selection="refs.selection" :level="0" v-for="tree in trees" :item="tree" />
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