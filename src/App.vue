<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

import { useScheduleStore } from '@/stores/schedule'

const scheduleStore = useScheduleStore()

onMounted(async () => {
  const authSuccess =
    await scheduleStore.initializeAuth()

  if (!authSuccess) {
    return
  }

  await scheduleStore.fetchScheduleData()
})
</script>

<template>
  <RouterView />
</template>