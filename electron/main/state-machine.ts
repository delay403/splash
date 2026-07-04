// 状态机引擎 — 防抖判定 + 状态切换
// 策略模式：信号判定委托给 DetectionStrategy，状态机只负责防抖和状态流转
import type { AnalysisResult, DetectionConfig, GameState } from '../types/ipc'
import type { DetectionStrategy } from './strategies/types'

/** 状态机 */
export class StateMachine {
  private strategy: DetectionStrategy
  private config: DetectionConfig
  private currentState: GameState = 'NoGame'
  private deadConfirmCount = 0
  private aliveConfirmCount = 0

  constructor(strategy: DetectionStrategy, config: DetectionConfig) {
    this.strategy = strategy
    this.config = config
  }

  /** 更新策略（切换游戏时调用） */
  updateStrategy(strategy: DetectionStrategy): void {
    this.strategy = strategy
    this.deadConfirmCount = 0
    this.aliveConfirmCount = 0
  }

  /** 更新配置 */
  updateConfig(config: DetectionConfig): void {
    this.config = config
  }

  /** 获取当前状态 */
  getCurrentState(): GameState {
    return this.currentState
  }

  /**
   * 输入一帧分析结果，返回是否发生状态变化
   * 如果状态变化，返回新的 GameState；否则返回 null
   */
  processFrame(result: AnalysisResult): GameState | null {
    const isDead = this.strategy.isDeadSignal(result, this.config)
    const isAlive = this.strategy.isAliveSignal(result, this.config)

    console.log(`[state-machine] Frame: state=${this.currentState}, isDead=${isDead}, isAlive=${isAlive}, deadCount=${this.deadConfirmCount}, aliveCount=${this.aliveConfirmCount}`)

    if (isDead) {
      this.deadConfirmCount++
      this.aliveConfirmCount = 0
    } else {
      // 屏幕不再全黑 → 复活信号（涵盖 isAlive=true 和灰区）
      this.aliveConfirmCount++
      this.deadConfirmCount = 0
    }

    switch (this.currentState) {
      case 'Alive':
      case 'NoGame':
        if (this.deadConfirmCount >= this.config.deadConfirmFrames) {
          this.currentState = 'Dead'
          this.deadConfirmCount = 0
          console.log('[state-machine] State changed: Alive/NoGame -> Dead')
          return 'Dead'
        }
        break

      case 'Dead':
        if (this.aliveConfirmCount >= this.config.aliveConfirmFrames) {
          this.currentState = 'Alive'
          this.aliveConfirmCount = 0
          console.log('[state-machine] State changed: Dead -> Alive')
          return 'Alive'
        }
        break

      case 'Transitioning':
        if (this.deadConfirmCount >= this.config.deadConfirmFrames) {
          this.currentState = 'Dead'
          this.deadConfirmCount = 0
          console.log('[state-machine] State changed: Transitioning -> Dead')
          return 'Dead'
        } else if (this.aliveConfirmCount >= this.config.aliveConfirmFrames) {
          this.currentState = 'Alive'
          this.aliveConfirmCount = 0
          console.log('[state-machine] State changed: Transitioning -> Alive')
          return 'Alive'
        }
        break
    }

    return null
  }

  /** 重置状态机 */
  reset(): void {
    this.currentState = 'NoGame'
    this.deadConfirmCount = 0
    this.aliveConfirmCount = 0
  }
}
