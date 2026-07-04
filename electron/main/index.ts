// Electron 主进程入口
import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { initStore } from './store'
import { createSettingsWindow, preloadOverlayWindow } from './window-manager'
import { registerIpcHandlers } from './ipc-handlers'
import { shortcutManager } from './global-shortcut'
import { ensureOverlayContent } from './overlay-content'

app.whenReady().then(async () => {
  // 设置应用用户模型 ID
  electronApp.setAppUserModelId('com.qaq.splash')

  // ✅ 性能优化：限制最大并发进程数
  app.commandLine.appendSwitch('disable-gpu-compositing')  // 禁用 GPU 合成，减少 GPU 进程开销
  app.commandLine.appendSwitch('disable-software-rasterizer')  // 禁用软件光栅化器
  
  // 开发者工具快捷键
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化数据库
  await initStore()

  // 创建设置窗口
  createSettingsWindow()

  // 预加载悬浮窗（后台创建并初始化，减少首次弹出延迟）
  setTimeout(() => {
    console.log('[app] Starting overlay preloading...')
    const preloadStart = Date.now()
    
    // 1. 创建窗口
    preloadOverlayWindow()
    
    // 2. ✅ 关键修复：立即初始化 WebContentsView 和加载抖音页面
    ensureOverlayContent()
    
    console.log(`[app] Overlay preloaded in ${Date.now() - preloadStart}ms`)
  }, 1000)  // 启动后 1 秒预加载，避免影响主窗口显示

  // 注册 IPC 处理器
  registerIpcHandlers()

  // 初始化全局快捷键
  shortcutManager.init()

  // macOS 激活窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSettingsWindow()
    }
  })
})

// 所有窗口关闭时退出（Windows/Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 退出前清理
app.on('before-quit', () => {
  shortcutManager.unregisterAll()
})
