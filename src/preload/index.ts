import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ApiHandlers } from '../api/apis'
import handlers from '../main/handlers'
import * as path from 'path'

// Custom APIs for renderer
const api: Partial<ApiHandlers> = {}

for (const apiName in handlers) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api[apiName] = (req: any): Promise<any> => ipcRenderer.invoke(apiName, req)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('path', path)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.path = path
}
