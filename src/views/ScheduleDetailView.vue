<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import BottomNavigation from '@/components/common/BottomNavigation.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ResponseStatus from '@/components/schedule/ResponseStatus.vue'
import { useScheduleStore } from '@/stores/schedule'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()

const scheduleId = computed(() => String(route.params.id))

const schedule = computed(() => scheduleStore.getScheduleById(scheduleId.value))

const currentResponse = computed(() => scheduleStore.getCurrentUserResponse(scheduleId.value))

const isInitialLoading = computed(
  () =>
    scheduleStore.scheduleDataStatus === 'idle' ||
    (scheduleStore.scheduleDataStatus === 'loading' && !schedule.value),
)

const hasInitialError = computed(
  () => scheduleStore.scheduleDataStatus === 'error' && !schedule.value,
)

const retryScheduleData = async () => {
  const authSuccess = await scheduleStore.initializeAuth()
  if (!authSuccess) return
  await scheduleStore.fetchScheduleData()
}

const parseDateParts = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return null

  return { year, month, day }
}

const crossesYear = computed(() => {
  if (!schedule.value) return false

  const start = parseDateParts(schedule.value.startDate)
  const end = parseDateParts(schedule.value.endDate)

  return Boolean(start && end && start.year !== end.year)
})

const formatScheduleDate = (value: string) => {
  const parts = parseDateParts(value)

  if (!parts) return value

  const month = String(parts.month).padStart(2, '0')
  const day = String(parts.day).padStart(2, '0')

  return crossesYear.value ? `${parts.year}/${month}/${day}` : `${month}/${day}`
}

const formattedAvailableDates = computed(
  () => currentResponse.value?.availableDates.map(formatScheduleDate) ?? [],
)

const isDepartureMode = computed(
  () =>
    currentResponse.value?.transportMode === 'walking' ||
    currentResponse.value?.transportMode === 'driving',
)

const transportLabel = computed(() => {
  switch (currentResponse.value?.transportMode) {
    case 'walking':
      return '徒歩'
    case 'driving':
      return '車'
    case 'transit':
      return '電車'
    default:
      return '条件なし'
  }
})

const transportIcon = computed(() => {
  switch (currentResponse.value?.transportMode) {
    case 'walking':
      return 'walking' as const
    case 'driving':
      return 'car' as const
    case 'transit':
      return 'train' as const
    default:
      return 'no-condition' as const
  }
})

const transportSummary = computed(() => {
  const response = currentResponse.value

  if (!isDepartureMode.value || !response || response.travelTime === null) {
    return transportLabel.value
  }

  return `${transportLabel.value} で ${response.travelTime}分以内`
})

const formattedPeriod = computed(() => {
  if (!schedule.value) return ''

  return `${formatScheduleDate(schedule.value.startDate)} 〜 ${formatScheduleDate(schedule.value.endDate)}`
})

