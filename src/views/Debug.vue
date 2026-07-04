<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useGameStore } from "../stores/game";

const store = useGameStore();

onMounted(() => {
  store.initEventListeners();
});

const metrics = computed(() => {
  const isValorant = store.config.targetGame === "valorant";
  return [
    {
      label: "游戏状态",
      value: store.gameState,
      class: `state-${store.gameState.toLowerCase()}`,
    },
    {
      label: "饱和度",
      value: `${(store.debugData.saturation * 100).toFixed(1)}%`,
      bar: store.debugData.saturation,
      primary: !isValorant,
    },
    {
      label: "亮度",
      value: `${(store.debugData.brightness * 100).toFixed(1)}%`,
      bar: store.debugData.brightness,
    },
    {
      label: "灰度占比",
      value: `${(store.debugData.grayscale_ratio * 100).toFixed(1)}%`,
      bar: store.debugData.grayscale_ratio,
      primary: !isValorant,
    },
    {
      label: "中心白色",
      value: `${(store.debugData.center_white * 100).toFixed(1)}%`,
      bar: store.debugData.center_white,
      primary: !isValorant,
    },
    {
      label: "底部饱和度",
      value: `${(store.debugData.bottom_saturation * 100).toFixed(1)}%`,
      bar: store.debugData.bottom_saturation,
      primary: isValorant,
    },
    {
      label: "底部彩色占比",
      value: `${(store.debugData.bottom_colorful * 100).toFixed(1)}%`,
      bar: store.debugData.bottom_colorful,
      primary: isValorant,
    },
  ];
});

const stateLabels: Record<string, string> = {
  alive: "存活",
  dead: "死亡",
  transitioning: "过渡中",
  nogame: "未检测到游戏",
};
</script>

<template>
  <div class="page">
    <h2 class="page-title">实时调试</h2>
    <p class="page-desc">实时显示屏幕截图分析数据和状态机判定结果。<span class="highlight">蓝色高亮</span>的指标为当前游戏的主要判定依据。</p>

    <!-- 状态机可视化 -->
    <div class="state-viz">
      <div
        v-for="s in ['alive', 'dead', 'transitioning', 'nogame']"
        :key="s"
        class="state-node"
        :class="{ current: store.gameState.toLowerCase() === s }"
      >
        <span class="state-name">{{ stateLabels[s] }}</span>
      </div>
    </div>

    <!-- 指标面板 -->
    <div class="metrics">
      <div
        v-for="m in metrics"
        :key="m.label"
        class="metric-card"
        :class="{ primary: (m as any).primary }"
      >
        <div class="metric-header">
          <span class="metric-label">
            {{ m.label }}
            <span v-if="(m as any).primary" class="primary-tag">主要</span>
          </span>
          <span class="metric-value" :class="m.class">{{ m.value }}</span>
        </div>
        <div v-if="m.bar !== undefined" class="metric-bar">
          <div class="metric-fill" :style="{ width: `${Math.min(m.bar * 100, 100)}%` }"></div>
        </div>
      </div>
    </div>

    <!-- 运行状态 -->
    <div class="info-section">
      <h3 class="section-title">引擎状态</h3>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">检测引擎</span>
          <span :class="['info-value', store.detectionRunning ? 'text-green' : 'text-gray']">
            {{ store.detectionRunning ? '运行中' : '已停止' }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">悬浮窗</span>
          <span :class="['info-value', store.overlayVisible ? 'text-green' : 'text-gray']">
            {{ store.overlayVisible ? '显示中' : '已隐藏' }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">目标游戏</span>
          <span class="info-value">{{ store.config.targetGame === 'overwatch2' ? '守望先锋 2' : '无畏契约' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">检测策略</span>
          <span class="info-value">
            {{ store.config.targetGame === 'overwatch2' ? '全屏饱和度+灰度+白色文字' : '底部技能图标彩色占比' }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">检测间隔</span>
          <span class="info-value">{{ store.config.intervalMs }} ms</span>
        </div>
        <div class="info-row">
          <span class="info-label">死亡确认帧</span>
          <span class="info-value">{{ store.config.deadConfirmFrames }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">复活确认帧</span>
          <span class="info-value">{{ store.config.aliveConfirmFrames }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 640px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #e5e7eb;
}

.page-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 24px;
}

.highlight {
  color: #60a5fa;
}

/* 状态机可视化 */
.state-viz {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.state-node {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s;
}

.state-node.current {
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
}

.state-name {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.state-node.current .state-name {
  color: #60a5fa;
}

/* 指标面板 */
.metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 12px 14px;
  transition: border-color 0.15s;
}

.metric-card.primary {
  border-color: rgba(96, 165, 250, 0.4);
  background: rgba(96, 165, 250, 0.04);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.metric-label {
  font-size: 13px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 6px;
}

.primary-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
  font-weight: 600;
}

.metric-value {
  font-size: 14px;
  font-weight: 700;
  color: #e5e7eb;
  font-family: 'Courier New', monospace;
}

.state-alive { color: #4ade80; }
.state-dead { color: #f87171; }
.state-transitioning { color: #fbbf24; }
.state-nogame { color: #6b7280; }

.metric-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  background: #60a5fa;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 引擎状态 */
.info-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 18px 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #d1d5db;
  margin: 0 0 14px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: #6b7280;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
}

.text-green { color: #4ade80; }
.text-gray { color: #6b7280; }
</style>
