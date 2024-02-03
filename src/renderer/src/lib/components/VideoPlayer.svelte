<script setup lang="ts">
  import type { DirectoryTree } from "directory-tree";
  import { onMount, onDestroy } from "svelte";
  import { formatFileUrl } from "../utils";

  let clazz = "";
  export { clazz as class };

  export let videoPath: DirectoryTree | undefined;
  export let subsUrl: string;
  export let offset: number;
  export let paused = true;
  export let currentTime = 0;
  let video: HTMLVideoElement;
  let lastAppliedOffset = 0;
  let offsetUpdateInterval: number;

  onMount(() => {
    offsetUpdateInterval = window.setInterval(() => {
      // Check if we have received a new offset to apply
      if (lastAppliedOffset !== offset) {
        applyOffset(offset - lastAppliedOffset);
        lastAppliedOffset = offset;
      }
    }, 100);
  });

  onDestroy(() => {
    window.clearInterval(offsetUpdateInterval);
  });

  async function applyOffset(off: number) {
    if (video === undefined || subsUrl === "") {
      return;
    }

    const track = Array.from(video.textTracks)[0];
    if (track.cues!.length === 0) {
      return;
    }

    // track.cues has an iterator but TS seems unaware of this?
    [...(track.cues as any)].forEach((cue) => {
      cue.startTime += off;
      cue.endTime += off;
    });
  }
</script>

<div class={clazz}>
  <!-- TODO investigate alternative video players (video.js perhaps?) as currentTime skips a bit when pausing/playing -->
  <video
    autoplay
    bind:this={video}
    bind:currentTime
    bind:paused
    class="w-full h-full outline-none"
    src={formatFileUrl(videoPath)}
    controls
  >
    <track default kind="captions" src={subsUrl} />
  </video>
</div>
