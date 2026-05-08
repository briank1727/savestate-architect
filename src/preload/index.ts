import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  profiles: {
    list: () => ipcRenderer.invoke('profiles:list'),
    listSummaries: () => ipcRenderer.invoke('profiles:list-summaries'),
    pickFolder: () => ipcRenderer.invoke('profiles:pick-folder'),
    importFromFolder: (name: string, folderPath: string) =>
      ipcRenderer.invoke('profiles:import-from-folder', name, folderPath),
    importCurrent: (name: string) => ipcRenderer.invoke('profiles:import-current', name),
    delete: (name: string) => ipcRenderer.invoke('profiles:delete', name)
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
