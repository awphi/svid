<script setup lang="ts">
import SourceSelectorVue from './components/SourceSelector.vue';
import VideoPlayerVue from './components/VideoPlayer.vue';
import SubTrackVue from './components/SubTrack.vue';
</script>

<template>
  <div class="bg-zinc-500 flex flex-col w-1/4 ">
    <SourceSelectorVue class="h-1/2" :title="'Videos'" />
    <SourceSelectorVue class="h-1/2" :title="'Subtitles'" />
  </div>
  <div class="flex flex-col flex-1 h-full">
    <VideoPlayerVue />
    <SubTrackVue />
    <div class="w-full px-1 h-6 flex bg-zinc-500">
      <h1 class="flex-1">Adam</h1>
      <h1 class="flex-1">Adam</h1>
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
