<script setup lang="ts">
  import { assignRows as assignRows, clamp, clipText } from "../utils";
  import { parse } from "@plussub/srt-vtt-parser";
  import { onDestroy } from "svelte";
  import { AutosizingCanvas } from "../autosizing-canvas";
  import type { Subtitle } from "../types";

  export let pxpersecond: number;

  export let subsUrl: string;
  export let point: number = 0;
  export let offset: number = 0;
  export let blockColor: string = "#0a0a0a";

  let subs: Subtitle[] = [];
  let rows: number = 1;
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
    const rowHeight = Math.round(canvas.height / rows);
    const blockHeight = Math.min(Math.round(rowHeight * 0.8), 40);
    const blockPadding = (rowHeight - blockHeight) / 2;
    const fontSize = Math.round(Math.min(blockHeight - 8, 16));

    ctx.font = `${fontSize}px sans-serif`;

    for (var i = 0; i < subs.length; i++) {
      const sub = subs[i];
      const dur = sub.end - sub.start;

      const x = (sub.start - point + offset) * pxpersecond;
      const w = dur * pxpersecond;
      if (x > canvas.width) {
        continue;
      } else if (x + w < 0) {
        continue;
      }

      const y = sub.row * rowHeight + blockPadding;

      ctx.fillStyle = blockColor;
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
        .then((text) => {
          // create the new subs
          const entries = parse(text + "\n").entries;
          const newSubs = entries.map((v) => ({
            id: v.id.trim(),
            text: v.text,
            start: v.from / 1000,
            end: v.to / 1000,
            row: 0,
          }));
          rows = assignRows(newSubs);
          subs = newSubs;
        });
    }
  }

  $: [point, offset, subs, blockColor] && asc?.draw();

  onDestroy(() => asc.destroy());
</script>

<div
  on:wheel={(e) => (offset += e.deltaY / 1000)}
  class="block relative flex-1 w-full h-0"
  bind:this={canvasContainer}
></div>
