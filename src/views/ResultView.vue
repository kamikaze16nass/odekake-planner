<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import BottomNavigation from '@/components/common/BottomNavigation.vue'
import { useScheduleStore } from '@/stores/schedule'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()

const scheduleId = computed(() => String(route.params.id))
const schedule = computed(() => scheduleStore.getScheduleById(scheduleId.value))
const result = computed(() => scheduleStore.getResultByScheduleId(scheduleId.value))

const answeredCount = computed(() => schedule.value?.responses.length ?? 0)

function takeGroupsUntilTarget<T extends { count: number }>(items: T[], targetCount = 3): T[] {
  if (items.length === 0 || targetCount <= 0) return []

  const selectedItems: T[] = []
  let groupStart = 0

  while (groupStart < items.length) {
    const groupCount = items[groupStart]?.count

    if (groupCount === undefined) break

    let groupEnd = groupStart + 1

    while (groupEnd < items.length && items[groupEnd]?.count === groupCount) {
      groupEnd += 1
    }

    selectedItems.push(...items.slice(groupStart, groupEnd))

    if (selectedItems.length >= targetCount) break

    groupStart = groupEnd
  }

  return selectedItems
}

const visibleDates = computed(() => takeGroupsUntilTarget(result.value?.dates ?? []))

const visibleActivities = computed(() => takeGroupsUntilTarget(result.value?.activities ?? []))

const visibleAreas = computed(() => takeGroupsUntilTarget(result.value?.areas ?? []))

const peoplePercentage = (count: number) => {
  if (!answeredCount.value) return '0%'
  return `${Math.min(100, (count / answeredCount.value) * 100)}%`
}

const maxAreaVotes = computed(() => result.value?.areas[0]?.count ?? 0)

const votePercentage = (count: number) => {
  if (!maxAreaVotes.value) return '0%'
  return `${Math.min(100, (count / maxAreaVotes.value) * 100)}%`
}

const formatDate = (date: string) => {
  if (date === '未集計') return date

  const parts = date.split('-')
  if (parts.length !== 3) return date

  const [year, month, day] = parts.map(Number)
  if (!year || !month || !day) return date

  return `${year}/${month}/${day}`
}

const summaryDateCount = computed(() => {
  if (!result.value) return 0

  return (
    result.value.dates.find(
      (item) => item.label === result.value?.summary.date,
    )?.count ?? 0
  )
})

const summaryActivityCount = computed(() => {
  if (!result.value) return 0

  return (
    result.value.activities.find(
      (item) => item.label === result.value?.summary.activity,
    )?.count ?? 0
  )
})

const summaryAreaVoteCount = computed(() => {
  if (!result.value) return 0

  return (
    result.value.areas.find(
      (item) => item.label === result.value?.summary.area,
    )?.count ?? 0
  )
})

const summaryDateMessage = computed(() => {
  if (!answeredCount.value) return 'まだ回答なし'

  if (summaryDateCount.value === answeredCount.value) {
    return '全員が参加可能'
  }

  return `${summaryDateCount.value}人が参加可能`
})

const countOtherTopItems = (items: { count: number }[]) => {
  const topCount = items[0]?.count

  if (topCount === undefined) return 0

  return Math.max(0, items.filter((item) => item.count === topCount).length - 1)
}

const otherTopDatesCount = computed(() => countOtherTopItems(result.value?.dates ?? []))

const otherTopActivitiesCount = computed(() =>
  countOtherTopItems(result.value?.activities ?? []),
)

const otherTopAreasCount = computed(() => countOtherTopItems(result.value?.areas ?? []))

const goDetail = () => {
  router.push({
    name: 'schedule-detail',
    params: { id: scheduleId.value },
  })
}

