// IPC 处理器 — 注册所有 ipcMain.handle
import { ipcMain } from 'electron'
import { IPC_CHANNELS, type DetectionConfig } from '../types/ipc'
import { detectionLoop, getDetectionConfig } from './detection-loop'
import { showOverlay, hideOverlay, destroyOverlay, setClickThrough } from './window-manager'
import { shortcutManager } from './global-shortcut'
import { loadUrl, getDouyinUrl, ensureOverlayContent } from './overlay-content'
import { get, set } from './store'
import type { AppDatabase } from '../types/ipc'

/** 注册所有 IPC 处理器 */
export function registerIpcHandlers(): void {
  // === 检测控制 ===
  ipcMain.handle(IPC_CHANNELS.DETECTION_START, async () => {
    console.log('[ipc] DETECTION_START handler called')
    const config = getDetectionConfig()
    console.log('[ipc] Detection config:', JSON.stringify(config))
    detectionLoop.start(config)
    console.log('[ipc] DETECTION_START completed, isRunning:', detectionLoop.isRunning())
  })

  ipcMain.handle(IPC_CHANNELS.DETECTION_STOP, async () => {
    detectionLoop.stop()
  })

  ipcMain.handle(IPC_CHANNELS.DETECTION_GET_CONFIG, async (): Promise<DetectionConfig> => {
    return get('detection')
  })

  ipcMain.handle(IPC_CHANNELS.DETECTION_UPDATE_CONFIG, async (_event, config: DetectionConfig) => {
    detectionLoop.updateConfig(config)
  })

  // === 悬浮窗控制 ===
  ipcMain.handle(IPC_CHANNELS.OVERLAY_SHOW, async () => {
    console.log('[ipc] OVERLAY_SHOW handler called')
    showOverlay()
    ensureOverlayContent()
    console.log('[ipc] OVERLAY_SHOW completed')
  })

  ipcMain.handle(IPC_CHANNELS.OVERLAY_HIDE, async () => {
    hideOverlay()
  })

  ipcMain.handle('overlay:destroy', async () => {
    destroyOverlay()
  })

  ipcMain.handle(IPC_CHANNELS.OVERLAY_SET_CLICK_THROUGH, async (_event, ignore: boolean) => {
    setClickThrough(ignore)
  })

  // === 快捷键 ===
  ipcMain.handle(IPC_CHANNELS.SHORTCUT_REGISTER, async (_event, { accelerator, action }) => {
    return shortcutManager.register(accelerator, action)
  })

  ipcMain.handle(IPC_CHANNELS.SHORTCUT_GET_ALL, async () => {
    return shortcutManager.getShortcuts()
  })

  // === 存储读写 ===
  ipcMain.handle(IPC_CHANNELS.STORE_GET, async (_event, key: keyof AppDatabase) => {
    return get(key)
  })

  ipcMain.handle(IPC_CHANNELS.STORE_SET, async (_event, key: keyof AppDatabase, value: unknown) => {
    await set(key, value as never)
  })

  // === 抖音 ===
  ipcMain.handle(IPC_CHANNELS.DOUYIN_SET_URL, async (_event, url: string) => {
    loadUrl(url)
  })

  ipcMain.handle(IPC_CHANNELS.DOUYIN_GET_URL, async (): Promise<string> => {
    return getDouyinUrl()
  })

  console.log('[ipc] All handlers registered')
}
