# Splash

游戏悬浮窗助手 — 在 FPS 游戏（守望先锋2、无畏契约）中检测玩家死亡/复活状态，自动弹出/隐藏抖音内容悬浮窗。

## 技术栈

- **桌面框架**: Electron 31
- **前端**: Vue 3 + TypeScript + Vite + Pinia
- **后端**: Electron 主进程（Node.js）
- **构建工具**: electron-vite
- **数据存储**: Lowdb (JSON)
- **截图**: Electron desktopCapturer
- **图像分析**: 像素特征分析（HSL 饱和度 + 灰度占比 + 中心白色检测）

## 开发

### 前置条件

- [Node.js](https://nodejs.org/) (v18+)

### 启动开发

```bash
npm install
npm run dev
```

### 构建发布版

```bash
npm run package:win
```

## 项目结构

```
splash/
├── electron/                    # Electron 主进程 + preload
│   ├── main/
│   │   ├── index.ts             # 入口
│   │   ├── window-manager.ts    # 窗口管理（settings + overlay）
│   │   ├── detection-loop.ts    # 检测循环
│   │   ├── screenshot.ts        # desktopCapturer 截图
│   │   ├── analysis.ts          # 像素分析
│   │   ├── state-machine.ts     # 状态机（防抖）
│   │   ├── overlay-content.ts   # WebContentsView（抖音 + 持久化 session）
│   │   ├── global-shortcut.ts   # 全局快捷键
│   │   ├── ipc-handlers.ts      # IPC 处理器
│   │   └── store.ts             # Lowdb 存储
│   ├── preload/
│   │   ├── settings-preload.ts  # 设置窗口 preload
│   │   └── overlay-preload.ts   # 悬浮窗 preload
│   └── types/ipc.ts             # 共享类型
├── src/                         # Vue 3 前端
│   ├── views/
│   │   ├── Layout.vue           # 侧边栏布局
│   │   ├── Home.vue             # 控制台
│   │   ├── DetectionConfig.vue  # 检测参数
│   │   ├── OverlayConfig.vue    # 悬浮窗设置（快捷键 + URL）
│   │   ├── Debug.vue            # 实时调试
│   │   └── Overlay.vue          # 悬浮窗页面
│   ├── stores/game.ts           # Pinia 状态管理
│   ├── lib/ipc.ts               # IPC 封装
│   ├── router.ts                # 路由
│   ├── App.vue                  # 根组件
│   └── main.ts                  # 入口
├── electron.vite.config.ts      # electron-vite 配置
├── electron-builder.yml         # 打包配置
└── package.json
```
# Splash

游戏悬浮窗助手 — 在 FPS 游戏（守望先锋2、无畏契约）中检测玩家死亡/复活状态，自动弹出/隐藏抖音内容悬浮窗。

## 技术栈

- **桌面框架**: Tauri 2.x
- **前端**: Vue 3 + TypeScript + Vite + Pinia
- **后端**: Rust（截图 + 像素分析 + 状态机）

## 开发

### 前置条件

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (stable)
- [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（勾选"使用 C++ 的桌面开发"）

### 启动开发

```bash
npm install
npm run tauri dev
```

### 构建发布版

```bash
npm run tauri build
```

## 项目结构

```
splash/
├── src/                    # Vue 前端
│   ├── views/
│   │   ├── Settings.vue    # 设置面板
│   │   └── Overlay.vue     # 悬浮窗页面
│   ├── stores/game.ts      # Pinia 状态管理
│   ├── router.ts           # 路由配置
│   ├── App.vue             # 根组件
│   └── main.ts             # 入口
├── src-tauri/              # Rust 后端
│   └── src/
│       ├── lib.rs          # Tauri 入口
│       ├── commands.rs     # IPC 命令 + 检测循环
│       ├── screenshot.rs   # xcap 屏幕截图
│       ├── analysis.rs     # 像素特征分析
│       ├── state_machine.rs# 状态机（防抖）
│       └── window_manager.rs# 悬浮窗控制
└── .cargo/config.toml      # Cargo 国内镜像
```
# Tauri + Vue + TypeScript

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
