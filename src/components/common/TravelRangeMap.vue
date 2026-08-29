<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'

import type { TravelRange } from '@/utils/travelRange'

import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  ranges: TravelRange[]
}>()

const mapContainer = ref<HTMLDivElement | null>(null)

let map: L.Map | null = null
let rangeLayer: L.LayerGroup | null = null

const renderRanges = () => {
  if (!map) return

  rangeLayer?.remove()
  rangeLayer = L.layerGroup().addTo(map)

  const bounds = L.latLngBounds([])

  props.ranges.forEach((range) => {
    const circle = L.circle([range.lat, range.lng], {
      radius: range.radiusMeters,
      className: 'travel-range-map__circle',
      interactive: false,
      weight: 2,
    }).addTo(rangeLayer as L.LayerGroup)

    bounds.extend(circle.getBounds())
  })

  if (bounds.isValid()) {
    map.fitBounds(bounds, {
      padding: [24, 24],
      maxZoom: 14,
    })
  }
}

onMounted(() => {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    scrollWheelZoom: false,
    dragging: true,
    touchZoom: true,
    zoomControl: true,
  }).setView([35.681236, 139.767125], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  renderRanges()
})

watch(
  () => props.ranges,
  () => {
    renderRanges()
  },
  { deep: true },
)

onUnmounted(() => {
  map?.remove()
  map = null
  rangeLayer = null
})
</script>

<template>
  <div class="travel-range-map">
    <div ref="mapContainer" class="travel-range-map__map" />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.travel-range-map {
  width: 100%;
  height: 320px;
  overflow: hidden;
  border-radius: $radius-card;

  &__map {
    width: 100%;
    height: 100%;

    :deep(.leaflet-tile-pane) {
      filter: saturate(0.55) brightness(1.08) contrast(0.88);
    }

    :deep(.travel-range-map__circle) {
      stroke: $color-primary-dark;
      stroke-opacity: 0.7;
      fill: $color-primary;
      fill-opacity: 0.2;
    }
  }
}
</style>
