import type { JsonWaveformData } from "waveform-data";
import ffmpegPath from "ffmpeg-static";
import { path as ffprobePath } from "ffprobe-static";
import { path as audiowaveformPath } from "@audiowaveform-installer/audiowaveform";
import { app } from "electron";
import Ffmpeg from "fluent-ffmpeg";
import { spawn } from "child_process";

// Ensure we access the unpacked binaries if app is packaged
function getBinaryPathInAsar(path: string): string {
  return app.isPackaged ? path.replace("app.asar", "app.asar.unpacked") : path;
}

export const binaries = {
  ffmpeg: getBinaryPathInAsar(ffmpegPath!),
  ffprobe: getBinaryPathInAsar(ffprobePath),
  audiowaveform: getBinaryPathInAsar(audiowaveformPath),
} as const;

function getVideoMetadata(path: string): Promise<Ffmpeg.FfprobeData> {
  return new Promise((res, rej) => {
    Ffmpeg()
      .setFfprobePath(binaries.ffprobe)
      .input(path)
      .ffprobe((err, data) => {
        if (err) {
          rej(err);
          return;
        }

        res(data);
      });
  });
}

function getAudioChunk(
  path: string,
  startTime: number,
  duration: number,
  pxpersecond: number,
): Promise<JsonWaveformData> {
  return new Promise<JsonWaveformData>((res) => {
    let tick = Date.now();

    // Spawn the audiowaveform child process
    const proc = spawn(binaries.audiowaveform, [
      "--input-file",
      "-",
      "--input-format",
      "wav",
      "--output-format",
      "json",
      "--output-file",
      "-",
      "--quiet",
      "--pixels-per-second",
      String(pxpersecond),
    ]);

    // Spawn the ffmpeg command - use wav as its uncompressed so very fast to decode
    Ffmpeg()
      .setFfmpegPath(binaries.ffmpeg)
      .input(path)
      .setStartTime(startTime)
      .duration(duration)
      .audioChannels(1)
      .addOption("-map", "a")
      .format("wav")
      .noVideo()
      .pipe(proc.stdin, { end: true });

    const bufs: Buffer[] = [];
    proc.stdout.on("data", (b: Buffer) => bufs.push(b));
    proc.on("exit", async () => {
      console.log("waveform done in", Date.now() - tick);
      const json = JSON.parse(Buffer.concat(bufs).toString("utf-8"));
      res(json);
    });
  });
}

export interface AudioWaveformRecoderMetaData extends Ffmpeg.FfprobeData {
  chunks: number;
  pxpersecond: number;
  maxChunkLength: number;
}

/**
 * Helper class to allow for the lookup of arbritrary 'chunks' of audiowaveform JSON data.
 * First works out how many chunks of waveform data a given file will contain, then provides methods
 * to fetch them. These will either be retrieved from the cache or generated on the fly.
 * Also allows for pre-caching of the next missing chunk.
 */
export class AudioWaveformRecoder {
  public readonly metadata: AudioWaveformRecoderMetaData;

  private constructor(
    private path: string,
    private maxChunkLength: number,
    private chunks: (JsonWaveformData | undefined)[],
    private pxpersecond: number,
    meta: Ffmpeg.FfprobeData,
  ) {
    this.metadata = {
      ...meta,
      chunks: chunks.length,
      maxChunkLength,
      pxpersecond,
    };
  }

  static async create(
    path: string,
    maxChunkLength: number,
    pxpersecond: number,
  ): Promise<AudioWaveformRecoder> {
    const meta = await getVideoMetadata(path);
    const duration = Math.ceil(meta.format.duration ?? 0);
    if (duration < 0) {
      throw new Error(`Invalid metadata for file "${path}".`);
    }
    const chunks: undefined[] = new Array(
      Math.ceil(duration / maxChunkLength),
    ).fill(undefined);
    console.log(`Chunk length: ${maxChunkLength}. Chunks: ${chunks.length}`);

    return new AudioWaveformRecoder(
      path,
      maxChunkLength,
      chunks,
      pxpersecond,
      meta,
    );
  }

  async get(index: number): Promise<JsonWaveformData | undefined> {
    if (index < 0 || index >= this.chunks.length) {
      return undefined;
    } else if (this.has(index)) {
      return this.chunks[index]!;
    }

    const startTime = index * this.maxChunkLength;
    this.chunks[index] = await getAudioChunk(
      this.path,
      startTime,
      this.maxChunkLength,
      this.pxpersecond,
    );
    return this.chunks[index];
  }

  has(index: number): boolean {
    return !!this.chunks[index];
  }
}
