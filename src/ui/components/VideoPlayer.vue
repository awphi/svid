<script setup lang="ts">
import { DirectoryTree } from 'directory-tree';
import { computed, Ref, ref, watch } from 'vue';
import { default as toWebVTT } from "srt-webvtt";

const props = defineProps<{
  videoPath: DirectoryTree | undefined,
  subsPath: DirectoryTree | undefined
}>();

const video: Ref<HTMLVideoElement | undefined> = ref(undefined);

const BASE_URL = 'http://localhost:8901/files/';

const subsUrl = ref('');
const videoUrl = computed(() => props.videoPath ? BASE_URL + encodeURI(props.videoPath.path) : '');
const subsPath = computed(() => props.subsPath);

watch(subsPath, async (newSubsPath, _) => {
  if (newSubsPath === undefined) {
    return '';
  }

  const res = await fetch(BASE_URL + encodeURI(newSubsPath.path));

  const blob = await res.blob();
  subsUrl.value = await toWebVTT(blob);
});

</script>

<template>
  <div>
    <video autoplay ref="video" class="w-full h-auto" :src="videoUrl" controls>
      <track default kind="subtitles" :src="subsUrl" />
    </video>
  </div>
</template>

<style>
</style>
