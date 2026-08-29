<script setup lang="ts">
const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    type?: 'text' | 'email' | 'password' | 'number'
    disabled?: boolean
    error?: string
    hint?: string
    required?: boolean
  }>(),
  {
    label: '',
    placeholder: '',
    type: 'text',
    disabled: false,
    error: '',
    hint: '',
    required: false,
  },
)
</script>

<template>
  <label class="base-input">
    <span v-if="label" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required">*</span>
    </span>

    <input
      v-model="model"
      class="base-input__control"
      :class="{
        'base-input__control--error': error,
      }"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="Boolean(error)"
    />

    <span v-if="error" class="base-input__error">
      {{ error }}
    </span>

    <span v-else-if="hint" class="base-input__hint">
      {{ hint }}
    </span>
  </label>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.base-input {
  display: flex;
  flex-direction: column;
  gap: $spacing-1;
  width: 100%;

  &__label {
    font-size: $font-size-body;
    font-weight: $font-weight-semibold;
    color: $color-text;
  }

  &__required {
    color: $color-primary;
  }

  &__control {
    width: 100%;
    min-height: 44px;
    padding: 10px $spacing-2;

    border: 1px solid $color-neutral-300;
    border-radius: $radius-input;

    background-color: $color-surface;
    color: $color-text;

    font-size: $font-size-body;
    outline: none;

    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;

    &::placeholder {
      color: $color-neutral-400;
    }

    &:focus {
      border-color: $color-primary;
      box-shadow: 0 0 0 3px $color-primary-light;
    }

    &:disabled {
      background-color: $color-neutral-100;
      color: $color-neutral-400;
      cursor: not-allowed;
    }

    &--error {
      border-color: $color-error;
    }
  }

  &__hint {
    font-size: $font-size-caption;
    color: $color-neutral-600;
  }

  &__error {
    font-size: $font-size-caption;
    color: $color-error;
  }
}
</style>
