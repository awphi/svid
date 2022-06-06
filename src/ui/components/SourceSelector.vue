<script setup lang="ts">
function load() {
  window.api.dialog.readFiles([{ extensions: ["mp4", "mkv"], name: "Video File" }]);
}
</script>

<template>
  <div>Src Selector
    <button @click="load">Clicky</button>
  </div>
</template>

<style>
</style>