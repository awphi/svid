<script setup lang="ts">
  import { clipText, setCanvasSize } from "./vis-utils";
  import { parse } from "@plussub/srt-vtt-parser";
  import { onDestroy, onMount } from "svelte";

  interface Subtitle {
    id: string;
    from: number;
    to: number;
    text: string;
  }

  const blockHeight = 20;
  let canvas: HTMLCanvasElement;
  let canvasContainer: HTMLDivElement;
  let subs: Subtitle[] = [];

  export let subsUrl: string;
  export let pxpersecond: number;
  export let point = 0;
  export let bgColor = "rgb(82 82 82)";
  export let offset = 0;

  let clazz = "";
  export { clazz as class };

  async function redraw(point: number, offset: number, subs: Subtitle[]) {
    if (canvas === undefined || canvasContainer === undefined) {
      return;
    }

    const ctx = canvas.getContext("2d")!;

    setCanvasSize(canvas, ctx);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (subs.length === 0) {
      return;
    }

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

      ctx.fillStyle = "black";
      ctx.fillRect(x, y, w, blockHeight);

      ctx.strokeStyle = "white";
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
          }))
        )
        .then((parsed) => (subs = parsed));
    }
  }

  $: redraw(point, offset, subs);

  const resizeHandler = () => redraw(point, offset, subs);
  onMount(() => {
    window.addEventListener("resize", resizeHandler);
    redraw(point, offset, subs);
  });

  onDestroy(() => {
    window.removeEventListener("resize", resizeHandler);
  });
</script>

<div
  on:wheel={(e) => (offset += e.deltaY / 1000)}
  class={"bg-neutral-600 block relative flex-1 w-full h-0 " + clazz}
  bind:this={canvasContainer}
>
  <canvas class="h-full w-full" bind:this={canvas} />
</div>