const isAllAnswered = computed(() => {
  if (!schedule.value) return false

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
              <span class="result-view__complete-label">
                <AppIcon name="check-circle" :size="18" />
                全員回答済み
              </span>
            </template>
            <template v-else>
              {{ schedule.members.length }}人中 {{ answeredCount }}人が回答済み
            </template>
          </p>
        </header>

        <section class="result-view__summary">
          <h2>いま一番まとまっている希望</h2>

          <div class="result-view__summary-grid">
            <article class="result-view__summary-tile result-view__summary-tile--date">
              <AppIcon class="result-view__summary-icon" name="calendar" />

              <div class="result-view__summary-content">
                <strong>{{ formatDate(result.summary.date) }}</strong>
                <small class="result-view__summary-chip">
                  {{ answeredCount }}人中{{ summaryDateCount }}人
                </small>
                <small class="result-view__summary-description">{{ summaryDateMessage }}</small>
                <small v-if="otherTopDatesCount" class="result-view__summary-tie">
                  ほか{{ otherTopDatesCount }}日も同率
                </small>
              </div>
            </article>

            <article class="result-view__summary-tile result-view__summary-tile--activity">
              <AppIcon class="result-view__summary-icon" name="sparkles" />

              <div class="result-view__summary-content">
                <strong>{{ result.summary.activity }}</strong>
                <small class="result-view__summary-chip">
                  {{ answeredCount }}人中{{ summaryActivityCount }}人
                </small>
                <small class="result-view__summary-description">
                  <template v-if="answeredCount">
                    {{ summaryActivityCount }}人の希望に一致
                  </template>
                  <template v-else>まだ回答なし</template>
                </small>
                <small v-if="otherTopActivitiesCount" class="result-view__summary-tie">
                  ほか{{ otherTopActivitiesCount }}件も同率
                </small>
              </div>
            </article>

            <article class="result-view__summary-tile result-view__summary-tile--area">
              <AppIcon class="result-view__summary-icon" name="place-vote" />

              <div class="result-view__summary-content">
                <strong>{{ result.summary.area }}</strong>
                <small v-if="summaryAreaVoteCount" class="result-view__summary-chip">
                  {{ summaryAreaVoteCount }}票
                </small>
                <small v-else>まだ投票なし</small>
                <small v-if="summaryAreaVoteCount" class="result-view__summary-description">
                  もっとも希望が多い
                </small>
                <small v-if="otherTopAreasCount" class="result-view__summary-tie">
                  ほか{{ otherTopAreasCount }}件も同率
                </small>
              </div>
            </article>
          </div>

          <small v-if="!isAllAnswered" class="result-view__summary-note">
            ※現在回答済みの{{ answeredCount }}名から集計しています
          </small>
        </section>

        <section class="result-view__details">
          <h2>詳しい集計</h2>

          <div class="result-view__group">
            <h3 class="result-view__group-title">
              <AppIcon class="result-view__group-icon--date" name="calendar" :size="22" />
              いつ遊べる？
            </h3>

            <div
              v-for="item in visibleDates"
              :key="item.label"
              class="result-view__row"
            >
              <span class="result-view__row-label">
                {{ formatDate(item.label) }}
              </span>

              <div class="result-view__bar">
                <div
                  class="result-view__bar-value result-view__bar-value--date"
                  :style="{ width: peoplePercentage(item.count) }"
                />
              </div>

              <strong>{{ item.count }}人</strong>
            </div>
          </div>

          <div class="result-view__group">
            <h3 class="result-view__group-title">
              <AppIcon class="result-view__group-icon--activity" name="sparkles" :size="22" />
              なにする？
            </h3>

            <div
              v-for="item in visibleActivities"
              :key="item.label"
              class="result-view__row"
            >
              <span class="result-view__row-label">
                {{ item.label }}
              </span>

              <div class="result-view__bar">
                <div
                  class="result-view__bar-value result-view__bar-value--activity"
                  :style="{ width: peoplePercentage(item.count) }"
                />
              </div>

              <strong>{{ item.count }}人</strong>
            </div>
          </div>

          <div class="result-view__group result-view__group--votes">
            <div class="result-view__group-heading">
              <h3 class="result-view__group-title">
                <AppIcon class="result-view__group-icon--area" name="place-vote" :size="22" />
                行きたい場所・ジャンル
              </h3>
              <span>1枠 = 1票</span>
            </div>

            <p class="result-view__vote-description">
              同じ候補への重ね投票も、そのまま「行きたい！」の強さとして集計しています。
            </p>

            <div v-if="visibleAreas.length" class="result-view__vote-list">
              <article
                v-for="(item, index) in visibleAreas"
                :key="item.label"
                class="result-view__vote-item"
                :class="`result-view__vote-item--${index % 5}`"
              >
                <div class="result-view__vote-main">
                  <div class="result-view__vote-title">
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.count }}票</span>
                  </div>

                  <div class="result-view__bar result-view__bar--vote">
                    <div
                      class="result-view__bar-value result-view__bar-value--vote"
                      :style="{ width: votePercentage(item.count) }"
                    />
                  </div>
                </div>
              </article>
            </div>

            <p v-else class="result-view__empty">
              まだ「行きたい！」票はありません。
            </p>
          </div>

          <div class="result-view__group">
            <h3 class="result-view__group-title">
              <AppIcon class="result-view__group-icon--transport" name="route" :size="22" />
              移動方法
            </h3>

            <div
              v-for="item in result.transportModes"
              :key="item.label"
              class="result-view__row"
            >
              <span class="result-view__row-label">
                {{ item.label }}
              </span>

              <div class="result-view__bar">
                <div
                  class="result-view__bar-value result-view__bar-value--transport"
                  :style="{ width: peoplePercentage(item.count) }"
                />
              </div>

              <strong>{{ item.count }}人</strong>
            </div>
          </div>

          <div
            v-if="result.walkingTravelTimes.length"
            class="result-view__group"
          >
            <h3 class="result-view__group-title">
              <AppIcon class="result-view__group-icon--walking" name="walking" :size="22" />
              徒歩でどこまで？
            </h3>

            <div
              v-for="item in result.walkingTravelTimes"
              :key="item.label"
              class="result-view__row"
            >
              <span class="result-view__row-label">
                {{ item.label }}
              </span>

              <div class="result-view__bar">
                <div
                  class="result-view__bar-value result-view__bar-value--walking"
                  :style="{ width: peoplePercentage(item.count) }"
                />
              </div>

              <strong>{{ item.count }}人</strong>
            </div>
          </div>

          <div
            v-if="result.drivingTravelTimes.length"
            class="result-view__group"
          >
            <h3 class="result-view__group-title">
              <AppIcon class="result-view__group-icon--driving" name="car" :size="22" />
              車でどこまで？
            </h3>

            <div
              v-for="item in result.drivingTravelTimes"
              :key="item.label"
              class="result-view__row"
            >
              <span class="result-view__row-label">
                {{ item.label }}
              </span>

              <div class="result-view__bar">
                <div
                  class="result-view__bar-value result-view__bar-value--driving"
                  :style="{ width: peoplePercentage(item.count) }"
                />
              </div>

              <strong>{{ item.count }}人</strong>
            </div>
          </div>
        </section>

        <BaseButton variant="secondary" @click="goDetail">
          予定詳細へ戻る
        </BaseButton>
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

  &__header {
    text-align: center;
  }

  &__title {
    margin: 0;
    color: $color-primary-dark;
    font-size: $font-size-page-title;
    font-weight: $font-weight-bold;
  }

  &__schedule-name {
    margin: $spacing-1 0 0;
    color: $color-text;
    font-size: $font-size-card-title;
    font-weight: $font-weight-semibold;
  }

  &__answered-count {
    margin: 4px 0 0;
    color: $color-neutral-600;
    font-size: $font-size-caption;

    &--complete {
      color: $color-primary;
      font-weight: $font-weight-semibold;
    }
  }

  &__complete-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__summary {
    margin-top: $spacing-4;

    > h2 {
      margin: 0 0 $spacing-2;
      font-size: $font-size-section-title;
    }
  }

  &__summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $spacing-1;

    @media (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  }

  &__summary-tile {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: $spacing-2;
    border-radius: $radius-card;

    strong {
      overflow: hidden;
      color: $color-text;
      font-size: $font-size-card-title;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    small {
      color: $color-neutral-600;
    }

    &--date {
      border: 1px solid $color-accent-blue-dark;
      background: #eaf6ff;
    }

    &--activity {
      border: 1px solid $color-primary-dark;
      background: $color-primary-light;
    }

    &--area {
      border: 1px solid $color-accent-pink-dark;
      background: #ffeaf1;
    }
  }

  &__summary-icon {
    .result-view__summary-tile--date & {
      color: $color-accent-blue-dark;
    }

    .result-view__summary-tile--activity & {
      color: $color-primary-dark;
    }

    .result-view__summary-tile--area & {
      color: $color-accent-pink-dark;
    }
  }

  &__summary-content {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }

  &__summary-chip {
    align-self: flex-start;
    padding: 3px 8px;
    border-radius: $radius-chip;
    background: rgba(255, 255, 255, 0.75);
    color: $color-text !important;
    font-weight: $font-weight-semibold;
  }

  &__summary-description {
    line-height: 1.35;
  }

  &__summary-tie {
    font-size: 11px;
    line-height: 1.3;
  }

  &__summary-note {
    display: block;
    margin-top: $spacing-1;
    color: $color-neutral-600;
  }

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

    &--votes {
      padding: $spacing-2;
      border: 0 !important;
      border-radius: $radius-card;
      background: linear-gradient(135deg, #fff8fb, #f7fbff);
    }
  }

  &__group-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-1;

    > span {
      color: $color-neutral-600;
      font-size: $font-size-caption;
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

  &__group-heading &__group-title {
    margin-bottom: 0;
  }

  &__group-icon {
    &--date {
      color: $color-accent-blue-dark;
    }

    &--activity {
      color: $color-primary-dark;
    }

    &--area {
      color: $color-accent-pink-dark;
    }

    &--transport {
      color: #8a64b1;
    }

    &--walking,
    &--driving {
      color: $color-accent-yellow-dark;
    }
  }

  &__vote-description {
    margin: $spacing-1 0 $spacing-2;
    color: $color-neutral-600;
    font-size: $font-size-caption;
  }

  &__row {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr) 60px;
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

    &--vote {
      height: 10px;
      background: rgba(255, 255, 255, 0.75);
    }
  }

  &__bar-value {
    height: 100%;
    border-radius: inherit;
    background: $color-primary;

    &--date {
      background: #6db7e8;
    }

    &--activity {
      background: $color-primary;
    }

    &--transport {
      background: #9d7ad1;
    }

    &--walking,
    &--driving {
      background: $color-accent-yellow;
    }

    &--vote {
      background: currentColor;
    }
  }

  &__vote-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  &__vote-item {
    padding: 10px 12px;
    border-radius: $radius-input;

    &--0 {
      background: #ffe5ee;
      color: #c75d83;
    }

    &--1 {
      background: #e5f6ec;
      color: #4c9870;
    }

    &--2 {
      background: #e7f0ff;
      color: #5a83bf;
    }

    &--3 {
      background: #f2e7ff;
      color: #8a64b1;
    }

    &--4 {
      background: #fff1cc;
      color: #a57d28;
    }
  }

  &__vote-main {
    min-width: 0;
  }

  &__vote-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-1;
    margin-bottom: 6px;

    strong {
      overflow: hidden;
      color: $color-text;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      flex-shrink: 0;
      font-size: $font-size-caption;
      font-weight: $font-weight-semibold;
    }
  }

  &__empty {
    margin: 0;
    padding: $spacing-2;
    border-radius: $radius-input;
    background: rgba(255, 255, 255, 0.8);
    color: $color-neutral-600;
    font-size: $font-size-caption;
  }
}
</style>
