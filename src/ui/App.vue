<script setup lang="ts">
import SourceSelectorVue from './components/SourceSelector.vue';
import VideoPlayerVue from './components/VideoPlayer.vue';
import SubTrackVue from './components/SubTrack.vue';
import { DirectoryTree } from 'directory-tree';
import { Ref, ref } from 'vue';

const selectedVideo: Ref<DirectoryTree | undefined> = ref(undefined);
const selectedSubs: Ref<DirectoryTree | undefined> = ref(undefined);

</script>

<template>
  <div class="bg-zinc-500 flex flex-col w-1/4 ">
    <SourceSelectorVue @selection-changed="(sel, _) => selectedVideo = sel" class="h-1/2" :title="'Videos'" />
    <SourceSelectorVue @selection-changed="(sel, _) => selectedSubs = sel" class="h-1/2" :title="'Subtitles'" />
  </div>
  <div class="flex flex-col flex-1 h-full">
    <VideoPlayerVue />
    <SubTrackVue />
    <div class="w-full h-6 flex bg-zinc-500 text-gray-100 font-bold text-sm ">
      <div class="flex-1 flex h-full items-center">
        <img src="assets/video-svgrepo-com.svg" class="mr-0.5 w-5" alt="Video file icon">
        <h1>{{ selectedVideo?.name }}</h1>
      </div>
      <div class=" w-[1px] mx-1 h-full bg-opacity-20 bg-black"></div>
      <div class="flex-1 flex h-full items-center">
        <img src="assets/subtitles-svgrepo-com.svg" class="mr-1 w-5" alt="Subtitles file icon">
        <h1>{{ selectedSubs?.name }}</h1>
      </div>
    </div>
  </div>
</template>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html,
body,
#app {
  height: 100%;
  width: 100%;
}

#app {
  display: flex;
}
</style>
