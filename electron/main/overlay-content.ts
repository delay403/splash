// 悬浮窗内容管理 — WebContentsView 加载抖音页面 + 持久化 session
import { BrowserWindow, WebContentsView, session } from 'electron'
import { get, set } from './store'
import { getOverlayWindow } from './window-manager'

let contentView: WebContentsView | null = null
let contentInitialized = false

/** 懒加载初始化：仅在首次调用时创建 WebContentsView */
export function ensureOverlayContent(): void {
  console.log('[overlay-content] ensureOverlayContent called, initialized:', contentInitialized, 'view exists:', !!contentView)
  if (contentInitialized && contentView && !contentView.webContents.isDestroyed()) {
    console.log('[overlay-content] Already initialized, skipping')
    return
  }
  console.log('[overlay-content] Initializing overlay content...')
  initOverlayContent()
  contentInitialized = true
  console.log('[overlay-content] Overlay content initialized')
}

/** 初始化悬浮窗内容 */
export function initOverlayContent(): void {
  const overlayWindow = getOverlayWindow()
  if (!overlayWindow) {
    console.error('[overlay-content] Overlay window not found')
    return
  }

  const overlayConfig = get('overlay')

  // 使用持久化 session，cookie/localStorage 会保存到磁盘
  const douyinSession = session.fromPartition('persist:douyin')

  // 设置真实浏览器 User-Agent，避免被抖音识别为非浏览器
  douyinSession.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  )

  // 创建 WebContentsView
  contentView = new WebContentsView({
    webPreferences: {
      session: douyinSession,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 挂载到悬浮窗
  overlayWindow.contentView.addChildView(contentView)

  // 设置初始 bounds（标题栏下方）
  resizeContent(overlayWindow)

  // 拦截新窗口打开（在当前 view 中打开，防止跳出悬浮窗）
  contentView.webContents.setWindowOpenHandler(({ url }) => {
    contentView?.webContents.loadURL(url)
    return { action: 'deny' }
  })

  // 加载保存的抖音 URL
  contentView.webContents.loadURL(overlayConfig.douyinUrl)

  // 监听悬浮窗 resize 事件，自动调整 view 大小
  overlayWindow.on('resize', () => {
    resizeContent(overlayWindow)
  })

  // 窗口关闭时清理引用（下次 ensureOverlayContent 时重建）
  overlayWindow.on('closed', () => {
    contentView = null
    contentInitialized = false
  })

  console.log('[overlay-content] Initialized with URL:', overlayConfig.douyinUrl)
}

/** 调整内容区域大小 */
function resizeContent(window: BrowserWindow): void {
  if (!contentView) return

  const overlayConfig = get('overlay')
  const titleBarHeight = overlayConfig.titleBarHeight
  const bounds = window.getContentBounds()

  contentView.setBounds({
    x: 0,
    y: titleBarHeight,
    width: bounds.width,
    height: bounds.height - titleBarHeight
  })
}

/** 加载新的抖音 URL（悬浮窗未创建时仅保存配置，创建时自动加载） */
export function loadUrl(url: string): void {
  set('overlay', { ...get('overlay'), douyinUrl: url })
  if (contentView && !contentView.webContents.isDestroyed()) {
    contentView.webContents.loadURL(url)
    console.log('[overlay-content] URL loaded:', url)
  } else {
    console.log('[overlay-content] URL saved (overlay not active):', url)
  }
}

/** 获取当前抖音 URL */
export function getDouyinUrl(): string {
  return get('overlay').douyinUrl
}

/** 显示内容 */
export function showContent(): void {
  if (contentView) {
    contentView.setVisible(true)
  }
}

/** 隐藏内容 */
export function hideContent(): void {
  if (contentView) {
    contentView.setVisible(false)
  }
}
