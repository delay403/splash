import { defineStore } from "pinia";
import { ref } from "vue";
import { getApi, type DetectionConfig, type AnalysisDebug, type GameState, type ShortcutConfig, type GameStateChangedPayload } from "../lib/ipc";

export type { GameState, DetectionConfig, AnalysisDebug };

export const useGameStore = defineStore("game", () => {
  const api = getApi();

  // State
  const gameState = ref<GameState>("NoGame");
  const detectionRunning = ref(false);
  const overlayVisible = ref(false);
  const config = ref<DetectionConfig>({
    targetGame: "overwatch2",
    detectIntervalMs: 1500,
    deadConfirmFrames: 3,
    aliveConfirmFrames: 2,
    saturationDeadThreshold: 0.15,
    saturationAliveThreshold: 0.25,
    grayscaleRatioThreshold: 0.7,
    centerWhiteThreshold: 0.05,
    brightnessDeadThreshold: 0.18,
    valorantSaturationThreshold: 0.12,
    valorantGrayscaleThreshold: 0.80,
  });
  const debugData = ref<AnalysisDebug>({
    saturation: 0,
    brightness: 0,
    grayscale_ratio: 0,
    center_white: 0,
    bottom_saturation: 0,
    bottom_colorful: 0,
    spectator_id_visible: 0,
    game_state: "NoGame",
  });
  const douyinLiveUrl = ref("https://live.douyin.com/");
  const shortcuts = ref<ShortcutConfig>({
    toggleOverlay: "CommandOrControl+Shift+O",
    toggleDetect: "CommandOrControl+Shift+D",
  });

  // Actions
  async function startDetection() {
    try {
      await api.startDetection();
      detectionRunning.value = true;
    } catch (e) {
      console.error("Failed to start detection:", e);
    }
  }

  async function stopDetection() {
    try {
      await api.stopDetection();
      detectionRunning.value = false;
    } catch (e) {
      console.error("Failed to stop detection:", e);
    }
  }

  async function updateConfig(newConfig: DetectionConfig) {
    try {
      await api.updateConfig(newConfig);
      config.value = newConfig;
    } catch (e) {
      console.error("Failed to update config:", e);
    }
  }

  async function loadConfig() {
    try {
      const cfg = await api.getConfig();
      config.value = cfg;
    } catch (e) {
      console.error("Failed to load config:", e);
    }
  }

  async function showOverlayManual() {
    await api.showOverlay();
    overlayVisible.value = true;
  }

  async function hideOverlayManual() {
    await api.hideOverlay();
    overlayVisible.value = false;
  }

  async function setClickThrough(ignore: boolean) {
    await api.setClickThrough(ignore);
  }

  async function loadShortcuts() {
    try {
      shortcuts.value = await api.getShortcuts();
    } catch (e) {
      console.error("Failed to load shortcuts:", e);
    }
  }

  async function registerShortcut(accelerator: string, action: string): Promise<boolean> {
    try {
      const success = await api.registerShortcut(accelerator, action);
      if (success) {
        await loadShortcuts();
      }
      return success;
    } catch (e) {
      console.error("Failed to register shortcut:", e);
      return false;
    }
  }

  async function loadDouyinUrl() {
    try {
      douyinLiveUrl.value = await api.getDouyinUrl();
    } catch (e) {
      console.error("Failed to load douyin URL:", e);
    }
  }

  async function saveDouyinUrl(url: string) {
    try {
      await api.setDouyinUrl(url);
      douyinLiveUrl.value = url;
    } catch (e) {
      console.error("Failed to save douyin URL:", e);
    }
  }

  // 初始化事件监听
  function initEventListeners() {
    api.on("game-state-changed", (data) => {
      const payload = data as GameStateChangedPayload;
      gameState.value = payload.state;
    });

    api.on("overlay-visibility-changed", (data) => {
      overlayVisible.value = data as boolean;
    });

    api.on("detection-status-changed", (data) => {
      detectionRunning.value = data as boolean;
    });

    api.on("analysis-debug", (data) => {
      debugData.value = data as AnalysisDebug;
    });
  }

  return {
    gameState,
    detectionRunning,
    overlayVisible,
    config,
    debugData,
    douyinLiveUrl,
    shortcuts,
    startDetection,
    stopDetection,
    updateConfig,
    loadConfig,
    showOverlayManual,
    hideOverlayManual,
    setClickThrough,
    loadShortcuts,
    registerShortcut,
    loadDouyinUrl,
    saveDouyinUrl,
    initEventListeners,
  };
});
