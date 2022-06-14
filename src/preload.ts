// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { ipcRenderer, contextBridge } from "electron";
import { API } from "./api";

const apiGrouped: { [name: string]: { [name: string]: (...args: any[]) => Promise<any> } } = {};

Object.keys(API).forEach((k) => {
  const split = k.split(":");

  if (split.length !== 2) {
    console.error(`Malformed API key ${k} - must be in the form 'module:method'. Skipping...`);
    return;
  }

  if (!(split[0] in apiGrouped)) {
    apiGrouped[split[0]] = {};
  }

  apiGrouped[split[0]][split[1]] = (...args: any[]) => ipcRenderer.invoke(k, ...args);
});

console.log(apiGrouped);
contextBridge.exposeInMainWorld("api", apiGrouped);

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
