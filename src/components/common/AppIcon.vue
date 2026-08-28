<script setup lang="ts">
withDefaults(
  defineProps<{
    name:
      | 'calendar'
      | 'sparkles'
      | 'place-vote'
      | 'route'
      | 'walking'
      | 'car'
      | 'train'
      | 'no-condition'
      | 'map-pin'
      | 'clock'
      | 'check-circle'
      | 'chart-bar'
      | 'chevron-left'
      | 'chevron-right'
      | 'x'
      | 'user-plus'
    size?: number | string
  }>(),
  {
    size: 24,
  },
)
</script>

<template>
  <svg
    class="app-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    :width="size"
    :height="size"
  >
    <template v-if="name === 'calendar'">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3V7 M17 3V7 M3 10H21" />
    </template>

    <template v-else-if="name === 'sparkles'">
      <path d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z" />
      <path d="M19 14L19.8 16.2L22 17L19.8 17.8L19 20L18.2 17.8L16 17L18.2 16.2L19 14Z" />
      <path d="M5 14L5.7 16L8 17L5.7 18L5 20L4.3 18L2 17L4.3 16.2L5 14Z" />
    </template>

    <template v-else-if="name === 'place-vote'">
      <path d="M12 21C12 21 19 15.2 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 15.2 12 21 12 21Z" />
      <path d="M12 12.5L9.8 10.4C8.2 8.8 10.5 6.5 12 8.2C13.5 6.5 15.8 8.8 14.2 10.4L12 12.5Z" />
    </template>

    <template v-else-if="name === 'route'">
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18H11C13.2 18 15 16.2 15 14C15 11.8 13.2 10 11 10H9C7.3 10 6 8.7 6 7C6 5.3 7.3 4 9 4H16" />
    </template>

    <template v-else-if="name === 'walking'">
      <circle cx="13" cy="4" r="2" />
      <path d="M10 21L12 14L9 11L7 15" />
      <path d="M12 7L15 10L18 11" />
      <path d="M12 14L16 17L18 21" />
      <path d="M9 11L11 7L15 7" />
    </template>

    <template v-else-if="name === 'car'">
      <path d="M4 16V11L6.5 6H17.5L20 11V16" />
      <path d="M4 12H20" />
      <path d="M7 16H17" />
      <circle cx="7" cy="16" r="2" />
      <circle cx="17" cy="16" r="2" />
    </template>

    <template v-else-if="name === 'train'">
      <rect x="5" y="3" width="14" height="15" rx="3" />
      <path d="M8 7H16 M5 12H19 M8 21L10 18 M16 21L14 18" />
      <circle cx="9" cy="15" r="1" />
      <circle cx="15" cy="15" r="1" />
    </template>

    <template v-else-if="name === 'no-condition'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7L12.8 9.2L15 10L12.8 10.8L12 13L11.2 10.8L9 10L11.2 9.2L12 7Z" />
      <path d="M16.5 14.5L17 16L18.5 16.5L17 17L16.5 18.5L16 17L14.5 16.5L16 16L16.5 14.5Z" />
    </template>

    <template v-else-if="name === 'map-pin'">
      <path d="M12 21C12 21 19 15.2 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 15.2 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </template>

    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7V12L15.5 14" />
    </template>

    <template v-else-if="name === 'check-circle'">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12L11 15L16.5 9.5" />
    </template>

    <template v-else-if="name === 'chart-bar'">
      <path d="M4 20V11 M10 20V5 M16 20V14 M3 20H21" />
    </template>

    <path v-else-if="name === 'chevron-left'" d="M15 18L9 12L15 6" />
    <path v-else-if="name === 'chevron-right'" d="M9 18L15 12L9 6" />
    <path v-else-if="name === 'x'" d="M6 6L18 18M18 6L6 18" />

    <template v-else-if="name === 'user-plus'">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19C3 15.7 5.7 13 9 13C11.4 13 13.5 14.4 14.4 16.5" />
      <path d="M18 11V19 M14 15H22" />
    </template>
  </svg>
</template>

<style scoped>
.app-icon {
  display: block;
  flex-shrink: 0;
}
</style>
