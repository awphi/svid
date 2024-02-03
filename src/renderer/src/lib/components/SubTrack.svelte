<script setup lang="ts">
  import { clipText } from "../utils";
  import { parse } from "@plussub/srt-vtt-parser";
  import { onDestroy } from "svelte";
  import { AutosizingCanvas } from "../autosizing-canvas";

  interface Subtitle {
    id: string;
    from: number;
    to: number;
    text: string;
  }

  export let blockHeight: number = 20;
  export let subsUrl: string;
  export let pxpersecond: number;
  export let point: number = 0;
  export let offset: number = 0;

  let subs: Subtitle[] = [];
  let canvasContainer: HTMLDivElement;
  let asc: AutosizingCanvas;
  $: if (canvasContainer) {
    asc = new AutosizingCanvas(canvasContainer, draw);
  }

  async function draw() {
    if (subs.length === 0) {
      return;
    }

    const { canvas, ctx } = asc;

    for (var i = 0; i < subs.length; i++) {
      const sub = subs[i];
      const dur = sub.to - sub.from;

      const x = (sub.from - point + offset) * pxpersecond;
      const y = canvas.height / 2 / devicePixelRatio - blockHeight / 2;
      const w = dur * pxpersecond;
      if (x > canvas.width) {
        continue;
      } else if (x + w < 0) {
        continue;
      }

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(x, y, w, blockHeight);

      ctx.strokeStyle = "rgb(243, 244, 246)";
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + blockHeight);
      ctx.stroke();

      const text = clipText(ctx, sub.text, w);
      const metrics = ctx.measureText(text);
      const textPad = 5;
      const textY =
        y +
        blockHeight / 2 +
        (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) / 4;
      const textX = x + textPad;

      ctx.fillStyle = "white";
      ctx.fillText(clipText(ctx, sub.text, w - 2 * textPad), textX, textY);
    }
  }

  $: {
    if (subsUrl === "") {
      subs = [];
    } else {
      fetch(subsUrl)
        .then((r) => r.text())
        .then((t) => parse(t + "\n").entries)
        .then((entries) =>
          entries.map((v) => ({
            ...v,
            from: v.from / 1000,
            to: v.to / 1000,
          })),
        )
        .then((parsed) => (subs = parsed));
    }
  }

  $: [point, offset, subs] && asc?.draw();

  onDestroy(() => asc.destroy());
</script>

<div
  on:wheel={(e) => (offset += e.deltaY / 1000)}
  class="block relative flex-1 w-full h-0"
  bind:this={canvasContainer}
></div>
