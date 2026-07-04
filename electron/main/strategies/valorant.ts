// 无畏契约 (Valorant) 检测策略
// 死亡时屏幕会变黑（约1秒），进入观战视角后显示观战者ID
// 检测原理：亮度骤降判定死亡 + 特定坐标文字检测判定复活
//   - 主要信号：全屏平均亮度骤降（死亡瞬间屏幕大部分变黑）
//   - 复活信号：特定坐标 (X:0.065, Y:0.825) 是否有文字 → 无文字 = 复活
//   - 防误判：排除纯黑屏场景（如加载界面）
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

    // 观战ID检测区域：屏幕左下角观战者名称区域
    // 根据截图分析：头像+玩家名称在左下角，约占 X:0.02-0.15, Y:0.75-0.90
    const specXStart = Math.floor(width * 0.02)   // 左侧 2%
    const specXEnd = Math.ceil(width * 0.15)      // 左侧 15%
    const specYStart = Math.floor(height * 0.75)  // 底部向上 25%
    const specYEnd = Math.ceil(height * 0.90)     // 底部向上 10%
    const specWidth = specXEnd - specXStart
    const specHeight = specYEnd - specYStart
    const specTotal = specWidth * specHeight

    // 底部区域：屏幕底部 15%（保留用于兼容）
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

    // 底部区域统计（保留用于兼容）
    let bottomSatSum = 0.0
    let bottomColorfulCount = 0

    // 特定坐标区域文字检测（非黑色像素占比）
    let specNonBlackCount = 0

    for (let y = 0; y < height; y++) {
      const isBottomRow = y >= bottomYStart
      const isSpecRegion = y >= specYStart && y < specYEnd
      
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

        // 特定坐标区域文字检测：检测白色/浅色文字（观战者ID名称）
        // 观战者ID显示为白色文字，RGB值通常较高（>180）
        if (isSpecRegion && x >= specXStart && x < specXEnd) {
          if (r > 180 && g > 180 && b > 180) {
            specNonBlackCount++
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
      // 新增：特定坐标区域非黑色像素占比（用于判断观战者ID是否存在）
      spectatorIdVisible: specTotal > 0 ? specNonBlackCount / specTotal : 0
    }
  },

  isDeadSignal(result: AnalysisResult, config: DetectionConfig): boolean {
    // 严格判定：必须同时满足以下条件才判定为死亡：
    // 1. 全屏平均亮度低于阈值（接近全黑）
    // 2. 饱和度低于阈值（黑白画面，无彩色）
    // 3. 灰度比例高于阈值（几乎全是灰色/黑色像素）
    // 三个阈值均可在前端 DetectionConfig 页面调整

    const brightnessOK = result.avgBrightness < config.brightnessDeadThreshold
    const saturationOK = result.avgSaturation < config.valorantSaturationThreshold
    const grayscaleOK = result.grayscaleRatio > config.valorantGrayscaleThreshold

    const isDead = brightnessOK && saturationOK && grayscaleOK

    if (isDead) {
      console.log(`[valorant] DEAD SIGNAL: brightness=${result.avgBrightness.toFixed(3)} < ${config.brightnessDeadThreshold}, saturation=${result.avgSaturation.toFixed(3)} < ${config.valorantSaturationThreshold}, grayscale=${result.grayscaleRatio.toFixed(3)} > ${config.valorantGrayscaleThreshold}`)
    } else if (brightnessOK) {
      console.log(`[valorant] Brightness low but not dead: brightness=${result.avgBrightness.toFixed(3)} (need < ${config.brightnessDeadThreshold}), saturation=${result.avgSaturation.toFixed(3)} (need < ${config.valorantSaturationThreshold}), grayscale=${result.grayscaleRatio.toFixed(3)} (need > ${config.valorantGrayscaleThreshold})`)
    }

    return isDead
  },

  isAliveSignal(result: AnalysisResult, config: DetectionConfig): boolean {
    // 复活判定：屏幕亮度恢复（不再全黑）即判定为复活
    // 死亡时屏幕变黑 → brightness < threshold
    // 复活时屏幕恢复 → brightness > threshold
    const isAlive = result.avgBrightness > config.brightnessDeadThreshold
    if (isAlive) {
      console.log(`[valorant] ALIVE SIGNAL: brightness=${result.avgBrightness.toFixed(3)} > ${config.brightnessDeadThreshold}`)
    }
    return isAlive
  }
}
