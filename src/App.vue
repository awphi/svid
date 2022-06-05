<script setup lang="ts">
import SourceSelectorVue from './components/SourceSelector.vue';
import VideoPlayerVue from './components/VideoPlayer.vue';
import SubTrackVue from './components/SubTrack.vue';
</script>

<template>
  <SourceSelectorVue class="w-1/5" />
  <div class="flex-col flex-1">
    <VideoPlayerVue />
    <SubTrackVue />
  </div>
</template>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  @apply bg-main;
}

button {
  @apply bg-highlight;
}

p {
  @apply text-paragraph;
}

h1,
h2,
h3,
h4 {
  @apply text-headline;
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
