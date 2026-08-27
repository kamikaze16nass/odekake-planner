<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: '戻る',
  },
)

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button type="button" class="back-button" :aria-label="label" @click="emit('click')">
    <svg class="back-button__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 4L7 12L15 20"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 40px;
  height: 40px;
  padding: 0;

  border: 0;
  border-radius: 50%;
  background: transparent;

  color: $color-primary;
  cursor: pointer;

  transition:
    background-color 0.15s ease,
    opacity 0.15s ease;

  &:hover {
    background-color: $color-primary-light;
  }

  &:active {
    opacity: 0.7;
  }

  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: 2px;
  }

  &__icon {
    width: 28px;
    height: 28px;
  }
}
</style>
