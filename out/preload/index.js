"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  startJiggle: (interval) => electron.ipcRenderer.invoke("start-jiggle", interval),
  stopJiggle: () => electron.ipcRenderer.invoke("stop-jiggle")
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
