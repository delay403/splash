import { createRouter, createWebHashHistory } from "vue-router";
import Layout from "./views/Layout.vue";
import Home from "./views/Home.vue";
import DetectionConfig from "./views/DetectionConfig.vue";
import OverlayConfig from "./views/OverlayConfig.vue";
import Debug from "./views/Debug.vue";
import Overlay from "./views/Overlay.vue";

const routes = [
  {
    path: "/",
    component: Layout,
    children: [
      { path: "", name: "home", component: Home },
      { path: "detection", name: "detection", component: DetectionConfig },
      { path: "overlay-config", name: "overlay-config", component: OverlayConfig },
      { path: "debug", name: "debug", component: Debug },
    ],
  },
  {
    path: "/overlay",
    name: "overlay",
    component: Overlay,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
