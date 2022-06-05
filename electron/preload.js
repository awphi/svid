// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer, contextBridge } = require("electron");
const api = require("./api");

const apiGrouped = {};

Object.keys(api).forEach((k) => {
  const split = k.split(":");

  if (split.length !== 2) {
    console.error(`Malformed API key ${k} - must be in the form 'module:method'. Skipping...`);
    return;
  }

  if (!(split[0] in apiGrouped)) {
    apiGrouped[split[0]] = {};
  }

  const map = apiGrouped[split[0]];
  map[split[1]] = (args) => ipcRenderer.invoke(k, args);
});

for (let k of Object.keys(apiGrouped)) {
  contextBridge.exposeInMainWorld(k, apiGrouped[k]);
}

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element != null) {
      element.innerText = text;
    }
  };

  for (const dependency of ["chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});
