<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AppIcon from '@/components/common/AppIcon.vue'

withDefaults(
  defineProps<{
    scheduleId: string
    title: string
    period: string
    responseStatus: string
    answered?: boolean
  }>(),
  {
    answered: false,
  },
)
</script>

<template>
  <RouterLink
    class="schedule-card"
    :to="{ name: 'schedule-detail', params: { id: scheduleId } }"
    :aria-label="`${title}の予定詳細を見る`"
  >
    <div class="schedule-card__header">
      <h3 class="schedule-card__title">{{ title }}</h3>

      <span
        class="schedule-card__badge"
        :class="answered ? 'schedule-card__badge--answered' : 'schedule-card__badge--unanswered'"
      >
        {{ answered ? '回答済み' : '未回答' }}
      </span>
    </div>

    <div class="schedule-card__meta">
      <p class="schedule-card__meta-row">
        <AppIcon name="calendar" :size="20" />
        <span>{{ period }}</span>
      </p>

      <p class="schedule-card__meta-row" :aria-label="responseStatus">
        <AppIcon name="check-circle" :size="20" />
        <span>{{ responseStatus }}</span>
      </p>
    </div>

    <AppIcon class="schedule-card__chevron" name="chevron-right" :size="22" />
  </RouterLink>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.schedule-card {
  position: relative;

  display: flex;
  flex-direction: column;
  gap: $spacing-2;

  width: 100%;
  min-width: 0;
  padding: $spacing-2;

  border: 1px solid $color-neutral-300;
  border-radius: $radius-card;

  background-color: $color-surface;

  transition:
    border-color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    border-color: $color-primary;
  }

  &:active {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: 2px;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-2;
  }

  &__title {
    min-width: 0;
    margin: 0;

    color: $color-primary-dark;
    font-size: $font-size-card-title;
    font-weight: $font-weight-bold;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  &__badge {
    flex-shrink: 0;

    padding: 4px 8px;

    border-radius: $radius-chip;

    font-size: $font-size-caption;
    font-weight: $font-weight-semibold;

    &--answered {
      background-color: rgba($color-success, 0.14);
      color: $color-success;
    }

    &--unanswered {
      background-color: rgba($color-warning, 0.18);
      color: $color-text;
    }
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__meta-row {
    display: flex;
    align-items: center;
    gap: 8px;

    margin: 0;

    color: $color-neutral-600;
    font-size: $font-size-caption;
    line-height: 1.4;
  }

  &__meta-row :deep(.app-icon) {
    color: $color-primary;
  }

  &__chevron {
    align-self: flex-end;
    margin-top: auto;
    color: $color-primary;
  }
}
</style>
