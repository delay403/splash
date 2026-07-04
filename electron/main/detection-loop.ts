// 检测循环调度器 — 截图 → 策略分析 → 状态机判定 → 控制悬浮窗
import type { AnalysisResult, DetectionConfig, GameState } from '../types/ipc'
import { IPC_CHANNELS } from '../types/ipc'
import { StateMachine } from './state-machine'
import { captureScreen } from './screenshot'
import { getStrategy } from './strategies'
import type { DetectionStrategy } from './strategies/types'
import { getSettingsWindow, showOverlay, hideOverlay } from './window-manager'
import { get, set } from './store'

class DetectionLoop {
  private timer: NodeJS.Timeout | null = null
  private stateMachine: StateMachine | null = null
  private strategy: DetectionStrategy | null = null
  private running = false
  private currentGame: string = ''

  /** 启动检测 */
  start(config: DetectionConfig): void {
    if (this.running) {
      console.warn('[detection] Already running')
      return
    }

    this.running = true
    this.currentGame = config.targetGame
    this.strategy = getStrategy(config.targetGame)
    this.stateMachine = new StateMachine(this.strategy, config)
    const interval = config.intervalMs

    console.log(`[detection] Started — game: ${config.targetGame}, interval: ${interval}ms`)
    this.sendStatusEvent(true)

    this.timer = setInterval(() => {
      this.tick().catch((err) => {
        console.error('[detection] Tick error:', err)
      })
    }, interval)
  }

  /** 停止检测 */
  stop(): void {
    if (!this.running) return

    this.running = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.stateMachine = null
    this.strategy = null

    console.log('[detection] Stopped')
    this.sendStatusEvent(false)
  }

  /** 更新配置 */
  updateConfig(config: DetectionConfig): void {
    // 游戏切换 → 更新策略
    if (config.targetGame !== this.currentGame) {
      this.currentGame = config.targetGame
      const newStrategy = getStrategy(config.targetGame)
      this.strategy = newStrategy
      if (this.stateMachine) {
        this.stateMachine.updateStrategy(newStrategy)
      }
      console.log(`[detection] Strategy switched to: ${newStrategy.game}`)
    }

    if (this.stateMachine) {
      this.stateMachine.updateConfig(config)
    }

    // 更新间隔：重新启动定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = setInterval(() => {
        this.tick().catch((err) => {
          console.error('[detection] Tick error:', err)
        })
      }, config.intervalMs)
    }

    // 持久化配置
    set('detection', config)
  }

  /** 检测是否运行中 */
  isRunning(): boolean {
    return this.running
  }

  /** 单次检测 tick */
  private async tick(): Promise<void> {
    if (!this.stateMachine || !this.strategy) return

    try {
      // 截取屏幕
      const image = await captureScreen()

      // 使用策略分析图像
      const result: AnalysisResult = this.strategy.analyze(image)

      // 状态机处理
      const newState = this.stateMachine.processFrame(result)

      // 状态变化时通知前端 + 控制悬浮窗
      if (newState) {
        this.sendStateEvent(newState, result)

        if (newState === 'Dead') {
          showOverlay()
          this.sendOverlayVisibility(true)
        } else if (newState === 'Alive') {
          hideOverlay()
          this.sendOverlayVisibility(false)
        }
      }

      // 始终发送调试数据
      this.sendDebugEvent(result, this.stateMachine.getCurrentState())
    } catch (err) {
      console.error('[detection] Screenshot/analysis failed:', err)
    }
  }

  /** 发送状态变化事件 */
  private sendStateEvent(state: GameState, result: AnalysisResult): void {
    const window = getSettingsWindow()
    window?.webContents.send(IPC_CHANNELS.EVENT_GAME_STATE_CHANGED, {
      state,
      saturation: result.avgSaturation,
      grayscale_ratio: result.grayscaleRatio,
      center_white: result.centerWhiteRatio,
      bottom_colorful: result.bottomColorfulRatio,
    })
  }

  /** 发送调试数据事件 */
  private sendDebugEvent(result: AnalysisResult, state: GameState): void {
    const window = getSettingsWindow()
    window?.webContents.send(IPC_CHANNELS.EVENT_ANALYSIS_DEBUG, {
      saturation: result.avgSaturation,
      brightness: result.avgBrightness,
      grayscale_ratio: result.grayscaleRatio,
      center_white: result.centerWhiteRatio,
      bottom_saturation: result.bottomSaturation,
      bottom_colorful: result.bottomColorfulRatio,
      game_state: state,
    })
  }

  /** 发送检测状态变化事件 */
  private sendStatusEvent(running: boolean): void {
    const window = getSettingsWindow()
    window?.webContents.send(IPC_CHANNELS.EVENT_DETECTION_STATUS_CHANGED, running)
  }

  /** 发送悬浮窗可见性事件 */
  private sendOverlayVisibility(visible: boolean): void {
    const window = getSettingsWindow()
    window?.webContents.send(IPC_CHANNELS.EVENT_OVERLAY_VISIBILITY_CHANGED, visible)
  }
}

export const detectionLoop = new DetectionLoop()

/** 获取当前检测配置 */
export function getDetectionConfig(): DetectionConfig {
  return get('detection')
}
