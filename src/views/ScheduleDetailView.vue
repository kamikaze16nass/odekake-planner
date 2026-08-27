<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import BottomNavigation from '@/components/common/BottomNavigation.vue'
import ResponseStatus from '@/components/schedule/ResponseStatus.vue'
import { useScheduleStore } from '@/stores/schedule'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()

const scheduleId = computed(() => String(route.params.id))

const schedule = computed(() => scheduleStore.getScheduleById(scheduleId.value))

const currentResponse = computed(() => scheduleStore.getCurrentUserResponse(scheduleId.value))

const formatPeriod = (startDate: string, endDate: string) => {
  const format = (value: string) => {
    const [, month, day] = value.split('-').map(Number)

    return `${month}/${day}`
  }

  return `${format(startDate)}〜${format(endDate)}`
}

const goEditAnswer = () => {
  router.push({
    name: 'condition-input',
    params: { id: scheduleId.value },
  })
}

const goResult = () => {
  router.push({
    name: 'result',
    params: { id: scheduleId.value },
  })
}

const goInvite = () => {
  router.push({
    name: 'invite',
    params: { id: scheduleId.value },
  })
}

const sortedMembers = computed(() => {
  if (!schedule.value) return []

  const answeredUserIds = new Set(schedule.value.responses.map((response) => response.userId))

  return [...schedule.value.members].sort((a, b) => {
    const aAnswered = answeredUserIds.has(a.id)
    const bAnswered = answeredUserIds.has(b.id)

    // ① 未回答を先にする
    if (aAnswered !== bAnswered) {
      return aAnswered ? 1 : -1
    }

    // ② 同じ回答状態なら、自分を先頭にする
    const aIsCurrentUser = a.id === scheduleStore.currentUserId
    const bIsCurrentUser = b.id === scheduleStore.currentUserId

    if (aIsCurrentUser !== bIsCurrentUser) {
      return aIsCurrentUser ? -1 : 1
    }

    // ③ それ以外は元の members の順番を維持
    return 0
  })
})
</script>

