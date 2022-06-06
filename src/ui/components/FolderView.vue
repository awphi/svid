<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  folder: Folder
}>()

var selectedFile = ref(-1);
var minimised = ref(true);

// TODO create emits event from other button to send notification to parent component to delete this folder from state


function selectFile(folder: Folder, idx: number): void {
  if (idx >= folder.files.length || idx < 0) {
    return;
  }

  selectedFile.value = idx;
}
</script>

<template>
  <div class="w-full text-gray-200">
    <div class="flex items-center">
      <h2 class="font-bold text-lg">{{ folder.name }}</h2>
      <div class="flex-1"></div>
      <button class="bg-zinc-600 w-4 h-4 flex items-center justify-center rounded-full mr-1"
        @click="minimised = !minimised">{{ !minimised ? '-' :
            '+'
        }}</button>
      <button class="bg-zinc-600 w-4 h-4 flex items-center justify-center rounded-full">~</button>
    </div>
    <hr class="w-full opacity-20 border-zinc-900" />
    <div class="w-full px-1 py-1 space-y-1" v-if="!minimised">
      <h3 class="bg-zinc-600 bg-opacity-50 hover:bg-opacity-70 px-2 rounded-md" @click="selectFile(folder, i)"
        v-for="(f, i) in folder.files" :fileidx="i"
        :class="{ 'bg-opacity-100 hover:bg-opacity-100': selectedFile === i, }">⤷
        {{
            f.name
        }}</h3>
    </div>
  </div>
</template>

<style>
</style>