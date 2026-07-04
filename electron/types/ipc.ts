// 共享类型定义 — 主进程与渲染进程共用

/** 游戏玩家状态 */
export type GameState = 'Alive' | 'Dead' | 'Transitioning' | 'NoGame'

/** 检测配置 */
export interface DetectionConfig {
  // 通用
  targetGame: string
  intervalMs: number
  deadConfirmFrames: number
  aliveConfirmFrames: number
  // 守望先锋 2 — 全屏饱和度/灰度/中心白色文字
  saturationDeadThreshold: number
  saturationAliveThreshold: number
  grayscaleRatioThreshold: number
  centerWhiteThreshold: number
  // 无畏契约 — 底部技能图标区域检测
  bottomColorRatioDead: number   // 底部区域彩色像素占比低于此值 → 死亡（图标消失）
  bottomColorRatioAlive: number  // 底部区域彩色像素占比高于此值 → 存活（图标存在）
}

/** 像素分析结果 */
export interface AnalysisResult {
  // 通用指标（全屏）
  avgSaturation: number
  avgBrightness: number
  grayscaleRatio: number
  centerWhiteRatio: number
  // 无畏契约指标（底部区域）
  bottomSaturation: number
  bottomColorfulRatio: number
}

/** 调试数据（推送到前端） */
export interface AnalysisDebug {
  saturation: number
  brightness: number
  grayscale_ratio: number
  center_white: number
  bottom_saturation: number
  bottom_colorful: number
  game_state: GameState
}

/** 悬浮窗配置 */
export interface OverlayConfig {
  douyinUrl: string
  width: number
  height: number
  x: number
  y: number
  clickThrough: boolean
  titleBarHeight: number
}

/** 快捷键配置 */
export interface ShortcutConfig {
  toggleOverlay: string
  toggleDetection: string
}

/** 窗口状态 */
export interface WindowState {
  width: number
  height: number
  x: number | null
  y: number | null
}

/** 完整数据库结构 */
export interface AppDatabase {
  detection: DetectionConfig
  overlay: OverlayConfig
  shortcut: ShortcutConfig
  lastWindowState: {
    settings: WindowState
    overlay: WindowState & { visible: boolean }
  }
}

/** 默认配置 */
export const defaultDatabase: AppDatabase = {
  detection: {
    targetGame: 'overwatch2',
    intervalMs: 1500,
    deadConfirmFrames: 3,
    aliveConfirmFrames: 2,
    // 守望先锋 2
    saturationDeadThreshold: 0.15,
    saturationAliveThreshold: 0.25,
    grayscaleRatioThreshold: 0.7,
    centerWhiteThreshold: 0.05,
    // 无畏契约
    bottomColorRatioDead: 0.05,
    bottomColorRatioAlive: 0.12,
  },
  overlay: {
    douyinUrl: 'https://live.douyin.com/',
    width: 400,
    height: 700,
    x: 1500,
    y: 100,
    clickThrough: false,
    titleBarHeight: 32
  },
  shortcut: {
    toggleOverlay: 'CommandOrControl+Shift+O',
    toggleDetection: 'CommandOrControl+Shift+D'
  },
  lastWindowState: {
    settings: { width: 900, height: 620, x: null, y: null },
    overlay: { width: 400, height: 700, x: null, y: null, visible: false }
  }
}

/** IPC 事件通道 */
export const IPC_CHANNELS = {
  // 检测
  DETECTION_START: 'detection:start',
  DETECTION_STOP: 'detection:stop',
  DETECTION_GET_CONFIG: 'detection:get-config',
  DETECTION_UPDATE_CONFIG: 'detection:update-config',
  // 悬浮窗
  OVERLAY_SHOW: 'overlay:show',
  OVERLAY_HIDE: 'overlay:hide',
  OVERLAY_SET_CLICK_THROUGH: 'overlay:set-click-through',
  // 快捷键
  SHORTCUT_REGISTER: 'shortcut:register',
  SHORTCUT_GET_ALL: 'shortcut:get-all',
  // 存储
  STORE_GET: 'store:get',
  STORE_SET: 'store:set',
  // 抖音
  DOUYIN_SET_URL: 'douyin:set-url',
  DOUYIN_GET_URL: 'douyin:get-url',
  // 事件（Main → Renderer）
  EVENT_GAME_STATE_CHANGED: 'game-state-changed',
  EVENT_ANALYSIS_DEBUG: 'analysis-debug',
  EVENT_OVERLAY_VISIBILITY_CHANGED: 'overlay-visibility-changed',
  EVENT_DETECTION_STATUS_CHANGED: 'detection-status-changed'
} as const
