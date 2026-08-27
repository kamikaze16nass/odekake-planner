<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import BottomNavigation from '@/components/common/BottomNavigation.vue'
import { useScheduleStore } from '@/stores/schedule'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()

const scheduleId = computed(() => String(route.params.id))

const schedule = computed(() => scheduleStore.getScheduleById(scheduleId.value))

const result = computed(() => scheduleStore.getResultByScheduleId(scheduleId.value))

const answeredCount = computed(() => schedule.value?.responses.length ?? 0)

const percentage = (count: number) => {
  if (!answeredCount.value) {
    return '0%'
  }

  return `${(count / answeredCount.value) * 100}%`
}

const formatDate = (date: string) => {
  if (date === '未集計') {
    return date
  }

  const parts = date.split('-')

  if (parts.length !== 3) {
    return date
  }

  const [year, month, day] = parts.map(Number)

  if (!year || !month || !day) {
    return date
  }

  return `${year}/${month}/${day}`
}

const summaryDateCount = computed(() => {
  if (!result.value) {
    return 0
  }

  return result.value.dates.find((item) => item.label === result.value?.summary.date)?.count ?? 0
})

const summaryActivityCount = computed(() => {
  if (!result.value) {
    return 0
  }

  return (
    result.value.activities.find((item) => item.label === result.value?.summary.activity)?.count ??
    0
  )
})

const summaryAreaCount = computed(() => {
  if (!result.value) {
    return 0
  }

  return result.value.areas.find((item) => item.label === result.value?.summary.area)?.count ?? 0
})

const goDetail = () => {
  router.push({
    name: 'schedule-detail',
    params: { id: scheduleId.value },
  })
}

const isAllAnswered = computed(() => {
  if (!schedule.value) {
    return false
  }

  return (
    schedule.value.members.length > 0 &&
    schedule.value.responses.length === schedule.value.members.length
  )
})
</script>

