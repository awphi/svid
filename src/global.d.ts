import { API } from "../electron/api";

// Shim to make main.ts accept importing App.vue
declare module "*.vue";
declare module "*.svelte";

declare global {
  interface Window {
    api: API;
  }
}
