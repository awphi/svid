<script lang="ts">
  import prettyMilliseconds from "pretty-ms";
  import { Waveform, Subtitles, ArrowsClockwise } from "phosphor-svelte";
  import { waveformInfo } from "../stores";
  import { tweened } from "svelte/motion";

  export let subsOffset: number;

  let prettyOffset: string = "";
  $: prettyOffset =
    (subsOffset >= 0 ? "+" : "-") +
    prettyMilliseconds(Math.abs(subsOffset) * 1000, {
      secondsDecimalDigits: 2,
    });

  const waveformPercentage = tweened(0);
  $: if ($waveformInfo.totalChunks > 0) {
    waveformPercentage.set(
      ($waveformInfo.loadedChunks / $waveformInfo.totalChunks) * 100,
    );
  }

  let waveformPercentageString: string = "0.0";
  $: waveformPercentageString = $waveformPercentage.toFixed(1);
</script>

<div
  class="w-full flex items-center bg-neutral-900 p-2 pt-1.5 text-sm border-t-[1px] border-neutral-900 gap-2"
>
  <div
    class="w-40 h-full bg-neutral-800 rounded-md relative flex items-center justify-center gap-1"
  >
    <div
      class="absolute left-0 top-0 h-full bg-neutral-950 rounded-md"
      style="width: {waveformPercentageString}%;"
    ></div>
    <Waveform weight="bold" class="absolute left-1" />
    <span class="z-10">{waveformPercentageString}%</span>
  </div>
  <div class="flex-1"></div>
  <button
    class="bg-purple-800 rounded-md h-full px-2 flex gap-1 items-center hover:bg-purple-900"
  >
    <span>Auto-Sync</span>
    <ArrowsClockwise></ArrowsClockwise>
  </button>
  <div class="bg-neutral-800 rounded-md px-2 py-0.5 flex items-center gap-1">
    <Subtitles />
    <span class="w-16 flex-1 text-right">
      {prettyOffset}
    </span>
  </div>
</div>
