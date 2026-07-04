// 无畏契约 (Valorant) 检测策略
// 死亡时屏幕不会变灰，但底部技能图标消失，进入观战视角
// 检测原理：分析底部 15% 区域的彩色像素占比
//   - 存活时：底部有技能图标（Q/E/C/X）、血条、弹药等，彩色像素多
//   - 死亡时：底部图标消失，进入观战界面，彩色像素骤减
import type { NativeImage } from 'electron'
import type { AnalysisResult, DetectionConfig } from '../../types/ipc'
import type { DetectionStrategy } from './types'
import { rgbToSaturation } from '../analysis'

export const valorantStrategy: DetectionStrategy = {
  game: 'valorant',

  analyze(image: NativeImage): AnalysisResult {
    const bitmap = image.toBitmap()
    const size = image.getSize()
    const width = size.width
    const height = size.height
    const total = width * height

    // 底部区域：屏幕底部 15%
    const bottomYStart = Math.floor(height * 0.85)
    const bottomHeight = height - bottomYStart
    const bottomTotal = width * bottomHeight

    // 全屏统计
    let satSum = 0.0
    let brightSum = 0.0
    let grayCount = 0

    // 中心区域白色（兼容 Debug 显示，Valorant 不用于判定）
    const cx = Math.floor(width / 5)
    const cy = Math.floor(height / 5)
    const cw = Math.floor((width * 3) / 5)
    const ch = Math.floor((height * 3) / 5)
    const centerTotal = cw * ch
    let whiteCount = 0

    // 底部区域统计
    let bottomSatSum = 0.0
    let bottomColorfulCount = 0

    for (let y = 0; y < height; y++) {
      const isBottomRow = y >= bottomYStart
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4 // RGBA 步长 4
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

        // 底部区域分析
        if (isBottomRow) {
          bottomSatSum += sat
          // 彩色像素：饱和度 > 0.15（排除纯灰/黑/白）
          if (sat > 0.15) {
            bottomColorfulCount++
          }
        }
      }
    }

    return {
      avgSaturation: satSum / total,
      avgBrightness: brightSum / total,
      grayscaleRatio: grayCount / total,
      centerWhiteRatio: whiteCount / centerTotal,
      bottomSaturation: bottomSatSum / bottomTotal,
      bottomColorfulRatio: bottomColorfulCount / bottomTotal,
    }
  },

  isDeadSignal(result: AnalysisResult, config: DetectionConfig): boolean {
    // 底部技能图标区域彩色像素占比低于阈值 → 图标消失 → 死亡
    return result.bottomColorfulRatio < config.bottomColorRatioDead
  },

  isAliveSignal(result: AnalysisResult, config: DetectionConfig): boolean {
    // 底部技能图标区域彩色像素占比高于阈值 → 图标存在 → 存活
    return result.bottomColorfulRatio > config.bottomColorRatioAlive
  }
}
