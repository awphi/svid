<script setup lang="ts">
  import { setCanvasSize } from "./vis-utils";
  import { onMount } from "svelte";
  import type { DirectoryTree } from "directory-tree";
  import { clamp, ipcClient } from "./utils";
  import { Reload } from "radix-icons-svelte";
  import { MultiWaveform } from "./multi-waveform";

  let canvas: HTMLCanvasElement;
  let canvasContainer: HTMLDivElement;
  let processing = false;
  let waveform: MultiWaveform | null = null;

  export let selectedVideo: DirectoryTree | undefined;
  export let point = 0;
  export let pxpersecond: number;
  export let maxChunkSize: number = 120;

  $: {
    if (selectedVideo === undefined) {
      processing = false;
      waveform = null;
    } else {
      let filePath = selectedVideo.path;
      processing = true;
      ipcClient.prepareAudioWaveformRecoder
        .query({ filePath, pxpersecond, maxChunkSize })
        .then((data) => {
          if (filePath !== selectedVideo?.path) {
            return;
          }
          waveform = new MultiWaveform(data, redraw);
          processing = false;
        });
    }
  }

  function getYFromAmplitude(amplitude: number, padding = 5): number {
    // We use 16 bit output from audiowaveform so scale within range 2^16
    const scaledAmplitude = clamp(amplitude / 2 ** 16, -1, 1);
    const halfHeight = canvas.height / 2;
    return halfHeight - scaledAmplitude * (halfHeight - padding);
  }

  async function redraw() {
    if (
      canvas === undefined ||
      canvasContainer === undefined ||
      processing ||
      waveform === null
    ) {
      return;
    }

    const ctx = canvas.getContext("2d")!;
    setCanvasSize(canvas, ctx);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  $: {
    [point, waveform];
    redraw();
  }

  onMount(() => {
    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(canvasContainer);
    redraw();

    return () => {
      resizeObserver.disconnect();
    };
  });
</script>

<div
  class="relative flex-1 w-full h-0 flex items-center justify-center"
  bind:this={canvasContainer}
>
  {#if processing}
    <div class="absolute flex flex-col items-center gap-2">
      <Reload class="animate-spin" />
      <span class="text-xs">Processing audio data</span>
    </div>
  {/if}

  <canvas class="h-full w-full" bind:this={canvas} />
</div>
