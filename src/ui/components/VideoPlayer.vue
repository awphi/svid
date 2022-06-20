<script setup lang="ts">
import { DirectoryTree } from 'directory-tree';
import { computed, Ref, ref, watch } from 'vue';

const props = defineProps<{
  videoPath: DirectoryTree | undefined
}>();

const video: Ref<HTMLVideoElement | undefined> = ref(undefined);

const BASE_URL = 'http://localhost:8901/files/';
const url = computed(() => props.videoPath ? BASE_URL + encodeURI(props.videoPath.path) : '')

</script>

<template>
  <div>
    <video autoplay ref="video" class="w-full h-auto" :src="url" controls>
    </video>
  </div>
</template>

<style>
</style>
