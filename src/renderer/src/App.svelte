<script lang="ts">
  import type { DirectoryTree } from "directory-tree";
  import type { FileFilter } from "electron";
  import { getVttSubsUrl } from "./lib/utils";
  import VideoPlayer from "./lib/components/VideoPlayer.svelte";
  import SourceSelector from "./lib/components/SourceSelector.svelte";
  import AudioTrack from "./lib/components/AudioTrack.svelte";
  import SubTrack from "./lib/components/SubTrack.svelte";
  import {
    subsDirectoryTrees,
    videoDirectoryTrees,
    preferences,
  } from "./lib/stores";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import StatusBar from "./lib/components/StatusBar.svelte";

  const pxpersecond = 100;
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
</script>

<div class="h-full w-full flex flex-col">
  <Splitpanes horizontal={false} theme="flex-1">
    <Pane
      bind:size={$preferences.sourceSelectorPaneSize}
      class="grid grid-rows-2"
      minSize={20}
    >
      <SourceSelector
        filters={videoFilters}
        bind:selection={selectedVideo}
        trees={videoDirectoryTrees}
        title="Videos"
      />
      <SourceSelector
        filters={subsFilters}
        bind:selection={selectedSubs}
        trees={subsDirectoryTrees}
        title="Subtitles"
      />
    </Pane>
    <Pane>
      <Splitpanes theme="" horizontal={true}>
        <Pane>
          <VideoPlayer
            class="bg-black w-full h-full"
            bind:currentTime={videoPoint}
            offset={subsOffset}
            videoPath={selectedVideo}
            {subsUrl}
            {paused}
          />
        </Pane>
        <Pane
          bind:size={$preferences.visPaneSize}
          minSize={25}
          class="flex flex-col bg-neutral-800"
        >
          <SubTrack
            {subsUrl}
            {pxpersecond}
            point={videoPoint}
            bind:offset={subsOffset}
          />
          <div class="h-[1px] bg-neutral-900 w-full"></div>
          <AudioTrack {selectedVideo} point={videoPoint} {pxpersecond} />
        </Pane>
      </Splitpanes>
    </Pane>
  </Splitpanes>
  <StatusBar {subsOffset} />
</div>

<style>
</style>
