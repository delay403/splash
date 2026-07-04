// 守望先锋 2 检测策略
// 死亡时画面变为灰度/低饱和度，中心出现白色死亡提示文字
import type { NativeImage } from 'electron'
import type { AnalysisResult, DetectionConfig } from '../../types/ipc'
import type { DetectionStrategy } from './types'
import { analyzeFrame } from '../analysis'

export const overwatch2Strategy: DetectionStrategy = {
  game: 'overwatch2',

  analyze(image: NativeImage): AnalysisResult {
    return analyzeFrame(image)
  },

  isDeadSignal(result: AnalysisResult, config: DetectionConfig): boolean {
    const lowSaturation = result.avgSaturation < config.saturationDeadThreshold
    const highGrayscale = result.grayscaleRatio > config.grayscaleRatioThreshold
    const hasDeathText = result.centerWhiteRatio > config.centerWhiteThreshold

    // 低饱和度 + 高灰度占比
    if (lowSaturation && highGrayscale) {
      return true
    }

    // 高灰度占比 + 有白色文字
    if (highGrayscale && hasDeathText) {
      return true
    }

    return false
  },

  isAliveSignal(result: AnalysisResult, config: DetectionConfig): boolean {
    return (
      result.avgSaturation > config.saturationAliveThreshold &&
      result.grayscaleRatio < config.grayscaleRatioThreshold * 0.7
    )
  }
}
