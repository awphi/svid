<script setup lang="ts">
import SourceSelectorVue from './components/SourceSelector.vue';
import VideoPlayerVue from './components/VideoPlayer.vue';
import SubTrackVue from './components/SubTrack.vue';
</script>

<template>
  <div class="bg-zinc-500 flex flex-col w-1/5 ">
    <SourceSelectorVue :title="'Videos'" />
    <SourceSelectorVue :title="'Subtitles'" />
  </div>
  <div class="flex flex-col flex-1 h-full">
    <VideoPlayerVue />
    <SubTrackVue />
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
