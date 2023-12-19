import "./assets/main.css";
import "../node_modules/leaflet/dist/leaflet.css";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { Ion } from "cesium";
import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createPinia } from "pinia";
import { config } from "./serve/config";

import App from "./App.vue";
import router from "./router";

Ion.defaultAccessToken = config.cesiumToken;
window.CESIUM_BASE_URL = "/libs/cesium/";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Ion);
app.use(ElementPlus);

app.mount("#app");
