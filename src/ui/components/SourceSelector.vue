<script setup lang="ts">
import FolderView from './FolderView.vue';

defineProps<{
  title: string
}>()

const folders: Folder[] = [
  { name: 'Movies', files: [{ name: "Movie 1", exactPath: "./adam" }, { name: "Movie 2", exactPath: "./adjhwshjk" }] }
];

</script>

<template>
  <div class="flex flex-col flex-1 w-full">
    <div class="px-2 py-1 flex flex-row items-center bg-zinc-600  shadow-sm  text-gray-200">
      <h2 class="text-2xl font-bold">{{ title }}</h2>
      <div class="flex-1"></div>
      <button class="b-1 bg-zinc-700 px-3 py-0.5 rounded-full">Add</button>
    </div>

    <div class="w-full flex-1 px-2 py-1 overflow-auto">
      <FolderView v-for="f in folders" :folder="f" />
    </div>
  </div>
</template>

<style>
</style>