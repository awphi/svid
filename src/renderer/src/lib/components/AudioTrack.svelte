<script setup lang="ts">
  import { onDestroy } from "svelte";
  import type { DirectoryTree } from "directory-tree";
  import { clamp, ipcClient } from "../utils";
  import { ArrowClockwise } from "phosphor-svelte";
  import { WaveformAPIConsumer } from "../wav-api-consumer";
  import { AutosizingCanvas } from "../autosizing-canvas";
  import { waveformInfo } from "../stores";

  let processing = false;
  let waveform: WaveformAPIConsumer | undefined;
  let canvasContainer: HTMLDivElement;
  let asc: AutosizingCanvas;
  $: if (canvasContainer) {
    asc = new AutosizingCanvas(canvasContainer, draw);
  }

  export let selectedVideo: DirectoryTree | undefined;
  export let point = 0;
  export let pxpersecond: number;
  export let maxChunkSize: number = 120;

  // externalized as function to avoid infinite reactivity cycle
  function destroyWaveform(): void {
    if (waveform) {
      waveform.destroy();
      waveform = undefined;
    }
  }

  function onWaveformChunkLoad(): void {
    draw();
    if (waveform) {
      waveformInfo.set(waveform.info());
    }
  }

  $: {
    if (selectedVideo === undefined) {
      processing = false;
      destroyWaveform();
    } else {
      let filePath = selectedVideo.path;
      processing = true;
      ipcClient.prepareAudioWaveformRecoder
        .query({ filePath, pxpersecond, maxChunkSize })
        .then((data) => {
          if (filePath !== selectedVideo?.path) {
            return;
          }
          waveform = new WaveformAPIConsumer(data, onWaveformChunkLoad);
          processing = false;
        });
    }
  }

  function getYFromAmplitude(amplitude: number, padding = 5): number {
    // We use 16 bit output from audiowaveform so scale within range 2^16
    const scaledAmplitude = clamp(amplitude / 2 ** 16, -1, 1);
    const halfHeight = asc.canvas.height / 2;
    return halfHeight - scaledAmplitude * (halfHeight - padding);
  }

  async function draw() {
    if (asc === undefined || processing || waveform === undefined) {
      return;
    }

    const { ctx, canvas } = asc;
    const startIdx = Math.round(pxpersecond * point);
    const endIdx = Math.min(startIdx + canvas.width, waveform.pxLength);

    // Loop forwards, drawing the upper half of the waveform
    for (let x = startIdx; x < endIdx; x++) {
      const val = waveform.sample(x, "max");
      // Offset our line draws to be positioned with origin at the left edge
      ctx.lineTo(x - startIdx, getYFromAmplitude(val));
    }

    // Loop backwards, drawing the lower half of the waveform
    for (let x = endIdx - 1; x >= startIdx; x--) {
      const val = waveform.sample(x, "min");
      ctx.lineTo(x - startIdx, getYFromAmplitude(val));
    }

    ctx.closePath();
    ctx.strokeStyle = "rgb(243, 244, 246)";
    ctx.fillStyle = "#0a0a0a";
    ctx.stroke();
    ctx.fill();
  }

  // looks silly but just marks `point` and `waveform` as reactive inputs
  $: [point, waveform] && asc?.draw();

  onDestroy(() => asc.destroy());
</script>

<div
  class="relative flex-1 w-full h-0 flex items-center justify-center"
  bind:this={canvasContainer}
>
  {#if processing}
    <div class="absolute flex flex-col items-center gap-2">
      <ArrowClockwise class="animate-spin" />
      <span class="text-xs">Processing audio data</span>
    </div>
  {/if}
</div>
