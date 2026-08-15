<script setup lang="ts">
import * as THREE from 'three'

const toneMapping = THREE.ACESFilmicToneMapping
</script>

<template>
  <div class="knife-canvas">
    <TresCanvas shadows alpha :tone-mapping="toneMapping">
      <KnifeScene />
    </TresCanvas>
  </div>
</template>

<style scoped>
.knife-canvas {
  position: relative;
  width: 100%;
  height: 32rem;
}

@media (max-width: 640px) {
  .knife-canvas {
    height: 26rem;
  }
}
</style>
