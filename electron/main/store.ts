// Lowdb 数据存储封装
import { app } from 'electron'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { defaultDatabase, type AppDatabase } from '../types/ipc'

let db: Low<AppDatabase> | null = null

/** 初始化数据库 */
export async function initStore(): Promise<void> {
  const dbPath = path.join(app.getPath('userData'), 'splash-data.json')
  db = new Low<AppDatabase>(new JSONFile(dbPath), defaultDatabase)
  await db.read()

  // 如果数据为空，写入默认值
  if (!db.data) {
    db.data = defaultDatabase
    await db.write()
  } else {
    // 合并默认值（防止新字段缺失）
    db.data = {
      ...defaultDatabase,
      ...db.data,
      detection: { ...defaultDatabase.detection, ...db.data.detection },
      overlay: { ...defaultDatabase.overlay, ...db.data.overlay },
      shortcut: { ...defaultDatabase.shortcut, ...db.data.shortcut },
      lastWindowState: {
        settings: { ...defaultDatabase.lastWindowState.settings, ...db.data.lastWindowState?.settings },
        overlay: { ...defaultDatabase.lastWindowState.overlay, ...db.data.lastWindowState?.overlay }
      }
    }
    await db.write()
  }

  console.log('[store] Database initialized at:', dbPath)
}

/** 获取数据库实例 */
export function getDb(): Low<AppDatabase> {
  if (!db) {
    throw new Error('Database not initialized. Call initStore() first.')
  }
  return db
}

/** 读取数据 */
export function get<K extends keyof AppDatabase>(key: K): AppDatabase[K] {
  return getDb().data[key]
}

/** 写入数据 */
export async function set<K extends keyof AppDatabase>(
  key: K,
  value: AppDatabase[K]
): Promise<void> {
  getDb().data[key] = value
  await getDb().write()
}
