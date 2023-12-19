<script setup>
import { RouterLink, RouterView } from 'vue-router'
import mapView from './views/mapView/index.vue'
</script>

<template>
  <div class="content">
    <router-view></router-view>
  </div>
</template>

<style scoped lang="scss">
.content{
  padding: 10px;
  height: 100%;
  width: 100%;
}

</style>
