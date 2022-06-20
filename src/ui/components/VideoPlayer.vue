<script setup lang="ts">
import { DirectoryTree } from 'directory-tree';

const props = defineProps<{
  videoPath: DirectoryTree | undefined
}>();

</script>

<template>
  <div>
    <video class="w-full h-auto" :src="`http://localhost:8901/${videoPath?.path}`" controls>
    </video>
  </div>
</template>

<style>
</style>
