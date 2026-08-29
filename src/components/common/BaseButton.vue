<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'success' | 'disabled'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    fullWidth?: boolean
    loading?: boolean
    loadingLabel?: string
  }>(),
  {
    variant: 'primary',
    type: 'button',
    disabled: false,
    fullWidth: true,
    loading: false,
    loadingLabel: '',
  },
)
</script>

<template>
  <button
    class="base-button"
    :class="[
      `base-button--${variant}`,
      {
        'base-button--full': fullWidth,
        'base-button--loading': loading,
      },
    ]"
    :type="type"
    :disabled="disabled || loading || variant === 'disabled'"
    :aria-busy="loading || undefined"
  >
    <span class="base-button__content">
      <span v-if="loading" class="base-button__loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>

      <span v-if="loading && loadingLabel">{{ loadingLabel }}</span>
      <slot v-else />
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.base-button {
  min-height: 44px;
  padding: $spacing-1 $spacing-2;

  border: 1px solid transparent;
  border-radius: $radius-button;

  font-family: inherit;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
  line-height: 1.4;

  cursor: pointer;

  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;

  &__content {
    display: inline-flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    gap: $spacing-1;
  }

  &__loading-dots {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    span {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
      animation: base-button-loading-pulse 1.2s ease-in-out infinite;

      &:nth-child(2) {
        animation-delay: 0.16s;
      }

      &:nth-child(3) {
        animation-delay: 0.32s;
      }
    }
  }

  &--loading {
    cursor: wait;
  }

  &--full {
    width: 100%;
  }

  &--primary {
    background-color: $color-primary;
    color: $color-neutral-0;

    &:hover:not(:disabled) {
      background-color: $color-primary-dark;
    }
  }

  &--success {
    background-color: $color-success;
    color: $color-neutral-0;

    &:hover:not(:disabled) {
      opacity: 0.88;
    }
  }

  &--secondary {
    background-color: $color-surface;
    border-color: $color-primary;
    color: $color-primary;

    &:hover:not(:disabled) {
      background-color: $color-primary-light;
    }
  }

  &--disabled,
  &:disabled:not(.base-button--loading) {
    background-color: $color-neutral-100;
    border-color: $color-neutral-100;
    color: $color-neutral-400;
    cursor: not-allowed;
  }
}

@keyframes base-button-loading-pulse {
  0%,
  60%,
  100% {
    opacity: 0.4;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .base-button__loading-dots span {
    animation: none;
    opacity: 0.72;
  }
}
</style>
