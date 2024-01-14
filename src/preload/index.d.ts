import type { API } from "../main/api";

declare global {
  interface Window {
    api: API;
  }
}
