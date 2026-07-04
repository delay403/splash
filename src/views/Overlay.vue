<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { GameState } from "../lib/ipc";

const currentState = ref<GameState>("NoGame");

const stateLabel = computed(() => {
  switch (currentState.value) {
    case "Alive": return "存活";
    case "Dead": return "死亡";
    case "Transitioning": return "过渡中";
    default: return "未检测";
  }
});

const stateColor = computed(() => {
  switch (currentState.value) {
    case "Alive": return "#4ade80";
    case "Dead": return "#f87171";
    case "Transitioning": return "#fbbf24";
    default: return "#9ca3af";
  }
});

onMounted(() => {
  if (window.overlayAPI) {
    window.overlayAPI.on("overlay-state-update", (data) => {
      const payload = data as { state: GameState };
      if (payload?.state) {
        currentState.value = payload.state;
      }
    });
  }
});

function closeWindow() {
  window.close();
}
</script>

<template>
  <div class="overlay-container">
    <!-- 标题栏（可拖动） -->
    <div class="title-bar">
      <div class="status-indicator">
        <div class="status-dot" :style="{ backgroundColor: stateColor }"></div>
        <span class="status-text">{{ stateLabel }}</span>
      </div>
      <div class="window-controls">
        <button class="ctrl-btn" @click="closeWindow" title="关闭">✕</button>
      </div>
    </div>
    <!-- 内容区域：由主进程 WebContentsView 渲染抖音内容 -->
    <div class="content-area"></div>
  </div>
</template>

<style scoped>
.overlay-container {
  width: 100%;
  height: 100vh;
  background: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
}

.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 12px 12px 0 0;
  -webkit-app-region: drag;
  height: 32px;
  flex-shrink: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  font-size: 12px;
  color: #e5e7eb;
  font-weight: 500;
}

.window-controls {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.ctrl-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.ctrl-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.content-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 0 0 12px 12px;
}
</style>
