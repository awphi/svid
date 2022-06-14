<script setup lang="ts">
import { computed, ref } from '@vue/reactivity';
import { DirectoryTree } from 'directory-tree';

const props = defineProps<{
  item: DirectoryTree
}>()


const isFolder = computed(() => props.item.type === "directory");
const isOpen = ref(false);

function toggle(): void {
  console.log(isFolder, isOpen)
  if (isFolder) {
    isOpen.value = !isOpen.value;
  }
}

</script>

<template>
  <div>
    <div class=" break-words" :class="{ 'font-bold cursor-pointer': isFolder }" @click="toggle">
      {{ item.name }}
      <span v-if="isFolder">[{{ isOpen ? '-' : '+' }}]</span>
    </div>
    <div v-show="isOpen" v-if="isFolder">
      <FolderItem v-for="(child, index) in item.children" :key="index" :item="child" />
    </div>
  </div>
</template>

<style>
</style>