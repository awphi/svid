<script setup lang="ts">
import { computed, ref } from '@vue/reactivity';
import { DirectoryTree } from 'directory-tree';

const props = defineProps<{
  item: DirectoryTree,
  level: number
}>()

const isFolder = computed(() => props.item.type === "directory");
const isHidden = computed(() => props.item.extension === '')
const isOpen = ref(false);

const emit = defineEmits(['clicked']);

function clicked(node: DirectoryTree | null): void {
  if (node !== null) {
    emit('clicked', node);
  } else if (!isFolder.value && !isHidden.value) {
    emit('clicked', props.item);
  }
}

function toggle(): void {
  if (isFolder) {
    isOpen.value = !isOpen.value;
  }
}

</script>

<template>

  <div v-if="!isHidden" class="overflow-x-hidden" :class="{ 'cursor-pointer': !isFolder }"
    :style="{ 'paddingLeft': `${level * 15}px` }">
    <div @click="clicked(null)" class="flex items-center" :class="{ 'font-bold': isFolder }">
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
      <FolderItem @clicked="(t) => clicked(t)" v-for="(child, index) in item.children" :level="level + 1" :key="index"
        :item="child" />
    </div>
  </div>
</template>

<style>
</style>