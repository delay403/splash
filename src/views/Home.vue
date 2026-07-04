<script setup lang="ts">
import { onMounted } from "vue";
import { useGameStore } from "../stores/game";

const store = useGameStore();

const gameOptions = [
  { value: "overwatch2", label: "守望先锋 2" },
  { value: "valorant", label: "无畏契约 (Valorant)" },
];

onMounted(async () => {
  console.log('[Home.vue] Mounted')
  store.initEventListeners();
  await store.loadConfig();
  console.log('[Home.vue] Config loaded:', store.config)
});

async function toggleDetection() {
  if (store.detectionRunning) {
    await store.stopDetection();
  } else {
    await store.startDetection();
  }
}
</script>

<template>
  <div class="page">
    <h2 class="page-title">控制台</h2>

    <!-- 状态卡片 -->
    <div class="cards">
      <div class="card status-card">
        <div class="card-label">当前状态</div>
        <div class="card-value" :class="'state-' + store.gameState.toLowerCase()">
          {{ store.gameState }}
        </div>
      </div>
      <div class="card status-card">
        <div class="card-label">检测引擎</div>
        <div class="card-value" :class="store.detectionRunning ? 'text-green' : 'text-gray'">
          {{ store.detectionRunning ? '运行中' : '已停止' }}
        </div>
      </div>
      <div class="card status-card">
        <div class="card-label">悬浮窗</div>
        <div class="card-value" :class="store.overlayVisible ? 'text-green' : 'text-gray'">
          {{ store.overlayVisible ? '显示中' : '已隐藏' }}
        </div>
      </div>
    </div>

    <!-- 游戏选择 -->
    <div class="section">
      <h3 class="section-title">目标游戏</h3>
      <div class="game-selector">
        <label v-for="g in gameOptions" :key="g.value" class="game-option"
          :class="{ selected: store.config.targetGame === g.value }">
          <input type="radio" :value="g.value" :checked="store.config.targetGame === g.value"
            @change="store.updateConfig({ ...store.config, targetGame: g.value })" hidden />
          <span class="game-name">{{ g.label }}</span>
        </label>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="section">
      <h3 class="section-title">快捷操作</h3>
      <div class="actions">
        <button :class="['btn btn-lg', store.detectionRunning ? 'btn-danger' : 'btn-primary']" @click="toggleDetection">
          {{ store.detectionRunning ? '■ 停止检测' : '▶ 启动检测' }}
        </button>
        <button class="btn btn-secondary" @click="store.showOverlayManual()">
          显示悬浮窗
        </button>
        <button class="btn btn-secondary" @click="store.hideOverlayManual()">
          隐藏悬浮窗
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 720px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 24px;
  color: #e5e7eb;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}

.card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 16px;
}

.card-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.card-value {
  font-size: 18px;
  font-weight: 700;
}

.state-alive {
  color: #4ade80;
}

.state-dead {
  color: #f87171;
}

.state-transitioning {
  color: #fbbf24;
}

.state-nogame {
  color: #6b7280;
}

.text-green {
  color: #4ade80;
}

.text-gray {
  color: #6b7280;
}

.section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #9ca3af;
  margin: 0 0 12px;
}

.game-selector {
  display: flex;
  gap: 10px;
}

.game-option {
  flex: 1;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.game-option:hover {
  background: rgba(255, 255, 255, 0.06);
}

.game-option.selected {
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.08);
}

.game-name {
  font-size: 14px;
  color: #e5e7eb;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-lg {
  padding: 10px 24px;
  font-size: 15px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #d1d5db;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
