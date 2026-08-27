<script setup lang="ts">
import emptyStateImage from '@/assets/images/empty-state.png'

import BaseButton from '@/components/common/BaseButton.vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
    actionLabel?: string
    showAction?: boolean
  }>(),
  {
    description: '',
    actionLabel: '新しい予定を作る',
    showAction: true,
  },
)

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="empty-state">
    <img :src="emptyStateImage" alt="" class="empty-state__image" />

    <div class="empty-state__text">
      <h2 class="empty-state__title">
        {{ title }}
      </h2>

      <p v-if="description" class="empty-state__description">
        {{ description }}
      </p>
    </div>

    <BaseButton v-if="showAction" variant="secondary" @click="emit('action')">
      <span class="empty-state__action">
        <span class="empty-state__plus" aria-hidden="true"> ＋ </span>

        {{ actionLabel }}
      </span>
    </BaseButton>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-2;

  width: 100%;
  padding: $spacing-2 0;

  text-align: center;

  &__image {
    display: block;

    width: min(260px, 76%);
    height: auto;

    object-fit: contain;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__title {
    margin: 0;

    color: $color-text;
    font-size: $font-size-section-title;
    font-weight: $font-weight-bold;
  }

  &__description {
    margin: 0;

    color: $color-neutral-600;
    font-size: $font-size-body;
    line-height: 1.6;
  }

  &__action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-1;
  }

  &__plus {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 24px;
    height: 24px;

    border: 2px solid currentColor;
    border-radius: 50%;

    font-size: 19px;
    line-height: 1;
  }
}
</style>
