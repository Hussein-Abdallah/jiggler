"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  startJiggling: (interval) => electron.ipcRenderer.send("start-jiggling", interval),
  stopJiggling: () => electron.ipcRenderer.send("stop-jiggling")
});
