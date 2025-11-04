<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  segments: {
    label: string
    value: string | number
    color: string
    size: number // ratio of the total
  }[]
}>()

const segmentsWithOffsets = computed(() => {
  const result = []
  let offset = 0
  const nonZeroSegments = props.segments.filter(({ size }) => size > 0)
  for (const segment of nonZeroSegments) {
    result.push({
      ...segment,
      offset,
    })
    offset += segment.size * 360
  }
  return result
})
</script>

<template>
  <div class="pie-chart">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-90, 100,100)" fill="none" stroke-width="50">
        <circle r="50" cx="100" cy="100" stroke="#ccc" />
        <circle
          v-for="(segment, index) in segmentsWithOffsets"
          :key="index"
          r="50"
          cx="100"
          cy="100"
          :stroke="segment.color"
          :stroke-dasharray="`${314.15 * segment.size} 314.15`"
          :transform="`rotate(${segment.offset}, 100, 100)`"
        />
      </g>
    </svg>
    <ul class="pie-chart-legend" v-if="segmentsWithOffsets.length">
      <li
        v-for="(segment, index) in segmentsWithOffsets"
        :key="index"
        class="pie-chart-legend-item"
      >
        <span class="pie-chart-legend-color" :style="{ backgroundColor: segment.color }"></span>
        {{ segment.label }} - <strong>{{ segment.value }}</strong>
      </li>
    </ul>
  </div>
</template>

<style>
.pie-chart svg {
  display: block;
  height: 10rem;
  margin: 0 auto;
}
.pie-chart-legend {
  list-style: none;
  margin: 0 -0.25rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.pie-chart-legend-item {
  padding: 0 0.25rem;
}
.pie-chart-legend-color {
  display: inline-block;
  width: 0.7em;
  height: 0.7em;
}
</style>
