// 设置窗口 preload — 通过 contextBridge 暴露类型安全的 API
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from '../types/ipc'

const validEventChannels = [
  IPC_CHANNELS.EVENT_GAME_STATE_CHANGED,
  IPC_CHANNELS.EVENT_ANALYSIS_DEBUG,
  IPC_CHANNELS.EVENT_OVERLAY_VISIBILITY_CHANGED,
  IPC_CHANNELS.EVENT_DETECTION_STATUS_CHANGED
] as const

const api = {
  // === 检测控制 ===
  startDetection: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.DETECTION_START),
  stopDetection: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.DETECTION_STOP),
  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.DETECTION_GET_CONFIG),
  updateConfig: (config: unknown): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.DETECTION_UPDATE_CONFIG, config),

  // === 悬浮窗控制 ===
  showOverlay: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_SHOW),
  hideOverlay: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_HIDE),
  setClickThrough: (ignore: boolean): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_SET_CLICK_THROUGH, ignore),

  // === 快捷键 ===
  registerShortcut: (accelerator: string, action: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.SHORTCUT_REGISTER, { accelerator, action }),
  getShortcuts: () => ipcRenderer.invoke(IPC_CHANNELS.SHORTCUT_GET_ALL),

  // === 存储 ===
  getStore: <T>(key: string): Promise<T> => ipcRenderer.invoke(IPC_CHANNELS.STORE_GET, key),
  setStore: (key: string, value: unknown): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.STORE_SET, key, value),

  // === 抖音 ===
  setDouyinUrl: (url: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.DOUYIN_SET_URL, url),
  getDouyinUrl: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.DOUYIN_GET_URL),

  // === 事件监听 ===
  on: (channel: string, callback: (data: unknown) => void): (() => void) | undefined => {
    if (validEventChannels.includes(channel as (typeof validEventChannels)[number])) {
      const handler = (_event: IpcRendererEvent, data: unknown): void => callback(data)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler)
    }
    return undefined
  }
}

export type SettingsAPI = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api)
    console.log('[preload] Settings API exposed successfully')
  } catch (error) {
    console.error('[preload] Failed to expose API:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electronAPI = api
  console.log('[preload] Settings API attached (non-isolated)')
}
