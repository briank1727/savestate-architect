import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  profiles: {
    list: () => ipcRenderer.invoke('profiles:list'),
    listSummaries: () => ipcRenderer.invoke('profiles:list-summaries'),
    pickFolder: () => ipcRenderer.invoke('profiles:pick-folder'),
    readFromFolder: (name: string, folderPath: string) =>
      ipcRenderer.invoke('profiles:read-from-folder', name, folderPath),
    readCurrent: (name: string) => ipcRenderer.invoke('profiles:read-current', name),
    save: (profile: { name: string; savestates: object[][] }) =>
      ipcRenderer.invoke('profiles:save', profile),
    delete: (name: string) => ipcRenderer.invoke('profiles:delete', name),
    openFolder: (name: string) => ipcRenderer.invoke('profiles:open-folder', name)
  }
}

export type Api = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
