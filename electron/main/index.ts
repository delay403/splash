// Electron 主进程入口
import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { initStore } from './store'
import { createSettingsWindow } from './window-manager'
import { registerIpcHandlers } from './ipc-handlers'
import { shortcutManager } from './global-shortcut'

app.whenReady().then(async () => {
  // 设置应用用户模型 ID
  electronApp.setAppUserModelId('com.qaq.splash')

  // 开发者工具快捷键
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化数据库
  await initStore()

  // 创建设置窗口（悬浮窗改为懒加载，按需创建以减少进程数）
  createSettingsWindow()

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
