// 像素分析模块 — 1:1 移植 Rust analysis.rs
import type { NativeImage } from 'electron'
import type { AnalysisResult } from '../types/ipc'

/**
 * 将 RGB 转换为 HSL 饱和度分量
 * 与 Rust rgb_to_saturation 完全一致
 */
export function rgbToSaturation(r: number, g: number, b: number): number {
  const rf = r / 255.0
  const gf = g / 255.0
  const bf = b / 255.0

  const max = Math.max(rf, gf, bf)
  const min = Math.min(rf, gf, bf)
  const l = (max + min) / 2.0

  if (Math.abs(max - min) < Number.EPSILON) {
    return 0.0 // 灰度（无彩色）
  }

  const d = max - min
  if (l > 0.5) {
    return d / (2.0 - max - min)
  }
  return d / (max + min)
}

/**
 * 分析图像：平均饱和度、平均亮度、灰度占比、中心白色占比
 * 与 Rust analyze_frame 完全一致
 */
export function analyzeFrame(image: NativeImage): AnalysisResult {
  const bitmap = image.toBitmap() // RGBA Buffer
  const size = image.getSize()
  const width = size.width
  const height = size.height
  const total = width * height

  let satSum = 0.0
  let brightSum = 0.0
  let grayCount = 0

  // 中心区域边界（60% 区域，即各边缩进 20%）
  const cx = Math.floor(width / 5)
  const cy = Math.floor(height / 5)
  const cw = Math.floor((width * 3) / 5)
  const ch = Math.floor((height * 3) / 5)
  const centerTotal = cw * ch
  let whiteCount = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4 // RGBA 步长 4

      // 注意：toBitmap() 在 Windows 上返回 BGRA 格式，需要交换 R 和 B
      // 但 Electron 文档说是 RGBA，实际测试确认字节序
      const r = bitmap[i]
      const g = bitmap[i + 1]
      const b = bitmap[i + 2]

      const sat = rgbToSaturation(r, g, b)
      satSum += sat

      // 亮度 = (max + min) / 2
      const rf = r / 255.0
      const gf = g / 255.0
      const bf = b / 255.0
      const max = Math.max(rf, gf, bf)
      const min = Math.min(rf, gf, bf)
      brightSum += (max + min) / 2.0

      // 灰度像素：饱和度 < 0.1
      if (sat < 0.1) {
        grayCount++
      }

      // 中心区域白色像素
      if (x >= cx && x < cx + cw && y >= cy && y < cy + ch) {
        if (r > 180 && g > 180 && b > 180) {
          whiteCount++
        }
      }
    }
  }

  return {
    avgSaturation: satSum / total,
    avgBrightness: brightSum / total,
    grayscaleRatio: grayCount / total,
    centerWhiteRatio: whiteCount / centerTotal,
    // 守望先锋 2 策略不使用底部区域指标，填 0
    bottomSaturation: 0,
    bottomColorfulRatio: 0
  }
}
