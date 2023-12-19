<template>
  <div id="container" class="map-view"></div>
</template>

<script>
import L from "leaflet";
export default {
  data() {
    return {
      map: null,
    };
  },
  components: {},
  created() {},
  methods: {
    initMap() {
      this.map = L.map("container").setView([51.505, -0.09], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.map);
    },
  },
  mounted() {
    this.initMap();
  },
};
</script>
<style scoped lang='scss'>
.map-view{
  height: 100%;
  width: 100%;
}
</style>