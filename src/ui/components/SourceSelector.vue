<script setup lang="ts">
import { DirectoryTree } from 'directory-tree';
import FolderItem from './FolderItem.vue';

import data from './data.json';

const props = defineProps<{
  title: string
}>();


// TODO dynamic tree from dialog selections saved in user prefs or whatever...
const trees: DirectoryTree[] = [
  data as DirectoryTree
];

</script>

<template>
  <div class="flex flex-col w-full">
    <div class="px-2 py-1 flex flex-row items-center bg-zinc-600  shadow-sm  text-gray-200">
      <h2 class="text-2xl font-bold">{{ title }}</h2>
      <div class="flex-1"></div>
      <button class="b-1 bg-zinc-700 px-3 py-0.5 rounded-full">Add</button>
    </div>

    <div class="flex flex-col w-full flex-1 px-2 py-1 overflow-auto">
      <FolderItem :level="0" v-for="tree in trees" :item="tree" />
    </div>
  </div>
</template>

<style>
</style>