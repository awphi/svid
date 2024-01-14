// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { ipcRenderer, contextBridge } from "electron";

// TODO remove this awful abstraction and use something like trpc
import { makeApiRenderer } from "../main/api";

contextBridge.exposeInMainWorld("api", makeApiRenderer(ipcRenderer));

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element != null) {
      element.innerText = text;
    }
  };

  for (const dependency of ["chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]!);
  }
});
