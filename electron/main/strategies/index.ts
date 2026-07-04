// 策略工厂 — 根据游戏名返回对应的检测策略
import type { DetectionStrategy } from './types'
import { overwatch2Strategy } from './overwatch2'
import { valorantStrategy } from './valorant'

const strategies: Record<string, DetectionStrategy> = {
  overwatch2: overwatch2Strategy,
  valorant: valorantStrategy,
}

/** 默认策略（未知游戏时使用） */
const defaultStrategy: DetectionStrategy = overwatch2Strategy

/**
 * 根据游戏标识获取检测策略
 * @param game 游戏标识（如 'overwatch2', 'valorant'）
 */
export function getStrategy(game: string): DetectionStrategy {
  return strategies[game] ?? defaultStrategy
}

/** 获取所有支持的游戏标识 */
export function getSupportedGames(): string[] {
  return Object.keys(strategies)
}