const responseProgressMessage = computed(() => {
  if (!schedule.value) return ''

  if (schedule.value.responses.length === 0) return 'まだ回答がありません'

  if (
    schedule.value.members.length > 0 &&
    schedule.value.responses.length === schedule.value.members.length
  ) {
    return 'みんなの回答がそろいました'
  }

  return ''
})

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
      <LoadingState v-if="isInitialLoading" label="予定を読み込んでいます" />

      <div v-else-if="hasInitialError" role="alert">
        <EmptyState
          title="予定を読み込めませんでした"
          :description="scheduleStore.scheduleDataError ?? 'もう一度お試しください。'"
          action-label="再試行"
          @action="retryScheduleData"
        />
      </div>

      <template v-else-if="schedule">
        <!-- 予定Hero -->
        <header class="schedule-detail__header">
          <p class="schedule-detail__eyebrow">予定詳細</p>

          <h1 class="schedule-detail__title">
            {{ schedule.title }}
          </h1>

          <div class="schedule-detail__hero-meta">
            <div class="schedule-detail__hero-meta-item">
              <AppIcon name="calendar" :size="19" />
              <span class="schedule-detail__hero-meta-label">日程</span>
              <strong>{{ formattedPeriod }}</strong>
            </div>

            <div class="schedule-detail__hero-meta-item">
              <AppIcon
                :name="schedule.transportPolicy === 'transit' ? 'train' : 'route'"
                :size="19"
              />
              <span class="schedule-detail__hero-meta-label">移動手段</span>
              <strong>{{ schedule.transportPolicy === 'transit' ? '電車' : '各自で選択' }}</strong>
            </div>
          </div>
        </header>

        <!-- 回答状況 -->
        <section class="schedule-detail__section">
          <div class="schedule-detail__section-header">
            <h2>回答状況</h2>

            <span
              class="schedule-detail__response-count"
              :aria-label="`${schedule.members.length}人中${schedule.responses.length}人が回答済み`"
            >
              <strong>{{ schedule.responses.length }}</strong>
              <span>/</span>
              <span>{{ schedule.members.length }}人</span>
              <small>回答済み</small>
            </span>
          </div>

          <div class="schedule-detail__members">
            <ResponseStatus
              v-for="member in sortedMembers"
              :key="member.id"
              :name="member.name"
              :answered="schedule.responses.some((response) => response.userId === member.id)"
              :is-current-user="member.id === scheduleStore.currentUserId"
            />
          </div>
        </section>

        <!-- 集計結果 -->
        <section class="schedule-detail__result-action">
          <p v-if="responseProgressMessage" class="schedule-detail__progress-message">
            <AppIcon
              :name="schedule.responses.length === 0 ? 'clock' : 'check-circle'"
              :size="19"
            />
            {{ responseProgressMessage }}
          </p>

          <BaseButton @click="goResult">
            <span class="schedule-detail__button-content">
              <AppIcon name="chart-bar" :size="20" />
              集計結果を見る
            </span>
          </BaseButton>
        </section>

        <!-- あなたの回答 -->
        <section class="schedule-detail__section">
          <h2 class="schedule-detail__answer-heading">あなたの回答</h2>

          <div v-if="currentResponse" class="schedule-detail__answer">
            <!-- いつ？ -->
            <div class="schedule-detail__answer-row schedule-detail__answer-row--date">
              <AppIcon class="schedule-detail__answer-icon" name="calendar" :size="21" />

              <div class="schedule-detail__answer-content">
                <span class="schedule-detail__answer-label">いつ？</span>
                <div class="schedule-detail__answer-values">
                  <span v-for="date in formattedAvailableDates" :key="date">{{ date }}</span>
                </div>
              </div>
            </div>

            <!-- なにする？ -->
            <div class="schedule-detail__answer-row schedule-detail__answer-row--activity">
              <AppIcon class="schedule-detail__answer-icon" name="sparkles" :size="21" />

              <div class="schedule-detail__answer-content">
                <span class="schedule-detail__answer-label">なにする？</span>
                <div class="schedule-detail__answer-values">
                  <span v-for="activity in currentResponse.activities" :key="activity">
                    {{ activity }}
                  </span>
                </div>
              </div>
            </div>

            <!-- どこ？ -->
            <div
              v-if="currentResponse.preferredAreas?.length"
              class="schedule-detail__answer-row schedule-detail__answer-row--area"
            >
              <AppIcon class="schedule-detail__answer-icon" name="place-vote" :size="21" />

              <div class="schedule-detail__answer-content">
                <span class="schedule-detail__answer-label">どこ？</span>
                <div class="schedule-detail__answer-chips">
                  <span
                    v-for="(area, index) in currentResponse.preferredAreas"
                    :key="`${area}-${index}`"
                    class="schedule-detail__answer-chip"
                  >
                    {{ area }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 移動 -->
            <div
              v-if="schedule.transportPolicy === 'flexible'"
              class="schedule-detail__answer-row schedule-detail__answer-row--transport"
            >
              <AppIcon class="schedule-detail__answer-icon" :name="transportIcon" :size="21" />

              <div class="schedule-detail__answer-content">
                <span class="schedule-detail__answer-label">移動</span>

                <div class="schedule-detail__answer-values">
                  <span>{{ transportSummary }}</span>
                </div>

                <div
                  v-if="isDepartureMode && currentResponse.departure.trim()"
                  class="schedule-detail__answer-departure"
                >
                  <span class="schedule-detail__answer-detail-label">出発地点</span>
                  <span>{{ currentResponse.departure }}</span>
                </div>
              </div>
            </div>
          </div>

          <p v-else class="schedule-detail__no-answer">まだ回答していません。</p>

          <BaseButton :variant="currentResponse ? 'secondary' : 'primary'" @click="goEditAnswer">
            {{ currentResponse ? '回答を変更' : '回答する' }}
          </BaseButton>
        </section>

        <!-- 招待 -->
        <section class="schedule-detail__invite">
          <BaseButton variant="secondary" @click="goInvite">
            <span class="schedule-detail__button-content">
              <AppIcon name="user-plus" :size="21" />
              友達を招待
            </span>
          </BaseButton>
        </section>
      </template>

      <p v-else-if="scheduleStore.scheduleDataStatus === 'success'">予定が見つかりません。</p>
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
    width: 100%;
    max-width: 720px;
    margin-inline: auto;
    flex: 1;
    padding-top: $spacing-3;
  }

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-1;
    padding: $spacing-3 $spacing-2;
    border: 1px solid $color-neutral-200;
    border-radius: $radius-card;
    background: $color-surface;
    text-align: center;
  }

  &__eyebrow {
    margin: 0;
    color: $color-neutral-600;
    font-size: $font-size-caption;
    font-weight: $font-weight-semibold;
  }

  &__title {
    max-width: 100%;
    margin: 0;
    color: $color-primary-dark;
    font-size: $font-size-page-title;
    font-weight: $font-weight-bold;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  &__hero-meta {
    display: grid;
    width: 100%;
    gap: $spacing-1;
    margin-top: $spacing-1;
  }

  &__hero-meta-item {
    display: grid;
    grid-template-columns: 22px minmax(72px, auto) minmax(0, 1fr);
    align-items: center;
    gap: $spacing-1;
    padding: 10px $spacing-2;
    border-radius: $radius-button;
    background: $color-neutral-100;
    color: $color-primary-dark;
    text-align: left;

    strong {
      min-width: 0;
      color: $color-text;
      font-size: $font-size-body;
      overflow-wrap: anywhere;
    }
  }

  &__hero-meta-label {
    color: $color-neutral-600;
    font-size: $font-size-caption;
    font-weight: $font-weight-semibold;
  }

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
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    color: $color-neutral-600;
    font-size: $font-size-caption;

    strong {
      color: $color-primary-dark;
      font-size: $font-size-section-title;
    }

    small {
      margin-left: 2px;
      font-size: $font-size-caption;
    }
  }

  &__members {
    overflow-y: auto;
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

  &__result-action {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
    margin-top: $spacing-2;
  }

  &__progress-message {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin: 0;
    color: $color-primary-dark;
    font-size: $font-size-caption;
    font-weight: $font-weight-semibold;
  }

  &__button-content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-1;
  }

  &__answer-heading {
    margin-bottom: $spacing-2;
  }

  &__answer {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
    margin-bottom: $spacing-2;
    padding: $spacing-1;
    border: 1px solid $color-neutral-200;
    border-radius: $radius-card;
    background-color: $color-surface;
  }

  &__answer-row {
    display: flex;
    align-items: flex-start;
    gap: $spacing-1;
    margin: 0;
    padding: 12px;
    border-radius: $radius-button;
    color: $color-text;
    line-height: 1.55;

    &--date {
      background: $color-accent-blue-light;
      color: $color-accent-blue-dark;
    }

    &--activity {
      background: $color-accent-green-light;
      color: $color-accent-green-dark;
    }

    &--area {
      background: $color-accent-pink-light;
      color: $color-accent-pink-dark;
    }

    &--transport {
      background: $color-accent-yellow-light;
      color: $color-accent-yellow-dark;
    }
  }

  &__answer-content {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 4px;

    > span:not(.schedule-detail__answer-label),
    > strong {
      color: $color-text;
      overflow-wrap: anywhere;
    }
  }

  &__answer-label {
    color: currentColor;
    font-size: $font-size-caption;
    font-weight: $font-weight-semibold;
  }

  &__answer-departure {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;

    > span:last-child {
      color: $color-text;
      overflow-wrap: anywhere;
    }
  }

  &__answer-detail-label {
    color: $color-neutral-600;
    font-size: $font-size-caption;
    font-weight: $font-weight-regular;
  }

  &__answer-values,
  &__answer-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__answer-values span,
  &__answer-chip {
    padding: 4px 10px;
    border-radius: $radius-chip;
    background: rgba($color-neutral-0, 0.72);
    color: $color-text;
    font-size: $font-size-caption;
    overflow-wrap: anywhere;
  }

  &__answer-icon {
    width: 21px;
    height: 21px;
    margin-top: 1px;
    flex-shrink: 0;
    color: currentColor;
  }

  &__no-answer {
    margin: 0 0 $spacing-2;

    color: $color-neutral-600;
  }

  &__invite {
    margin-top: $spacing-4;
  }
}

@media (min-width: 600px) {
  .schedule-detail__hero-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
