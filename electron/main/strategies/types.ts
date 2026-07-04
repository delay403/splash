// 检测策略接口 — 不同游戏实现不同的分析和判定逻辑
import type { NativeImage } from 'electron'
import type { AnalysisResult, DetectionConfig } from '../../types/ipc'

/**
 * 检测策略接口
 * 每个游戏实现此接口，提供：
 * - analyze(): 像素分析（提取该游戏关心的特征）
 * - isDeadSignal(): 判断是否为死亡信号
 * - isAliveSignal(): 判断是否为存活信号
 */
export interface DetectionStrategy {
  /** 游戏标识 */
  readonly game: string

  /** 分析一帧截图，提取特征指标 */
  analyze(image: NativeImage): AnalysisResult

  /** 判断分析结果是否为死亡信号 */
  isDeadSignal(result: AnalysisResult, config: DetectionConfig): boolean

  /** 判断分析结果是否为存活信号 */
  isAliveSignal(result: AnalysisResult, config: DetectionConfig): boolean
}
