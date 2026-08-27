<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'

withDefaults(
  defineProps<{
    title: string
    period: string
    responseStatus: string
    answered?: boolean
    allAnswered?: boolean
  }>(),
  {
    answered: false,
    allAnswered: false,
  },
)

const emit = defineEmits<{
  detail: []
  result: []
  answer: []
}>()
</script>

<template>
  <article class="schedule-card">
    <div class="schedule-card__header">
      <h2 class="schedule-card__title">
        {{ title }}
      </h2>

      <span
        class="schedule-card__badge"
        :class="{
          'schedule-card__badge--answered': answered,
          'schedule-card__badge--unanswered': !answered,
        }"
      >
        {{ answered ? '回答済み' : '未回答' }}
      </span>
    </div>

    <div class="schedule-card__meta">
      <!-- 日付 -->
      <p class="schedule-card__meta-row">
        <svg class="schedule-card__meta-icon" viewBox="0 0 24 24" aria-hidden="true">
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
      <p class="schedule-card__meta-row">
        <!-- 全員回答済み -->
        <svg
          v-if="allAnswered"
          class="schedule-card__meta-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 12.5L9.5 17L19 7.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <!-- まだ未回答者がいる -->
        <svg v-else class="schedule-card__meta-icon" viewBox="0 0 24 24" aria-hidden="true">
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
    </div>

    <div class="schedule-card__actions">
      <template v-if="answered">
        <BaseButton variant="secondary" @click="emit('detail')"> 予定詳細 </BaseButton>

        <BaseButton @click="emit('result')"> 集計結果 </BaseButton>
      </template>

      <BaseButton v-else @click="emit('answer')"> 回答する </BaseButton>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.schedule-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;

  width: 100%;
  padding: $spacing-2;

  border: 1px solid $color-neutral-300;
  border-radius: $radius-card;

  background-color: $color-surface;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-2;
  }

  &__title {
    margin: 0;

    color: $color-primary-dark;
    font-size: $font-size-card-title;
    font-weight: $font-weight-bold;
    line-height: 1.4;
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
      background-color: rgba($color-accent-yellow, 0.18);
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

  &__meta-icon {
    width: 20px;
    height: 20px;

    flex-shrink: 0;

    color: $color-primary;
  }

  &__actions {
    display: flex;
    gap: $spacing-1;

    margin-top: 4px;

    > * {
      flex: 1;
    }
  }
}
</style>
