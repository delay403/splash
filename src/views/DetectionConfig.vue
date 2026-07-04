<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useGameStore } from "../stores/game";

const store = useGameStore();
const saved = ref(false);

const local = reactive({
  // 通用
  targetGame: "overwatch2",
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
});

const gameOptions = [
  { value: "overwatch2", label: "守望先锋 2" },
  { value: "valorant", label: "无畏契约 (Valorant)" },
];

onMounted(async () => {
  store.initEventListeners();
  await store.loadConfig();
  Object.assign(local, store.config);
});

async function apply() {
  await store.updateConfig({ ...local });
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}

function reset() {
  const game = local.targetGame;
  Object.assign(local, {
    targetGame: game,
    intervalMs: 1500,
    deadConfirmFrames: 3,
    aliveConfirmFrames: 2,
    saturationDeadThreshold: 0.15,
    saturationAliveThreshold: 0.25,
    grayscaleRatioThreshold: 0.7,
    centerWhiteThreshold: 0.05,
    bottomColorRatioDead: 0.05,
    bottomColorRatioAlive: 0.12,
  });
}
</script>

<template>
  <div class="page">
    <h2 class="page-title">检测参数</h2>
    <p class="page-desc">不同游戏使用不同的检测策略，选定游戏后下方会显示对应的阈值配置。</p>

    <div class="form-sections">
      <!-- 游戏选择 -->
      <div class="form-section">
        <h3 class="section-title">目标游戏</h3>
        <div class="game-selector">
          <label
            v-for="g in gameOptions"
            :key="g.value"
            class="game-option"
            :class="{ selected: local.targetGame === g.value }"
          >
            <input
              type="radio"
              :value="g.value"
              :checked="local.targetGame === g.value"
              v-model="local.targetGame"
              hidden
            />
            <span class="game-name">{{ g.label }}</span>
          </label>
        </div>
        <p class="section-hint">
          <span v-if="local.targetGame === 'overwatch2'">死亡时画面变为灰度/低饱和度，中心出现白色死亡提示文字</span>
          <span v-else-if="local.targetGame === 'valorant'">死亡时底部技能图标消失，进入观战视角（屏幕不变灰）</span>
        </p>
      </div>

      <!-- 守望先锋 2 阈值 -->
      <div v-if="local.targetGame === 'overwatch2'" class="form-section">
        <h3 class="section-title">饱和度检测</h3>

        <div class="slider-group">
          <div class="slider-header">
            <label>死亡饱和度阈值</label>
            <span class="slider-value">{{ local.saturationDeadThreshold.toFixed(2) }}</span>
          </div>
          <input type="range" min="0" max="0.5" step="0.01" v-model.number="local.saturationDeadThreshold" />
          <p class="slider-hint">低于此值判定为灰度（死亡）画面</p>
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <label>存活饱和度阈值</label>
            <span class="slider-value">{{ local.saturationAliveThreshold.toFixed(2) }}</span>
          </div>
          <input type="range" min="0.1" max="0.8" step="0.01" v-model.number="local.saturationAliveThreshold" />
          <p class="slider-hint">高于此值判定为彩色（存活）画面</p>
        </div>

        <h3 class="section-title" style="margin-top: 20px;">辅助检测</h3>

        <div class="slider-group">
          <div class="slider-header">
            <label>灰度像素占比阈值</label>
            <span class="slider-value">{{ local.grayscaleRatioThreshold.toFixed(2) }}</span>
          </div>
          <input type="range" min="0.3" max="0.95" step="0.01" v-model.number="local.grayscaleRatioThreshold" />
          <p class="slider-hint">灰度像素占全屏比例超过此值时，辅助判定死亡</p>
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <label>中心白色文字阈值</label>
            <span class="slider-value">{{ local.centerWhiteThreshold.toFixed(2) }}</span>
          </div>
          <input type="range" min="0.01" max="0.3" step="0.01" v-model.number="local.centerWhiteThreshold" />
          <p class="slider-hint">中心区域白色像素占比超过此值，判定存在死亡提示文字</p>
        </div>
      </div>

      <!-- 无畏契约 阈值 -->
      <div v-if="local.targetGame === 'valorant'" class="form-section">
        <h3 class="section-title">底部技能图标检测</h3>
        <p class="section-hint">分析屏幕底部 15% 区域的彩色像素占比。存活时该区域有技能图标，死亡后图标消失。</p>

        <div class="slider-group">
          <div class="slider-header">
            <label>死亡彩色占比阈值</label>
            <span class="slider-value">{{ local.bottomColorRatioDead.toFixed(2) }}</span>
          </div>
          <input type="range" min="0.01" max="0.2" step="0.01" v-model.number="local.bottomColorRatioDead" />
          <p class="slider-hint">底部区域彩色像素占比低于此值 → 技能图标消失 → 判定死亡</p>
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <label>存活彩色占比阈值</label>
            <span class="slider-value">{{ local.bottomColorRatioAlive.toFixed(2) }}</span>
          </div>
          <input type="range" min="0.05" max="0.5" step="0.01" v-model.number="local.bottomColorRatioAlive" />
          <p class="slider-hint">底部区域彩色像素占比高于此值 → 技能图标存在 → 判定存活</p>
        </div>
      </div>

      <!-- 通用防抖参数 -->
      <div class="form-section">
        <h3 class="section-title">防抖与频率</h3>

        <div class="slider-group">
          <div class="slider-header">
            <label>死亡确认帧数</label>
            <span class="slider-value">{{ local.deadConfirmFrames }}</span>
          </div>
          <input type="range" min="1" max="10" step="1" v-model.number="local.deadConfirmFrames" />
          <p class="slider-hint">连续 N 帧确认后才切换为死亡状态</p>
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <label>复活确认帧数</label>
            <span class="slider-value">{{ local.aliveConfirmFrames }}</span>
          </div>
          <input type="range" min="1" max="10" step="1" v-model.number="local.aliveConfirmFrames" />
          <p class="slider-hint">连续 N 帧确认后才切换为存活状态</p>
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <label>检测间隔</label>
            <span class="slider-value">{{ local.intervalMs }} ms</span>
          </div>
          <input type="range" min="500" max="5000" step="100" v-model.number="local.intervalMs" />
          <p class="slider-hint">每隔多少毫秒截取一次屏幕进行分析</p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <button class="btn btn-primary" @click="apply">
        {{ saved ? '✓ 已保存' : '应用配置' }}
      </button>
      <button class="btn btn-secondary" @click="reset">恢复默认</button>
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
  margin: 0 0 28px;
}

.form-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 18px 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #d1d5db;
  margin: 0 0 16px;
}

.section-hint {
  font-size: 12px;
  color: #6b7280;
  margin: 10px 0 0;
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

.slider-group {
  margin-bottom: 18px;
}

.slider-group:last-child {
  margin-bottom: 0;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.slider-header label {
  font-size: 13px;
  color: #9ca3af;
}

.slider-value {
  font-size: 13px;
  font-weight: 600;
  color: #60a5fa;
  font-family: 'Courier New', monospace;
}

input[type="range"] {
  width: 100%;
  accent-color: #60a5fa;
  margin: 0;
}

.slider-hint {
  font-size: 11px;
  color: #4b5563;
  margin: 4px 0 0;
}

.form-actions {
  margin-top: 28px;
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}
.btn-primary:hover { background: #2563eb; }

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #d1d5db;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }
</style>
