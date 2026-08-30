<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'

type NoticeType = 'answer-required' | 'waiting' | 'all-answered'

const props = withDefaults(
  defineProps<{
    type: NoticeType
    title: string
    scheduleName: string
    period: string
    responseStatus?: string
    actionLabel: string
  }>(),
  {
    responseStatus: '',
  },
)

const emit = defineEmits<{
  action: []
}>()

const buttonVariant = computed(() => {
  if (props.type === 'all-answered') return 'success'
  if (props.type === 'waiting') return 'secondary'
  return 'primary'
})
</script>

<template>
  <article class="notice-card" :class="`notice-card--${type}`">
    <!-- 見出し -->
    <div class="notice-card__heading">
      <AppIcon
        class="notice-card__status-icon"
        :name="type === 'all-answered' ? 'check-circle' : 'clock'"
        :size="28"
      />

      <h2 class="notice-card__title">
        {{ title }}
      </h2>
    </div>

    <!-- 内容 -->
    <div class="notice-card__content">
      <p class="notice-card__schedule-name">
        {{ scheduleName }}
      </p>

      <!-- 日付 -->
      <p class="notice-card__meta">
        <svg class="notice-card__meta-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />

          <path
            d="M7 3V7 M17 3V7 M3 10H21"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>

        <span>{{ period }}</span>
      </p>

      <!-- 回答状況 -->
      <p v-if="responseStatus" class="notice-card__meta">
        <svg class="notice-card__meta-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2" />

          <path
            d="M3 19C3 15.7 5.7 13 9 13C12.3 13 15 15.7 15 19"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />

          <path
            d="M16 6C18.2 6.4 20 8.4 20 11M17 14C19.3 14.8 21 16.7 21 19"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>

        <span>{{ responseStatus }}</span>
      </p>

      <!-- 全員回答済み -->
      <p v-else-if="type === 'all-answered'" class="notice-card__meta notice-card__meta--success">
        <svg class="notice-card__meta-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2" />

          <path
            d="M3 19C3 15.7 5.7 13 9 13C12.3 13 15 15.7 15 19"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />

          <path
            d="M15 16L17 18L21 13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <span>全員回答済み</span>
      </p>
    </div>

    <!-- CTA -->
    <BaseButton class="notice-card__action" :variant="buttonVariant" @click="emit('action')">
      <span class="notice-card__action-content">
        <span>{{ actionLabel }}</span>

        <span class="notice-card__action-arrow" aria-hidden="true"> › </span>
      </span>
    </BaseButton>
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.notice-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;

  width: 100%;
  padding: $spacing-2;

  border-radius: $radius-card;

  &--answer-required {
    background-color: rgba($color-warning, 0.18);
  }

  &--all-answered {
    background-color: rgba($color-success, 0.12);
  }

  &--waiting {
    border: 1px solid $color-neutral-200;
    background-color: $color-surface;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: $spacing-1;
  }

  &__status-icon {
    width: 28px;
    height: 28px;

    flex-shrink: 0;
  }

  &--answer-required &__status-icon {
    color: $color-warning;
  }

  &--all-answered &__status-icon {
    color: $color-success;
  }

  &--waiting &__status-icon {
    color: $color-primary;
  }

  &__title {
    margin: 0;

    color: $color-text;
    font-size: $font-size-card-title;
    font-weight: $font-weight-bold;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__schedule-name {
    margin: 0;

    color: $color-text;
    font-size: $font-size-body;
    font-weight: $font-weight-semibold;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;

    margin: 0;

    color: $color-neutral-600;
    font-size: $font-size-caption;

    &--success {
      color: $color-neutral-600;
    }
  }

  &__meta-icon {
    width: 18px;
    height: 18px;

    flex-shrink: 0;
  }

  &__action {
    margin-top: 4px;
  }

  &__action-content {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
  }

  &__action-arrow {
    position: absolute;
    right: 2px;

    font-size: 26px;
    font-weight: $font-weight-semibold;
    line-height: 1;
  }
}
</style>
