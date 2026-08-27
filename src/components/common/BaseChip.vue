<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    selected?: boolean
    disabled?: boolean
  }>(),
  {
    selected: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  select: [selected: boolean]
}>()

const handleClick = () => {
  if (props.disabled) return

  emit('select', !props.selected)
}
</script>

<template>
  <button
    type="button"
    class="base-chip"
    :class="{
      'base-chip--selected': selected,
      'base-chip--disabled': disabled,
    }"
    :disabled="disabled"
    :aria-pressed="selected"
    @click="handleClick"
  >
    <span v-if="selected" class="base-chip__check" aria-hidden="true">
      ✓
    </span>

    <span>{{ label }}</span>
  </button>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.base-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  min-height: 36px;
  padding: 6px 14px;

  border: 1px solid $color-neutral-300;
  border-radius: $radius-chip;

  background-color: $color-surface;
  color: $color-text;

  font-size: $font-size-body;
  font-weight: $font-weight-regular;

  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: $color-primary;
  }

  &--selected {
    background-color: $color-primary-light;
    border-color: $color-primary;
    color: $color-primary-dark;
    font-weight: $font-weight-semibold;
  }

  &--disabled {
    background-color: $color-neutral-100;
    border-color: $color-neutral-100;
    color: $color-neutral-400;
    cursor: not-allowed;
  }

  &__check {
    color: $color-primary;
    font-weight: $font-weight-bold;
  }
}
</style>