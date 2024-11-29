// Empty preload script - required by electron-vite
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  startJiggling: (interval: number) => ipcRenderer.send('start-jiggling', interval),
  stopJiggling: () => ipcRenderer.send('stop-jiggling')
})

export {}
