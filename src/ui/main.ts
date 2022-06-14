import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";

createApp(App).mount("#app");

declare global {
  interface Window {
    api: any;
  }

  // TODO redo this to work with dirTree
  interface Folder {
    name: string;
    files: FilePath[];
  }

  interface FilePath {
    name: string;
    exactPath: string;
  }
}
