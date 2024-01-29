<script setup lang="ts">
  import { setCanvasSize } from "./vis-utils";
  import { onMount } from "svelte";
  import type { DirectoryTree } from "directory-tree";
  import WaveformData from "waveform-data";
  import { clamp, ipcClient } from "./utils";
  import { Reload } from "radix-icons-svelte";

  let canvas: HTMLCanvasElement;
  let canvasContainer: HTMLDivElement;
  let processing = false;
  let waveform: WaveformData | null = null;
  let abort = false;

  export let selectedVideo: DirectoryTree | undefined;
  export let point = 0;
  export let pxpersecond: number;

  $: {
    if (selectedVideo === undefined) {
      processing = false;
      waveform = null;
      abort = true;
    } else {
      processing = true;
      abort = false;
      ipcClient.decodeAudioDataFromPath
        .query({ filePath: selectedVideo.path, pxpersecond })
        .then((data) => {
          if (abort) {
            return;
          }
          console.log(data);
          waveform = WaveformData.create(data);
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

  async function redraw(point: number, waveform: WaveformData | null) {
    if (canvas === undefined || canvasContainer === undefined) {
      return;
    }

    const ctx = canvas.getContext("2d")!;

    setCanvasSize(canvas, ctx);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (processing || waveform === null) {
      return;
    }

    const channel = waveform.channel(0);

    const startIdx = waveform.at_time(point);
    const endIdx = Math.min(
      waveform.at_time(point + waveform.seconds_per_pixel * canvas.width),
      waveform.length,
    );

    // Loop forwards, drawing the upper half of the waveform
    for (let x = startIdx; x < endIdx; x++) {
      const val = channel.max_sample(x);
      // Offset our line draws to be positioned with origin at the left edge
      ctx.lineTo(x - startIdx, getYFromAmplitude(val));
    }

    // Loop backwards, drawing the lower half of the waveform
    for (let x = endIdx - 1; x >= startIdx; x--) {
      const val = channel.min_sample(x);
      ctx.lineTo(x - startIdx, getYFromAmplitude(val));
    }

    ctx.closePath();
    ctx.strokeStyle = "rgb(243, 244, 246)";
    ctx.fillStyle = "#0a0a0a";
    ctx.stroke();
    ctx.fill();
  }

  $: redraw(point, waveform);

  onMount(() => {
    const resizeObserver = new ResizeObserver(() => redraw(point, waveform));
    resizeObserver.observe(canvasContainer);
    redraw(point, waveform);

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
