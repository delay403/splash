<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useGameStore } from "../stores/game";

const route = useRoute();
const store = useGameStore();

onMounted(() => {
  console.log('[Layout.vue] Mounted, current route:', route.path)
})

const navItems = [
  { path: "/", label: "控制台", icon: "◉" },
  { path: "/detection", label: "检测参数", icon: "⚙" },
  { path: "/overlay-config", label: "悬浮窗设置", icon: "▢" },
  { path: "/debug", label: "实时调试", icon: "◈" },
];

const stateColor = computed(() => {
  switch (store.gameState) {
    case "Alive": return "#4ade80";
    case "Dead": return "#f87171";
    case "Transitioning": return "#fbbf24";
    default: return "#6b7280";
  }
});

const stateLabel = computed(() => {
  switch (store.gameState) {
    case "Alive": return "存活";
    case "Dead": return "死亡";
    case "Transitioning": return "过渡";
    default: return "待机";
  }
});
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo-text">Splash</h1>
        <p class="logo-sub">游戏悬浮窗助手</p>
      </div>

      <nav class="sidebar-nav">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item"
          :class="{ active: route.path === item.path }">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="status-badge">
          <span class="status-dot" :style="{ backgroundColor: stateColor }"></span>
          <span class="status-label">{{ stateLabel }}</span>
        </div>
        <div class="run-badge" :class="store.detectionRunning ? 'running' : 'stopped'">
          {{ store.detectionRunning ? '检测中' : '已停止' }}
        </div>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.25);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo-sub {
  font-size: 12px;
  color: #6b7280;
  margin: 2px 0 0;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #9ca3af;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e5e7eb;
}

.nav-item.active {
  background: rgba(96, 165, 250, 0.12);
  color: #60a5fa;
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.sidebar-footer {
  padding: 16px 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-badge,
.run-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-label {
  color: #9ca3af;
}

.run-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
}

.run-badge.running {
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
}

.run-badge.stopped {
  background: rgba(107, 114, 128, 0.12);
  color: #6b7280;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
}
</style>
