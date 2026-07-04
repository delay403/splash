// 悬浮窗 preload — 最小 API，仅接收状态更新
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

const validChannels = ['overlay-state-update'] as const

const api = {
  on: (channel: string, callback: (data: unknown) => void): (() => void) | undefined => {
    if (validChannels.includes(channel as (typeof validChannels)[number])) {
      const handler = (_event: IpcRendererEvent, data: unknown): void => callback(data)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler)
    }
    return undefined
  }
}

export type OverlayAPI = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('overlayAPI', api)
    console.log('[preload-overlay] Overlay API exposed successfully')
  } catch (error) {
    console.error('[preload-overlay] Failed to expose API:', error)
  }
} else {
  // @ts-ignore
  window.overlayAPI = api
  console.log('[preload-overlay] Overlay API attached (non-isolated)')
}
