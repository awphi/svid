<script setup lang="ts">
  import { setCanvasSize } from "./vis-utils";
  import Icon from "@iconify/svelte";
  import { onDestroy, onMount } from "svelte";
  import type { DirectoryTree } from "directory-tree";
  import WaveformData, { type JsonWaveformData } from "waveform-data";

  let canvas: HTMLCanvasElement;
  let canvasContainer: HTMLDivElement;
  let processing = false;
  let waveform: WaveformData | null = undefined;
  let abort = false;

  export let selectedVideo: DirectoryTree;
  export let point = 0;
  export let bgColor = "rgb(82 82 82)";
  export let pxpersecond: number;

  $: {
    if (selectedVideo === undefined) {
      processing = false;
      waveform = undefined;
      abort = true;
    } else {
      processing = true;
      abort = false;
      window.api.audio
        .decodeAudioDataFromPath(selectedVideo.path, pxpersecond)
        .then((data: JsonWaveformData) => {
          if (abort) {
            return;
          }
          console.log(data);
          waveform = WaveformData.create(data);
          processing = false;
        });
    }
  }

  async function redraw(point: number, waveform: WaveformData | undefined) {
    if (canvas === undefined || canvasContainer === undefined) {
      return;
    }

    const ctx = canvas.getContext("2d")!;

    setCanvasSize(canvas, ctx);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (processing || waveform === undefined) {
      return;
    }

    const scaleY = (
      amplitude: number,
      height: number,
      pad: number = 0,
      offset: number = 0
    ) => {
      // We use 16 bit output from audiowaveform so scale within range 2^16 + some padding
      const range = 2 ** 16 + pad;
      // Draw in the middle of the canvas considering devicePixelRatio
      return (
        height / devicePixelRatio / 2 - ((amplitude + offset) * height) / range
      );
    };

    const channel = waveform.channel(0);

    const startIdx = waveform.at_time(point);
    const endIdx = Math.min(
      waveform.at_time(point + waveform.seconds_per_pixel * canvas.width),
      waveform.length
    );

    // Loop forwards, drawing the upper half of the waveform
    for (let x = startIdx; x < endIdx; x++) {
      const val = channel.max_sample(x);
      // Offset our line draws to be positioned with origin at the left edge
      ctx.lineTo(x - startIdx + 0.5, scaleY(val, canvas.height) + 0.5);
    }

    // Loop backwards, drawing the lower half of the waveform
    for (let x = endIdx - 1; x >= startIdx; x--) {
      const val = channel.min_sample(x);
      ctx.lineTo(x - startIdx + 0.5, scaleY(val, canvas.height) + 0.5);
    }

    ctx.closePath();
    ctx.strokeStyle = "white";
    ctx.fillStyle = "black";
    ctx.stroke();
    ctx.fill();
  }

  $: redraw(point, waveform);

  const resizeHandler = () => redraw(point, waveform);
  onMount(() => {
    window.addEventListener("resize", resizeHandler);
    redraw(point, waveform);
  });

  onDestroy(() => {
    window.removeEventListener("resize", resizeHandler);
  });
</script>

<div
  class="bg-neutral-600 relative flex-1 w-full h-0 flex items-center justify-center"
  bind:this={canvasContainer}
>
  {#if processing}
    <div class="absolute text-neutral-200">
      <Icon class="w-20 h-20" icon="eos-icons:three-dots-loading" />
      <span class="text-xs">Processing audio data</span>
    </div>
  {/if}

  <canvas class="h-full w-full" bind:this={canvas} />
</div>
