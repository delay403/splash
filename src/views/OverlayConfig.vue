<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useGameStore } from "../stores/game";

const store = useGameStore();

const douyinUrl = ref("https://live.douyin.com/");
const urlSaved = ref(false);
const shortcutSaved = ref(false);
const errorMsg = ref("");
const recordingAction = ref<string | null>(null);

onMounted(async () => {
  await Promise.all([store.loadShortcuts(), store.loadDouyinUrl()]);
  douyinUrl.value = store.douyinLiveUrl;
});

async function saveUrl() {
  errorMsg.value = "";
  const url = douyinUrl.value.trim();
  if (!url) {
    errorMsg.value = "请输入抖音直播间 URL";
    return;
  }
  try {
    new URL(url);
  } catch {
    errorMsg.value = "URL 格式不正确";
    return;
  }
  await store.saveDouyinUrl(url);
  urlSaved.value = true;
  setTimeout(() => (urlSaved.value = false), 2000);
}

function startRecording(action: string) {
  recordingAction.value = action;
}

function stopRecording() {
  recordingAction.value = null;
}

function onKeyDown(e: KeyboardEvent) {
  if (!recordingAction.value) return;
  e.preventDefault();
  e.stopPropagation();

  if (e.key === "Escape") {
    stopRecording();
    return;
  }

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");

  let key = e.key;
  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();
  else if (/^F\d{1,2}$/.test(key)) key = key;
  else if (key.startsWith("Arrow")) {
    key = key.replace("Arrow", "");
    key = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  }

  if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
    parts.push(key);
    const accelerator = parts.join("+");
    confirmShortcut(accelerator, recordingAction.value);
    stopRecording();
  }
}

async function confirmShortcut(accelerator: string, action: string) {
  errorMsg.value = "";
  const success = await store.registerShortcut(accelerator, action);
  if (success) {
    shortcutSaved.value = true;
    setTimeout(() => (shortcutSaved.value = false), 2000);
  } else {
    errorMsg.value = `快捷键 "${accelerator}" 注册失败，可能被其他程序占用`;
  }
}

async function resetWindowPosition() {
  errorMsg.value = "";
  try {
    await window.electronAPI.setStore("lastWindowState.overlay", {
      width: 400,
      height: 700,
      x: null,
      y: null,
      visible: false,
    });
    shortcutSaved.value = true;
    setTimeout(() => (shortcutSaved.value = false), 2000);
  } catch {
    errorMsg.value = "重置失败";
  }
}
</script>

<template>
  <div class="page">
    <h2 class="page-title">悬浮窗设置</h2>
    <p class="page-desc">配置抖音直播间地址、全局快捷键和窗口行为。</p>

    <!-- 抖音 URL -->
    <div class="form-section">
      <h3 class="section-title">抖音直播间</h3>
      <p class="section-hint">输入直播间地址，首次打开需扫码登录，之后自动保持登录状态。</p>
      <div class="input-group">
        <input v-model="douyinUrl" type="text" class="text-input" placeholder="https://live.douyin.com/123456789"
          @keydown.enter="saveUrl" />
        <button class="btn btn-primary" @click="saveUrl">
          {{ urlSaved ? '✓ 已保存' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 快捷键绑定 -->
    <div class="form-section">
      <h3 class="section-title">全局快捷键</h3>
      <p class="section-hint">点击输入框后按下组合键进行绑定，按 Esc 取消。</p>

      <div class="shortcut-row">
        <label class="shortcut-label">显隐悬浮窗</label>
        <input :value="recordingAction === 'toggleOverlay' ? '录制中...' : store.shortcuts.toggleOverlay"
          class="shortcut-input" :class="{ recording: recordingAction === 'toggleOverlay' }" readonly
          @focus="startRecording('toggleOverlay')" @blur="stopRecording" @keydown="onKeyDown" />
      </div>

      <div class="shortcut-row">
        <label class="shortcut-label">启停检测</label>
        <input :value="recordingAction === 'toggleDetect' ? '录制中...' : store.shortcuts.toggleDetect"
          class="shortcut-input" :class="{ recording: recordingAction === 'toggleDetect' }" readonly
          @focus="startRecording('toggleDetect')" @blur="stopRecording" @keydown="onKeyDown" />
      </div>

      <div v-if="shortcutSaved" class="inline-success">快捷键已保存</div>
    </div>

    <!-- 窗口控制 -->
    <div class="form-section">
      <h3 class="section-title">窗口控制</h3>
      <div class="window-actions">
        <button class="btn btn-secondary" @click="resetWindowPosition">
          重置悬浮窗位置
        </button>
      </div>
      <p class="section-hint">将悬浮窗位置和尺寸恢复为默认值（下次打开生效）。</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
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

.form-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 18px 20px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #d1d5db;
  margin: 0 0 8px;
}

.section-hint {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 14px;
}

.input-group {
  display: flex;
  gap: 10px;
}

.text-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: #e5e7eb;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}

.text-input:focus {
  border-color: #60a5fa;
}

.shortcut-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.shortcut-label {
  font-size: 13px;
  color: #9ca3af;
  width: 100px;
  flex-shrink: 0;
}

.shortcut-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: #e5e7eb;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  outline: none;
  cursor: pointer;
  transition: all 0.15s;
}

.shortcut-input:focus {
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.05);
}

.shortcut-input.recording {
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.05);
  color: #fbbf24;
}

.inline-success {
  margin-top: 8px;
  font-size: 12px;
  color: #4ade80;
}

.window-actions {
  margin-bottom: 8px;
}

.error-msg {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  font-size: 13px;
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

.btn-primary:hover {
  background: #2563eb;
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
