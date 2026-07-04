// IPC 调用封装层 — 类型安全的 API 抽象
import type { DetectionConfig, ShortcutConfig, AnalysisDebug, GameState } from '../../electron/types/ipc'

/** Electron API 接口类型 */
export interface ElectronAPI {
  // 检测控制
  startDetection(): Promise<void>
  stopDetection(): Promise<void>
  getConfig(): Promise<DetectionConfig>
  updateConfig(config: DetectionConfig): Promise<void>
  // 悬浮窗控制
  showOverlay(): Promise<void>
  hideOverlay(): Promise<void>
  setClickThrough(ignore: boolean): Promise<void>
  // 快捷键
  registerShortcut(accelerator: string, action: string): Promise<boolean>
  getShortcuts(): Promise<ShortcutConfig>
  // 存储
  getStore<T>(key: string): Promise<T>
  setStore(key: string, value: unknown): Promise<void>
  // 抖音
  setDouyinUrl(url: string): Promise<void>
  getDouyinUrl(): Promise<string>
  // 事件监听
  on(channel: string, callback: (data: unknown) => void): (() => void) | undefined
}

/** 全局类型声明 */
declare global {
  interface Window {
    electronAPI: ElectronAPI
    overlayAPI: {
      on(channel: string, callback: (data: unknown) => void): (() => void) | undefined
    }
  }
}

/** 获取 Electron API */
export function getApi(): ElectronAPI {
  if (!window.electronAPI) {
    throw new Error('Electron API not available. Make sure preload script is loaded.')
  }
  return window.electronAPI
}

/** 事件 payload 类型映射 */
export interface GameStateChangedPayload {
  state: GameState
  saturation: number
  grayscale_ratio: number
  center_white: number
  bottom_colorful: number
}

export type { DetectionConfig, ShortcutConfig, AnalysisDebug, GameState }
