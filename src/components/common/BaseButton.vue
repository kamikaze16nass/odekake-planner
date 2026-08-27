<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'success' | 'disabled'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    fullWidth?: boolean
  }>(),
  {
    variant: 'primary',
    type: 'button',
    disabled: false,
    fullWidth: true,
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
      },
    ]"
    :type="type"
    :disabled="disabled || variant === 'disabled'"
  >
    <slot />
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
  &:disabled {
    background-color: $color-neutral-100;
    border-color: $color-neutral-100;
    color: $color-neutral-400;
    cursor: not-allowed;
  }
}
</style>
