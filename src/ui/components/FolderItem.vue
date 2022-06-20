<script setup lang="ts">
import { computed, Ref, ref } from '@vue/reactivity';
import { DirectoryTree } from 'directory-tree';

const props = defineProps<{
  item: DirectoryTree,
  level: number,
  selection: Ref<DirectoryTree | undefined>
}>()

const isFolder = computed(() => props.item.type === "directory");
const isHidden = computed(() => props.item.extension === '');
const isOpen = ref(false);


function clicked(): void {
  if (!isFolder.value && !isHidden.value) {
    props.selection.value = props.item;
  }
}

function toggle(): void {
  if (isFolder) {
    isOpen.value = !isOpen.value;
  }
}

</script>

<template>

  <div v-if="!isHidden" class="overflow-x-hidden" :class="{ 'cursor-pointer': !isFolder, 'cursor-default': isFolder }"
    :style="{ 'paddingLeft': `${level * 10}px` }">
    <div @click="clicked" class="flex items-center rounded-md px-1 "
      :class="{ 'font-bold': isFolder, 'hover:bg-zinc-600': !isFolder, 'bg-zinc-700 hover:bg-zinc-700': selection.value?.path === item.path }">
      <h2 class="whitespace-nowrap">{{ item.name }}</h2>
      <div v-if="isFolder" class="flex-1"></div>
      <button @click="toggle" v-if="isFolder"
        class="flex items-center justify-center rounded-md h-5 w-5 bg-zinc-600 hover:bg-zinc-700">{{
            isOpen ? '-' :
              '+'
        }}
      </button>
    </div>
    <hr class=" border-black opacity-10" v-if="isFolder" />
    <div v-show="isOpen" v-if="isFolder">
      <FolderItem :selection="selection" v-for="(child, index) in item.children" :level="level + 1" :key="index"
        :item="child" />
    </div>
  </div>
</template>

<style>
</style>