<template>
  <div class="result-view">
    <main class="page page--with-bottom-nav result-view__content">
      <template v-if="schedule && result">
        <!-- ヘッダー -->
        <header class="result-view__header">
          <h1 class="result-view__title">集計結果</h1>

          <p class="result-view__schedule-name">
            {{ schedule.title }}
          </p>

          <p
            class="result-view__answered-count"
            :class="{
              'result-view__answered-count--complete': isAllAnswered,
            }"
          >
            <template v-if="isAllAnswered">
              <svg class="result-view__complete-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 12.5L9.5 17L19 7.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <span>全員回答済み</span>
            </template>

            <template v-else>
              {{ schedule.members.length }}人中 {{ answeredCount }}人が回答済み
            </template>
          </p>
        </header>

        <!-- 最も一致している条件 -->
        <section class="result-view__summary">
          <h2>みんなの希望が最も一致している条件</h2>

          <div class="result-view__summary-card">
            <!-- 日付 -->
            <div class="result-view__summary-row">
              <svg class="result-view__icon" viewBox="0 0 24 24" aria-hidden="true">
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

              <strong>
                {{ formatDate(result.summary.date) }}
              </strong>

              <span> {{ answeredCount }}人中{{ summaryDateCount }}人 </span>
            </div>

            <!-- なにする？ -->
            <div class="result-view__summary-row">
              <svg class="result-view__icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />

                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2" />

                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>

              <strong>
                {{ result.summary.activity }}
              </strong>

              <span> {{ answeredCount }}人中{{ summaryActivityCount }}人 </span>
            </div>

            <!-- どこいく？ -->
            <div class="result-view__summary-row">
              <svg class="result-view__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="
                    M12 21
                    C12 21 19 15.2 19 9.5
                    C19 5.9 15.9 3 12 3
                    C8.1 3 5 5.9 5 9.5
                    C5 15.2 12 21 12 21Z
                  "
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />

                <circle
                  cx="12"
                  cy="9.5"
                  r="2.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                />
              </svg>

              <strong>
                {{ result.summary.area }}
              </strong>

              <span> {{ answeredCount }}人中{{ summaryAreaCount }}人 </span>
            </div>
          </div>

          <small v-if="!isAllAnswered">
            ※現在回答済みの{{ answeredCount }}名から集計しています
          </small>
        </section>

        <!-- 詳しい集計 -->
        <section class="result-view__details">
          <h2>詳しい集計</h2>

          <!-- いつ遊べる？ -->
          <div class="result-view__group">
            <h3 class="result-view__group-title">
              <svg class="result-view__icon" viewBox="0 0 24 24" aria-hidden="true">
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

              <span>いつ遊べる？</span>
            </h3>

            <div v-for="item in result.dates" :key="item.label" class="result-view__row">
              <span class="result-view__row-label">
                {{ formatDate(item.label) }}
              </span>

              <div class="result-view__bar">
                <div
                  class="result-view__bar-value"
                  :style="{
                    width: percentage(item.count),
                  }"
                />
              </div>

              <strong> {{ item.count }}人 </strong>
            </div>
          </div>

          <!-- なにする？ -->
          <div class="result-view__group">
            <h3 class="result-view__group-title">
              <svg class="result-view__icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />

                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2" />

                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>

              <span>なにする？</span>
            </h3>

            <div v-for="item in result.activities" :key="item.label" class="result-view__row">
              <span class="result-view__row-label">
                {{ item.label }}
              </span>

              <div class="result-view__bar">
                <div
                  class="result-view__bar-value"
                  :style="{
                    width: percentage(item.count),
                  }"
                />
              </div>

              <strong> {{ item.count }}人 </strong>
            </div>
          </div>

          <!-- どこいく？ -->
          <div class="result-view__group">
            <h3 class="result-view__group-title">
              <svg class="result-view__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="
                    M12 21
                    C12 21 19 15.2 19 9.5
                    C19 5.9 15.9 3 12 3
                    C8.1 3 5 5.9 5 9.5
                    C5 15.2 12 21 12 21Z
                  "
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />

                <circle
                  cx="12"
                  cy="9.5"
                  r="2.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                />
              </svg>

              <span>どこいく？</span>
            </h3>

            <div v-for="item in result.areas" :key="item.label" class="result-view__row">
              <span class="result-view__row-label">
                {{ item.label }}
              </span>

              <div class="result-view__bar">
                <div
                  class="result-view__bar-value"
                  :style="{
                    width: percentage(item.count),
                  }"
                />
              </div>

              <strong> {{ item.count }}人 </strong>
            </div>
          </div>
        </section>

        <BaseButton variant="secondary" @click="goDetail"> 予定詳細へ戻る </BaseButton>
      </template>

      <p v-else>集計結果が見つかりません。</p>
    </main>

    <BottomNavigation />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.result-view {
  display: flex;
  flex-direction: column;

  min-height: 100dvh;

  &__content {
    flex: 1;
    padding-top: $spacing-3;
  }

  // ========================================
  // ヘッダー
  // ========================================

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;

    text-align: center;
  }

  &__title {
    margin: 0;

    color: $color-primary-dark;
    font-size: $font-size-page-title;
    font-weight: $font-weight-bold;
    line-height: 1.35;
  }

  &__schedule-name {
    margin: $spacing-1 0 0;

    color: $color-text;
    font-size: $font-size-card-title;
    font-weight: $font-weight-semibold;
  }

  &__answered-count {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    margin: 4px 0 0;

    color: $color-neutral-600;
    font-size: $font-size-caption;

    &--complete {
      color: $color-primary;
      font-weight: $font-weight-semibold;
    }
  }

  &__complete-icon {
    width: 18px;
    height: 18px;

    flex-shrink: 0;
  }
  // ========================================
  // アイコン
  // ========================================

  &__icon {
    width: 21px;
    height: 21px;

    flex-shrink: 0;

    color: $color-primary;
  }

  // ========================================
  // 最も一致している条件
  // ========================================

  &__summary {
    margin-top: $spacing-4;

    h2 {
      margin: 0 0 $spacing-2;

      font-size: $font-size-section-title;
      line-height: 1.5;
    }

    small {
      display: block;

      margin-top: $spacing-1;

      color: $color-neutral-600;
    }
  }

  &__summary-card {
    display: flex;
    flex-direction: column;
    gap: 14px;

    padding: $spacing-2;

    border-radius: $radius-card;
    background: $color-primary-light;
  }

  &__summary-row {
    display: grid;
    grid-template-columns:
      24px
      minmax(0, 1fr)
      auto;
    align-items: center;
    gap: 8px;

    strong {
      min-width: 0;

      overflow: hidden;

      color: $color-text;

      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: $color-text;
      font-size: $font-size-caption;
      white-space: nowrap;
    }
  }

  // ========================================
  // 詳しい集計
  // ========================================

  &__details {
    margin-top: $spacing-4;

    > h2 {
      margin: 0 0 $spacing-3;

      font-size: $font-size-section-title;
    }
  }

  &__group {
    padding-bottom: $spacing-3;

    & + & {
      padding-top: $spacing-3;

      border-top: 1px solid $color-neutral-300;
    }
  }

  &__group-title {
    display: flex;
    align-items: center;
    gap: 8px;

    margin: 0 0 $spacing-2;

    color: $color-text;
    font-size: $font-size-card-title;
    font-weight: $font-weight-semibold;
  }

  // ========================================
  // 集計グラフ
  // ========================================

  &__row {
    display: grid;
    grid-template-columns:
      96px
      minmax(0, 1fr)
      82px;
    align-items: center;
    gap: $spacing-1;

    min-height: 38px;

    & + & {
      margin-top: 4px;
    }

    strong {
      color: $color-text;
      font-size: $font-size-caption;
      text-align: right;
      white-space: nowrap;
    }
  }

  &__row-label {
    overflow: hidden;

    color: $color-text;

    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__bar {
    overflow: hidden;

    height: 12px;

    border-radius: $radius-chip;
    background: $color-neutral-100;
  }

  &__bar-value {
    height: 100%;

    border-radius: inherit;
    background: $color-primary;
  }
}
</style>