<template>
  <div class="schedule-detail">
    <main class="page page--with-bottom-nav schedule-detail__content">
      <template v-if="schedule">
        <!-- 予定情報 -->
        <header class="schedule-detail__header">
          <h1 class="schedule-detail__title">
            {{ schedule.title }}
          </h1>

          <p class="schedule-detail__period">
            期間：
            {{ formatPeriod(schedule.startDate, schedule.endDate) }}
          </p>
        </header>

        <!-- 回答状況 -->
        <section class="schedule-detail__section">
          <div class="schedule-detail__section-header">
            <h2>回答状況</h2>

            <span class="schedule-detail__response-count">
              {{ schedule.members.length }}人中 {{ schedule.responses.length }}人が回答済み
            </span>
          </div>

          <div class="schedule-detail__members">
            <ResponseStatus
              v-for="member in sortedMembers"
              :key="member.id"
              :name="member.name"
              :answered="schedule.responses.some((response) => response.userId === member.id)"
            />
          </div>
        </section>

        <!-- あなたの回答 -->
        <section class="schedule-detail__section">
          <h2 class="schedule-detail__answer-heading">あなたの回答</h2>

          <div v-if="currentResponse" class="schedule-detail__answer">
            <!-- 日程 -->
            <p class="schedule-detail__answer-row">
              <svg class="schedule-detail__answer-icon" viewBox="0 0 24 24" aria-hidden="true">
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

              <span>
                {{ currentResponse.availableDates.join('、') }}
              </span>
            </p>

            <!-- やりたいこと -->
            <p class="schedule-detail__answer-row">
              <svg class="schedule-detail__answer-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />

                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2" />
              </svg>

              <span>
                {{ currentResponse.activities.join('、') }}
              </span>
            </p>

            <!-- 出発地点＋移動時間 -->
            <p class="schedule-detail__answer-row">
              <svg class="schedule-detail__answer-icon" viewBox="0 0 24 24" aria-hidden="true">
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

              <span>
                {{ currentResponse.departure }}
                から
                {{ currentResponse.travelTime }}
              </span>
            </p>

            <!-- 希望エリア -->
            <p v-if="currentResponse.preferredArea" class="schedule-detail__answer-row">
              <svg class="schedule-detail__answer-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 6L9 4L15 6L20 4V18L15 20L9 18L4 20V6Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />

                <path d="M9 4V18 M15 6V20" fill="none" stroke="currentColor" stroke-width="2" />
              </svg>

              <span>
                {{ currentResponse.preferredArea }}
              </span>
            </p>
          </div>

          <p v-else class="schedule-detail__no-answer">まだ回答していません。</p>

          <BaseButton :variant="currentResponse ? 'secondary' : 'primary'" @click="goEditAnswer">
            {{ currentResponse ? '回答を変更' : '回答する' }}
          </BaseButton>
        </section>

        <!-- アクション -->
        <section class="schedule-detail__actions">
          <BaseButton @click="goResult"> 集計結果を見る </BaseButton>

          <div class="schedule-detail__invite-heading">予定に友達を追加する！</div>

          <BaseButton variant="secondary" @click="goInvite">
            <span class="schedule-detail__invite-button">
              <svg class="schedule-detail__invite-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2" />

                <path
                  d="
                    M3 19
                    C3 15.7 5.7 13 9 13
                    C11.4 13 13.5 14.4 14.4 16.5
                  "
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />

                <path
                  d="M18 11V19 M14 15H22"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>

              <span>友達を招待</span>
            </span>
          </BaseButton>
        </section>
      </template>

      <p v-else>予定が見つかりません。</p>
    </main>

    <BottomNavigation />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.schedule-detail {
  display: flex;
  flex-direction: column;

  min-height: 100dvh;

  &__content {
    flex: 1;
    padding-top: $spacing-3;
  }

  // ========================================
  // 予定情報
  // ========================================

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    text-align: center;
  }

  &__title {
    margin: 0;

    color: $color-primary-dark;
    font-size: $font-size-page-title;
    font-weight: $font-weight-bold;
    line-height: 1.35;
  }

  &__period {
    margin: 0;

    color: $color-text;
    font-size: $font-size-body;
  }

  // ========================================
  // セクション
  // ========================================

  &__section {
    margin-top: $spacing-4;

    h2 {
      margin: 0 0 $spacing-2;

      font-size: $font-size-section-title;
    }
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-2;

    margin-bottom: $spacing-2;

    h2 {
      margin: 0;
    }
  }

  &__response-count {
    color: $color-neutral-600;
    font-size: $font-size-caption;
  }

  // ========================================
  // 回答状況
  // ========================================

  &__members {
    overflow-y: auto;

    // 約4人分＋5人目が少し見える高さ
    max-height: 190px;
    padding: $spacing-1 $spacing-2;

    border: 1px solid $color-neutral-300;
    border-radius: $radius-card;
    background-color: $color-surface;

    scrollbar-width: thin;
    scrollbar-color: $color-primary $color-neutral-300;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      border-radius: 999px;
      background: $color-neutral-300;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: $color-primary;
    }
  }

  // ========================================
  // あなたの回答
  // ========================================

  &__answer-heading {
    margin-bottom: $spacing-2;
  }

  &__answer {
    display: flex;
    flex-direction: column;
    gap: 12px;

    margin-bottom: $spacing-2;
    padding: $spacing-2;

    border-radius: $radius-card;
    background-color: $color-primary-light;
  }

  &__answer-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    margin: 0;

    color: $color-text;
    line-height: 1.55;
  }

  &__answer-icon {
    width: 21px;
    height: 21px;
    margin-top: 1px;

    flex-shrink: 0;

    color: $color-primary;
  }

  &__no-answer {
    margin: 0 0 $spacing-2;

    color: $color-neutral-600;
  }

  // ========================================
  // 下部アクション
  // ========================================

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;

    margin-top: $spacing-4;
  }

  &__invite-heading {
    margin-top: $spacing-1;

    color: $color-text;
    font-size: $font-size-section-title;
    font-weight: $font-weight-bold;
    text-align: center;
  }

  &__invite-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  &__invite-icon {
    width: 22px;
    height: 22px;

    flex-shrink: 0;
  }
}
</style>
