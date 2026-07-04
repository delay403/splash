// 悬浮窗内容管理 — WebContentsView 加载抖音页面 + 持久化 session
import { BrowserWindow, WebContentsView, session } from 'electron'
import { get, set } from './store'
import { getOverlayWindow, getSettingsWindow } from './window-manager'

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

  // 拦截外部协议启动（bitbrowser:// 等）- 从 session 级别阻止 OS 弹窗
  douyinSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'openExternal') {
      console.log('[overlay-content] Blocked openExternal permission request')
      callback(false)
      return
    }
    callback(true)
  })
  douyinSession.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'openExternal') {
      return false
    }
    return true
  })

  // 创建 WebContentsView
  contentView = new WebContentsView({
    webPreferences: {
      session: douyinSession,
      contextIsolation: true,
      nodeIntegration: false,
      // ✅ 性能优化：禁用不必要的功能以减少进程数
      spellcheck: false,
      enableBlinkFeatures: '',
      disableBlinkFeatures: 'AcceleratedVideoDecode,OverlayScrollbar'
    }
  })

  // 挂载到悬浮窗
  overlayWindow.contentView.addChildView(contentView)

  // 设置初始 bounds（标题栏下方）
  resizeContent(overlayWindow)

  // 拦截所有非 http/https 协议的导航和窗口打开

  // 1. 拦截 will-navigate（页面内导航）
  contentView.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.log('[overlay-content] Blocked will-navigate:', url)
      event.preventDefault()
    }
  })

  // 2. 拦截 will-redirect（重定向）
  contentView.webContents.on('will-redirect', (event, url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.log('[overlay-content] Blocked will-redirect:', url)
      event.preventDefault()
    }
  })

  // 3. 拦截新窗口打开
  contentView.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      contentView?.webContents.loadURL(url)
    } else {
      console.log('[overlay-content] Blocked new-window:', url)
    }
    return { action: 'deny' }
  })

  // ✅ 关键修复：监听抖音页面加载完成，发送事件通知前端
  contentView.webContents.on('did-finish-load', () => {
    console.log('[overlay-content] Douyin page loaded successfully at', new Date().toISOString())
    
    // 注入 JavaScript 阻止自定义协议链接的点击和触发
    // 注意：不能用 Object.defineProperty(window.location, 'href', ...) 因为
    //   window.location 是不可配置的，会导致整个脚本抛出 TypeError
    contentView?.webContents.executeJavaScript(`
      (function() {
        try {
          // 拦截所有链接点击
          document.addEventListener('click', function(e) {
            var t = e.target;
            if (t && t.closest) {
              var a = t.closest('a');
              if (a && a.href && !a.href.startsWith('http://') && !a.href.startsWith('https://')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            }
          }, true);
        } catch(e) {}

        try {
          // 拦截 window.open
          var originalOpen = window.open;
          window.open = function(url) {
            if (url && !String(url).startsWith('http://') && !String(url).startsWith('https://')) {
              return null;
            }
            return originalOpen.apply(this, arguments);
          };
        } catch(e) {}

        try {
          // 拦截 beforeunload 防止自定义协议通过 location 跳转
          window.addEventListener('beforeunload', function(e) {
            // 不阻止正常卸载
          }, true);
        } catch(e) {}
      })();
    `).catch(err => {
      console.error('[overlay-content] Failed to inject JS:', err);
    });
    
    // 发送事件通知前端内容已就绪
    getSettingsWindow()?.webContents.send('overlay-content-ready')
  })

  // 监听加载失败
  contentView.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('[overlay-content] Failed to load:', errorCode, errorDescription)
    getSettingsWindow()?.webContents.send('overlay-content-error', { errorCode, errorDescription })
  })

  // 异步加载抖音 URL（不阻塞悬浮窗显示，毫秒级响应）
  const loadStart = Date.now()
  setImmediate(() => {
    contentView?.webContents.loadURL(overlayConfig.douyinUrl)
    console.log(`[overlay-content] Started loading URL after ${Date.now() - loadStart}ms:`, overlayConfig.douyinUrl)
  })

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
