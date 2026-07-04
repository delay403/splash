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
    const interval = config.detectIntervalMs

    console.log(`[detection] Started - game: ${config.targetGame}, interval: ${interval}ms`)
    console.log(`[detection] Config: brightnessDeadThreshold=${config.brightnessDeadThreshold}, saturationThreshold=${config.valorantSaturationThreshold}, grayscaleThreshold=${config.valorantGrayscaleThreshold}, deadConfirmFrames=${config.deadConfirmFrames}, aliveConfirmFrames=${config.aliveConfirmFrames}`)
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
      }, config.detectIntervalMs)
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
      // 截取屏幕（关键路径1）
      const image = await captureScreen()
      console.log(`[detection] Screenshot captured`)

      // 使用策略分析图像（关键路径2）
      const result: AnalysisResult = this.strategy.analyze(image)

      // 状态机处理（关键路径3）
      const oldState = this.stateMachine.getCurrentState()
      const newState = this.stateMachine.processFrame(result)

      // 记录死亡/复活判定
      if (newState && newState !== oldState) {
        if (newState === 'Dead') {
          console.log(`[detection] DEAD DETECTED! brightness=${result.avgBrightness.toFixed(3)}, saturation=${result.avgSaturation.toFixed(3)}, grayscale=${result.grayscaleRatio.toFixed(3)}`)
          console.log(`[detection]   -> Calling showOverlay()...`)
        } else if (newState === 'Alive') {
          console.log(`[detection] ALIVE DETECTED! brightness=${result.avgBrightness.toFixed(3)}, saturation=${result.avgSaturation.toFixed(3)}, grayscale=${result.grayscaleRatio.toFixed(3)}`)
          console.log(`[detection]   -> Calling hideOverlay()...`)
        }
      }

      // 状态变化时立即控制悬浮窗（关键路径4）
      if (newState) {
        const overlayStart = Date.now()
        if (newState === 'Dead') {
          console.log(`[detection] Calling showOverlay() at ${new Date().toISOString()}`)
          showOverlay()  // 毫秒级响应
          this.sendOverlayVisibility(true)
        } else if (newState === 'Alive') {
          hideOverlay()
          this.sendOverlayVisibility(false)
        }
        console.log(`[detection] Overlay operation took ${Date.now() - overlayStart}ms`)
        // 状态变化时才发送事件（减少 IPC 开销）
        this.sendStateEvent(newState, result)
      }

      // 始终发送调试数据（但异步发送，不阻塞）
      setImmediate(() => this.sendDebugEvent(result, this.stateMachine!.getCurrentState()))
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
    if (!window || window.isDestroyed()) return
    try {
      window.webContents.send(IPC_CHANNELS.EVENT_ANALYSIS_DEBUG, {
        saturation: result.avgSaturation,
        brightness: result.avgBrightness,
        grayscale_ratio: result.grayscaleRatio,
        center_white: result.centerWhiteRatio,
        bottom_saturation: result.bottomSaturation,
        bottom_colorful: result.bottomColorfulRatio,
        spectator_id_visible: (result as any).spectatorIdVisible || 0,
        game_state: state,
      })
    } catch (e) {
      // 忽略发送失败（窗口可能正在关闭）
    }
  }

  /** 发送检测状态变化事件 */
  private sendStatusEvent(running: boolean): void {
    const window = getSettingsWindow()
    if (!window || window.isDestroyed()) return
    try {
      window.webContents.send(IPC_CHANNELS.EVENT_DETECTION_STATUS_CHANGED, running)
    } catch (e) {
      // 忽略发送失败
    }
  }

  /** 发送悬浮窗可见性事件 */
  private sendOverlayVisibility(visible: boolean): void {
    const window = getSettingsWindow()
    if (!window || window.isDestroyed()) return
    try {
      window.webContents.send(IPC_CHANNELS.EVENT_OVERLAY_VISIBILITY_CHANGED, visible)
    } catch (e) {
      // 忽略发送失败
    }
  }
}

export const detectionLoop = new DetectionLoop()

/** 获取当前检测配置 */
export function getDetectionConfig(): DetectionConfig {
  return get('detection')
}
