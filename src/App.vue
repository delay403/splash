<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('[App.vue] Mounted')
  const app = document.getElementById('app')
  console.log('[App.vue] #app dimensions:', app?.offsetWidth, 'x', app?.offsetHeight)
})
</script>

<template>
  <router-view />
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  height: 100%;
  width: 100%;
}

:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  color: #e5e7eb;
  background-color: #1a1a2e;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  min-height: 100vh;
}
</style>
