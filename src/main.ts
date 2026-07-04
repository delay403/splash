import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";

console.log('[vue] Starting app...')
const app = createApp(App);
app.use(createPinia());
app.use(router);

const el = document.getElementById("app");
console.log('[vue] Mounting element:', el)
if (el) {
  app.mount("#app");
  console.log('[vue] App mounted successfully')
} else {
  console.error('[vue] #app element not found!')
}
