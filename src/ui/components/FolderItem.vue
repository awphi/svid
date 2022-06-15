<script setup lang="ts">
import { computed, ref } from '@vue/reactivity';
import { DirectoryTree } from 'directory-tree';

const props = defineProps<{
  item: DirectoryTree,
  level: number
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
  <div v-if="item.extension !== ''" class="w-full" :style="{ 'paddingLeft': `${level * 15}px` }">
    <div class="flex items-center text-ellipsis" :class="{ 'font-bold': isFolder }">
      <!-- TODO fix text not clipping-->
      <h2 class="whitespace-nowrap">{{ item.name }}</h2>
      <div v-if="isFolder" class="flex-1"></div>
      <button @click="toggle" v-if="isFolder" class="flex items-center justify-center rounded-md h-5 w-5 bg-zinc-600">{{
          isOpen ? '-' :
            '+'
      }}
      </button>
    </div>
    <hr class=" border-black opacity-10" v-if="isFolder" />
    <div v-show="isOpen" v-if="isFolder">
      <FolderItem v-for="(child, index) in item.children" :level="level + 1" :key="index" :item="child" />
    </div>
  </div>
</template>

<style>
</style>