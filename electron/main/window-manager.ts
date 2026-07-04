// 窗口管理器 — 创建和管理 settings + overlay 窗口
import { BrowserWindow, shell } from 'electron'
import path from 'path'
import { get, set } from './store'
import type { WindowState } from '../types/ipc'
import { ensureOverlayContent } from './overlay-content'

let settingsWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null

/** 获取设置窗口 */
export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow
}

/** 获取悬浮窗 */
export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow
}

/** 创建设置窗口 */
export function createSettingsWindow(): BrowserWindow {
  const savedState = get('lastWindowState').settings

  const window = new BrowserWindow({
    width: savedState.width || 900,
    height: savedState.height || 620,
    x: savedState.x ?? undefined,
    y: savedState.y ?? undefined,
    minWidth: 700,
    minHeight: 480,
    title: 'Splash - 控制台',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/settings.mjs'),
      sandbox: false,
      contextIsolation: true,
      // ✅ 性能优化：禁用不必要的功能以减少进程数
      nodeIntegration: false,
      spellcheck: false,  // 禁用拼写检查
      enableBlinkFeatures: '',  // 禁用所有 Blink 特性
      disableBlinkFeatures: 'AcceleratedVideoDecode,OverlayScrollbar'  // 禁用加速视频解码和滚动条覆盖层
    }
  })

  console.log('[window-manager] Creating settings window...')
  window.on('ready-to-show', () => {
    console.log('[window-manager] ready-to-show fired, showing window')
    window.webContents.openDevTools({ mode: 'detach' })
    window.show()
    window.focus()
    console.log('[window-manager] Window shown, visible:', window.isVisible())
  })

  // 超时保险：如果 ready-to-show 未触发，3秒后强制显示
  setTimeout(() => {
    if (!window.isVisible()) {
      console.log('[window-manager] Timeout: forcing window.show()')
      window.show()
    }
  }, 3000)

  // 转发渲染器 console 到主进程终端（方便调试）
  window.webContents.on('console-message', (_event, _level, message) => {
    console.log('[renderer]', message)
  })

  // 持久化窗口状态
  window.on('close', () => {
    const bounds = window.getBounds()
    const state: WindowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y
    }
    set('lastWindowState', {
      ...get('lastWindowState'),
      settings: state
    })
  })

  // 开发环境加载 dev server，生产环境加载打包文件
  if (process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/')
    console.log('[window-manager] Loading dev URL with root route:', process.env['ELECTRON_RENDERER_URL'] + '#/')
  } else {
    window.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: '/'
    })
    console.log('[window-manager] Loading production file with root route')
  }

  // ✅ 关键修复：拦截所有非 http/https 协议的导航和窗口打开
  
  // 1. 拦截 will-navigate（页面内导航）
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.log('[window-manager] Blocked will-navigate to non-http(s) URL:', url)
      event.preventDefault()
    }
  })

  // 2. 外部链接在浏览器打开（仅允许 http/https 协议）
  window.webContents.setWindowOpenHandler(({ url }) => {
    // 只允许 http/https 协议，阻止所有未知协议
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
    } else {
      console.log('[window-manager] Blocked new-window to non-http(s) URL:', url)
    }
    return { action: 'deny' }
  })

  settingsWindow = window
  return window
}

/** 创建悬浮窗 */
export function createOverlayWindow(): BrowserWindow {
  const savedState = get('lastWindowState').overlay
  const overlayConfig = get('overlay')

  console.log('[window-manager] Creating overlay window...')
  const window = new BrowserWindow({
    width: savedState.width || overlayConfig.width,
    height: savedState.height || overlayConfig.height,
    x: savedState.x ?? overlayConfig.x,
    y: savedState.y ?? overlayConfig.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/overlay.mjs'),
      sandbox: false,
      contextIsolation: true,
      // ✅ 性能优化：禁用不必要的功能以减少进程数
      nodeIntegration: false,
      spellcheck: false,
      enableBlinkFeatures: '',
      disableBlinkFeatures: 'AcceleratedVideoDecode,OverlayScrollbar'
    }
  })

  // 尺寸约束
  window.setMinimumSize(300, 400)
  window.setMaximumSize(800, 1200)

  // 防止悬浮窗被截图捕获（desktopCapturer 不会拍到此窗口内容）
  // 这样检测循环截图时不会把悬浮窗的抖音画面算进去
  window.setContentProtection(true)

  // 持久化窗口状态
  window.on('close', () => {
    const bounds = window.getBounds()
    set('lastWindowState', {
      ...get('lastWindowState'),
      overlay: {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        visible: window.isVisible()
      }
    })
  })

  // resize 事件持久化
  window.on('resize', () => {
    const bounds = window.getBounds()
    set('lastWindowState', {
      ...get('lastWindowState'),
      overlay: {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        visible: window.isVisible()
      }
    })
  })

  // 开发环境加载 dev server，生产环境加载打包文件
  if (process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/overlay')
  } else {
    window.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: 'overlay'
    })
  }

  // 窗口关闭后清理引用（允许 GC 回收，下次 showOverlay 时重建）
  window.on('closed', () => {
    overlayWindow = null
  })

  overlayWindow = window
  return window
}

/** 预加载悬浮窗（后台创建但不显示，减少首次弹出延迟） */
export function preloadOverlayWindow(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    console.log('[window-manager] Preloading overlay window in background...')
    createOverlayWindow()
    // 不显示窗口，仅预创建
  }
}

/** 显示悬浮窗（懒加载：窗口不存在时自动创建） */
export function showOverlay(): void {
  const startTime = Date.now()
  console.log('[window-manager] showOverlay called')
  
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    console.log('[window-manager] Creating overlay window...')
    createOverlayWindow()
  }
  
  // ✅ 关键修复：显示前先初始化 WebContentsView 内容
  console.log('[window-manager] Initializing overlay content...')
  const contentInitStart = Date.now()
  ensureOverlayContent()
  console.log(`[window-manager] Content initialized in ${Date.now() - contentInitStart}ms`)
  
  console.log('[window-manager] Showing overlay window')
  const showStart = Date.now()
  overlayWindow?.show()
  console.log(`[window-manager] Window shown in ${Date.now() - showStart}ms`)
  
  // ✅ 验证悬浮窗是否真正弹出
  setTimeout(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      const isVisible = overlayWindow.isVisible()
      const isFocused = overlayWindow.isFocused()
      const bounds = overlayWindow.getBounds()
      console.log(`[window-manager] Overlay verification after 100ms:`)
      console.log(`  - Visible: ${isVisible}`)
      console.log(`  - Focused: ${isFocused}`)
      console.log(`  - Position: (${bounds.x}, ${bounds.y})`)
      console.log(`  - Size: ${bounds.width}x${bounds.height}`)
      if (!isVisible) {
        console.error('[window-manager] ERROR: Overlay window is NOT visible! Forcing show again...')
        overlayWindow.show()
        overlayWindow.focus()
      }
    }
  }, 100)
  
  console.log(`[window-manager] Total showOverlay time: ${Date.now() - startTime}ms`)
}

/** 隐藏悬浮窗 */
export function hideOverlay(): void {
  overlayWindow?.hide()
}

/** 销毁悬浮窗（释放 renderer 进程） */
export function destroyOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close()
  }
  overlayWindow = null
}

/** 设置鼠标穿透 */
export function setClickThrough(ignore: boolean): void {
  overlayWindow?.setIgnoreMouseEvents(ignore, { forward: true })
}
