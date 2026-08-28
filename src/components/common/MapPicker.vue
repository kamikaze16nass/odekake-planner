<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

type LocationValue = {
  lat: number
  lng: number
}

const props = withDefaults(
  defineProps<{
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const model = defineModel<LocationValue | null>({
  default: null,
})

const emit = defineEmits<{
  locationSelected: [location: LocationValue]
}>()

const mapContainer = ref<HTMLDivElement | null>(null)

let map: L.Map | null = null
let marker: L.Marker | null = null

const renderMarker = (location: LocationValue | null, shouldMoveMap = false) => {
  if (!map) return

  if (!location) {
    marker?.remove()
    marker = null
    return
  }

  if (marker) {
    marker.setLatLng([location.lat, location.lng])
  } else {
    marker = L.marker([location.lat, location.lng]).addTo(map)
  }

  if (shouldMoveMap) {
    map.setView([location.lat, location.lng], Math.max(map.getZoom(), 15))
  }
}

const setMarkerFromMap = (lat: number, lng: number) => {
  if (!map || props.disabled) return

  const location = {
    lat,
    lng,
  }

  renderMarker(location)
  model.value = location
  emit('locationSelected', location)
}

onMounted(() => {
  if (!mapContainer.value) return

  const initialLat = model.value?.lat ?? 35.681236

  const initialLng = model.value?.lng ?? 139.767125

  map = L.map(mapContainer.value).setView([initialLat, initialLng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  renderMarker(model.value)
  map.on('click', (event: L.LeafletMouseEvent) => {
    setMarkerFromMap(event.latlng.lat, event.latlng.lng)
  })
})

watch(
  () => model.value,
  (location) => {
    renderMarker(location, Boolean(location))
  },
)

onUnmounted(() => {
  map?.remove()
  map = null
  marker = null
})
</script>

<template>
  <div class="map-picker" :aria-disabled="disabled">
    <div ref="mapContainer" class="map-picker__map" />

    <div v-if="disabled" class="map-picker__interaction-blocker" aria-hidden="true" />
  </div>
</template>

<style scoped>
.map-picker {
  position: relative;
  width: 100%;
  height: 320px;
  border-radius: 16px;
  overflow: hidden;
}

.map-picker__map {
  width: 100%;
  height: 100%;
}

.map-picker__map :deep(.leaflet-tile-pane) {
  filter: saturate(0.55) brightness(1.08) contrast(0.88);
}

.map-picker__interaction-blocker {
  position: absolute;
  inset: 0;
  z-index: 1000;
  background: transparent;
  cursor: wait;
}
</style>
