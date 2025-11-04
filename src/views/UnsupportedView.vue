<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const url = computed(() => {
  return `${import.meta.env.VITE_SST_URL}/${route.name?.toString()}`
})
</script>

<template>
  {{ $t('Please visit the KTS app to view') }} <a :href="url" target="blank">{{ route.name }}</a>
</template>
