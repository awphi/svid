<script setup lang="ts">
import { computed, Ref, ref } from '@vue/reactivity';
import { DirectoryTree } from 'directory-tree';

const props = defineProps<{
  item: DirectoryTree,
  level: number,
  selection: Ref<DirectoryTree | undefined>,
}>()

const emits = defineEmits(['deleteTree']);

const isFolder = computed(() => props.item.type === "directory");
const isHidden = computed(() => props.item.extension === '');
const isOpen = ref(false);
const symbol = computed(() => {
  if (props.level === 0) {
    return '🗀 ';
  }

  if (isFolder.value) {
    return '⤷ ';
  } else {
    return '🗎 ';
  }
})

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

async function openContextMenu(e: MouseEvent) {
  const res = await window.api.menu.openSrcSelectorMenu(e.x, e.y);

  if (res === 'refresh') {
    // TODO edit the master ref, removing 
  } else if (res === 'delete') {
    emits('deleteTree', props.item);
  }
}
</script>

<template>
  <div v-if="!isHidden" class="overflow-x-hidden" :class="{ 'cursor-pointer': !isFolder, 'cursor-default': isFolder }"
    :style="{ 'paddingLeft': `${level * 10}px` }">
    <div @click="clicked" class="flex items-center rounded-md px-1 "
      :class="{ 'font-bold': isFolder, 'hover:bg-zinc-600': !isFolder, 'bg-zinc-700 hover:bg-zinc-700': selection.value?.path === item.path }">
      <h2 class="whitespace-nowrap">{{ symbol }}{{ item.name }}</h2>
      <div v-if="isFolder" class="flex-1"></div>
      <button @click="toggle" v-if="isFolder"
        class="flex items-center justify-center rounded-md h-5 w-5 bg-zinc-600 hover:bg-zinc-700">{{
            isOpen ? '-' :
              '+'
        }}
      </button>

      <button @click="openContextMenu" v-if="level === 0"
        class="flex items-center justify-center rounded-md h-5 w-5 ml-1 bg-zinc-600 hover:bg-zinc-700 text-xs">⛭
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