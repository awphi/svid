import WaveformData from "waveform-data";
import type { AudioWaveformRecoderMetaData } from "../../../main/wav-api";
import { ipcClient } from "./utils";

export class WaveformAPIConsumer {
  private chunks: (WaveformData | undefined)[];
  public readonly pxLength: number;
  private readonly chunkLengthPx: number;
  private loadingChunks: Set<number> = new Set();
  private destroyed: boolean = false;

  constructor(
    public readonly meta: AudioWaveformRecoderMetaData,
    private onLoad: () => void = () => {},
    eager: boolean = true,
  ) {
    this.chunks = new Array(meta.chunks).fill(undefined);
    this.pxLength = meta.pxpersecond * meta.format.duration!;
    this.chunkLengthPx = this.meta.maxChunkLength * this.meta.pxpersecond;
    if (eager) {
      this.eagerlyLoadAll();
    }
  }

  private async load(index: number): Promise<void> {
    if (
      this.loadingChunks.has(index) ||
      this.chunks[index] !== undefined ||
      this.destroyed
    ) {
      return;
    }

    this.loadingChunks.add(index);
    await ipcClient.getAudioWaveformChunk.query({ index }).then((data) => {
      this.loadingChunks.delete(index);
      if (!this.destroyed) {
        this.chunks[index] = WaveformData.create(data!);
        this.onLoad();
      }
    });
  }

  private async eagerlyLoadAll(): Promise<void> {
    for (let i = 0; i < this.meta.chunks; i++) {
      if (this.destroyed) {
        return;
      }
      await this.load(i);
    }
  }

  destroy(): void {
    this.destroyed = true;
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
