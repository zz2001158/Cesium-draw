import { createRouter, createWebHashHistory } from "vue-router";
import mapView from "../views/mapView/index.vue";
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/cesium",
    },
    {
      path: "/leaflet",
      name: "mapView",
      component: mapView,
    },
    {
      path: "/cesium",
      name: "cesiumView",
      component: () => import("../views/cesiumView/index.vue"),
    },
  ],
});

export default router;
