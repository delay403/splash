// 截图模块 — 使用 Electron desktopCapturer 替代 Rust xcap
import { desktopCapturer } from 'electron'
import type { NativeImage } from 'electron'

/**
 * 截取主显示器全屏
 * thumbnailSize 设置为屏幕尺寸的 1/4，由 desktopCapturer 自动缩放
 */
export async function captureScreen(): Promise<NativeImage> {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 480, height: 270 } // ~1920x1080 的 1/4
  })

  if (sources.length === 0) {
    throw new Error('No screen source available')
  }

  return sources[0].thumbnail
}
