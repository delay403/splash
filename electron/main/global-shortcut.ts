// 全局快捷键管理 — 用户自定义快捷键
import { globalShortcut } from 'electron'
import { get, set } from './store'
import { showOverlay, hideOverlay, getOverlayWindow } from './window-manager'
import { ensureOverlayContent } from './overlay-content'
import { detectionLoop } from './detection-loop'
import type { ShortcutConfig } from '../types/ipc'

type ShortcutAction = 'toggleOverlay' | 'toggleDetect'

/** 快捷键管理器 */
class ShortcutManager {
  private registered = new Map<string, string>() // action → accelerator

  /** 初始化：从 Lowdb 读取配置并注册 */
  init(): void {
    const config = get('shortcut')
    this.registerAction('toggleOverlay', config.toggleOverlay)
    this.registerAction('toggleDetect', config.toggleDetect)
  }

  /** 注册快捷键 */
  register(accelerator: string, action: string): boolean {
    // 先注销同 action 的旧快捷键
    const oldAccel = this.registered.get(action)
    if (oldAccel) {
      globalShortcut.unregister(oldAccel)
    }

    // 注册新快捷键
    const success = globalShortcut.register(accelerator, () => {
      this.dispatch(action as ShortcutAction)
    })

    if (success) {
      this.registered.set(action, accelerator)
      // 持久化
      const config = get('shortcut')
      const newConfig: ShortcutConfig = {
        ...config,
        [action]: accelerator
      }
      set('shortcut', newConfig)
      console.log(`[shortcut] Registered: ${accelerator} → ${action}`)
    } else {
      console.warn(`[shortcut] Failed to register: ${accelerator} (may be occupied)`)
    }

    return success
  }

  /** 注册指定 action 的快捷键 */
  private registerAction(action: ShortcutAction, accelerator: string): void {
    const success = globalShortcut.register(accelerator, () => {
      this.dispatch(action)
    })

    if (success) {
      this.registered.set(action, accelerator)
      console.log(`[shortcut] Registered: ${accelerator} → ${action}`)
    } else {
      console.warn(`[shortcut] Failed to register: ${accelerator}`)
    }
  }

  /** 执行快捷键动作 */
  private dispatch(action: ShortcutAction): void {
    switch (action) {
      case 'toggleOverlay': {
        const overlay = getOverlayWindow()
        console.log('[shortcut] toggleOverlay, overlay visible:', overlay?.isVisible())
        if (overlay && !overlay.isDestroyed() && overlay.isVisible()) {
          hideOverlay()
        } else {
          showOverlay()
          ensureOverlayContent()
        }
        break
      }
      case 'toggleDetect': {
        if (detectionLoop.isRunning()) {
          detectionLoop.stop()
        } else {
          const config = get('detection')
          detectionLoop.start(config)
        }
        break
      }
    }
  }

  /** 注销所有快捷键 */
  unregisterAll(): void {
    globalShortcut.unregisterAll()
    this.registered.clear()
    console.log('[shortcut] All shortcuts unregistered')
  }

  /** 获取当前快捷键配置 */
  getShortcuts(): ShortcutConfig {
    return get('shortcut')
  }
}

export const shortcutManager = new ShortcutManager()
