<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    compact?: boolean
  }>(),
  {
    label: '読み込んでいます',
    compact: false,
  },
)
</script>

<template>
  <div
    class="loading-state"
    :class="{ 'loading-state--compact': compact }"
    role="status"
    aria-live="polite"
  >
    <span class="loading-state__dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>

    <p>{{ label }}</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.loading-state {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: $spacing-2;
  padding: $spacing-3;
  color: $color-neutral-600;
  text-align: center;

  &--compact {
    min-height: auto;
    gap: $spacing-1;
    padding: $spacing-2;
  }

  &__dots {
    display: inline-flex;
    align-items: center;
    gap: $spacing-1;

    span {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: $color-primary;
      animation: loading-state-pulse 1.2s ease-in-out infinite;

      &:nth-child(2) {
        animation-delay: 0.16s;
      }

      &:nth-child(3) {
        animation-delay: 0.32s;
      }
    }
  }

  p {
    margin: 0;
    font-size: $font-size-body;
  }
}

@keyframes loading-state-pulse {
  0%,
  60%,
  100% {
    opacity: 0.42;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-state__dots span {
    animation: none;
    opacity: 0.72;
  }
}
</style>
