import WaveformData from "waveform-data";
import type { AudioWaveformRecoderMetaData } from "../../../main/audiowaveform-recoder";
import { ipcClient } from "./utils";

/**
 * Uses ipcClient.getAudioWaveformChunk to build a minimal WaveformData API we can use for visualization.
 */
export class MultiWaveform {
  private chunks: (WaveformData | undefined)[];
  public readonly pxLength: number;
  private readonly chunkLengthPx: number;
  private loadingChunks: Set<number> = new Set();

  constructor(
    public readonly meta: AudioWaveformRecoderMetaData,
    private onLoad: () => void = () => {},
  ) {
    this.chunks = new Array(meta.chunks).fill(undefined);
    this.pxLength = meta.pxpersecond * meta.format.duration!;
    this.chunkLengthPx = this.meta.maxChunkLength * this.meta.pxpersecond;
  }

  private async load(index: number): Promise<void> {
    if (this.loadingChunks.has(index) || this.chunks[index] !== undefined) {
      return;
    }

    this.loadingChunks.add(index);
    await ipcClient.getAudioWaveformChunk.query({ index }).then((data) => {
      this.chunks[index] = WaveformData.create(data!);
      this.loadingChunks.delete(index);
      this.onLoad();
    });
  }

  sample(px: number, operation: "max" | "min", ch: number = 0): number {
    const chunkIndex = Math.floor(px / this.chunkLengthPx);
    // start loading the required chunk - note we don't await
    this.load(chunkIndex);
    const waveform = this.chunks[chunkIndex];
    if (waveform === undefined) {
      return 0;
    }

    const index = px - chunkIndex * this.chunkLengthPx;
    const channel = waveform.channel(ch);
    return channel[`${operation}_sample`](index);
  }
}
