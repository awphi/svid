import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import tailwindcss from "tailwindcss";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const BASE_CONFIG = {
  vite: {
    build: {
      rollupOptions: {
        external: [
          "cors",
          "express",
          "directory-tree",
          "fluent-audiowaveform",
          "@audiowaveform-installer/audiowaveform",
          "ffmpeg-static",
        ],
      },
    },
    resolve: {
      alias: {
        "./lib-cov/fluent-ffmpeg": "./lib/fluent-ffmpeg",
      },
    },
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    electron([
      {
        entry: "electron/main.ts",
        ...BASE_CONFIG,
      },
      {
        entry: "electron/preload.ts",
        onstart(options) {
          options.reload();
        },
        ...BASE_CONFIG,
      },
    ]),
  ],
});
