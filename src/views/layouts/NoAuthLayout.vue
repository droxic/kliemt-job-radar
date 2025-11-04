<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import KliemtLogo from '@/components/KliemtLogo.vue'

const bodyClass = 'layout-no-auth'

onMounted(() => {
  document.body.classList.add(bodyClass)
})
onUnmounted(() => {
  document.body.classList.remove(bodyClass)
})
</script>

<template>
  <KliemtLogo />
  <main>
    <slot />
  </main>
</template>

<style>
.layout-no-auth {
  background: var(--color-background-accent);
}
.layout-no-auth main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.layout-no-auth .kliemt-logo {
  width: 12rem;
  margin: 5rem auto;
  display: block;
}
</style>
