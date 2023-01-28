<script lang="ts">
  import type { DirectoryTree } from "directory-tree";
  import type { FileFilter } from "electron";
  import Icon from "@iconify/svelte";
  import { getVttSubsUrl } from "./lib/utils";
  import prettyMilliseconds from "pretty-ms";
  import VideoPlayer from "./lib/VideoPlayer.svelte";
  import SourceSelector from "./lib/SourceSelector.svelte";
  import AudioTrack from "./lib/AudioTrack.svelte";
  import SubTrack from "./lib/SubTrack.svelte";
  import { onDestroy, onMount } from "svelte";

  const videoFilters: FileFilter[] = [
    { name: "Select Video", extensions: ["mp4", "mkv"] },
  ];
  const subsFilters: FileFilter[] = [
    { name: "Select Subs", extensions: ["srt", "ass", "vtt"] },
  ];

  let selectedVideo: DirectoryTree | undefined = undefined;
  let selectedSubs: DirectoryTree | undefined = undefined;
  let videoPoint = 0;
  let subsOffset = 0;
  let paused = true;

  let subsUrl = "";
  $: {
    if (selectedSubs !== undefined) {
      getVttSubsUrl(selectedSubs).then((url) => (subsUrl = url));
    } else {
      subsUrl = "";
    }
  }

  let prettyOffset: string = "";
  $: prettyOffset =
    (subsOffset >= 0 ? "+" : "-") +
    prettyMilliseconds(Math.abs(subsOffset) * 1000, {
      secondsDecimalDigits: 2,
    });
</script>

<div class="h-full w-full flex">
  <div class="bg-neutral-600 flex flex-col w-1/5 min-w-[200px]">
    <SourceSelector
      id="video"
      filters={videoFilters}
      bind:selection={selectedVideo}
      class="h-1/2"
      title="Videos"
    />
    <SourceSelector
      id="subs"
      filters={subsFilters}
      bind:selection={selectedSubs}
      class="h-1/2"
      title="Subtitles"
    />
  </div>
  <div class="flex flex-col h-full border-neutral-800 border-l-[1px] flex-1">
    <VideoPlayer
      class="h-2/3 bg-black"
      bind:currentTime={videoPoint}
      offset={subsOffset}
      videoPath={selectedVideo}
      {subsUrl}
      {paused}
    />
    <SubTrack
      class="border-y-[1px] border-neutral-800"
      {subsUrl}
      pxpersecond={100}
      point={videoPoint}
      bind:offset={subsOffset}
    />
    <AudioTrack {selectedVideo} point={videoPoint} pxpersecond={100} />
    <div
      class="w-full h-6 flex bg-neutral-700 text-gray-100 text-sm border-neutral-800 border-t-[1px]"
    >
      <div class="flex-1 flex h-full items-center">
        <Icon class="mr-1 ml-1" icon="bx:video" />
        <h1>{selectedVideo ? selectedVideo.name : ""}</h1>
      </div>
      <div class=" w-[1px] mx-1 h-full bg-neutral-800" />
      <div class="flex-1 flex h-full items-center">
        <Icon class="mr-1" icon="fluent:subtitles-16-regular" />
        <h1>{selectedSubs ? selectedSubs.name : ""}</h1>
        <div class="flex-1" />
        <h1 class="mr-1">{prettyOffset}</h1>
      </div>
    </div>
  </div>
</div>

<style>
</style>
