// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { ipcRenderer, contextBridge } from "electron";
import { makeApiRenderer } from "./api";

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
