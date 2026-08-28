<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'

defineProps<{
  name: string
  answered: boolean
}>()
</script>

<template>
  <div class="response-status">
    <span
      class="response-status__icon"
      :class="{ 'response-status__icon--answered': answered }"
      aria-hidden="true"
    >
      <AppIcon :name="answered ? 'check-circle' : 'clock'" :size="18" />
    </span>

    <span class="response-status__name">
      {{ name }}
    </span>

    <span class="response-status__label">
      {{ answered ? '回答済み' : '未回答' }}
    </span>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.response-status {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: $spacing-1;

  min-height: 40px;

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 20px;
    height: 20px;

    // border: 1px solid $color-neutral-300;
    border-radius: 50%;

    color: $color-neutral-400;
    &--answered {
      border-color: $color-success;
      background-color: rgba($color-success, 0.12);
      color: $color-success;
    }
  }

  &__name {
    font-size: $font-size-body;
  }

  &__label {
    color: $color-neutral-600;
    font-size: $font-size-caption;
  }
}
</style>
