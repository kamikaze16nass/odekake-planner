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
          <h1 class="result-view__title">
            <AppIcon name="sparkles" :size="20" />
            集計結果
            <AppIcon name="sparkles" :size="20" />
          </h1>

          <div class="result-view__event-card">
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
          </div>
        </header>

        <section class="result-view__summary">
          <h2>
            <AppIcon class="result-view__summary-heading-icon" name="sparkles" :size="18" />
            <span>いま一番まとまっている希望</span>
            <AppIcon class="result-view__summary-heading-icon" name="sparkles" :size="18" />
          </h2>

          <div class="result-view__summary-story">
            <div class="result-view__summary-step result-view__summary-step--date">
              <span class="result-view__summary-step-label">いつ？</span>

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
            </div>

            <div class="result-view__summary-step result-view__summary-step--activity">
              <span class="result-view__summary-step-label">なに<br />する？</span>

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
            </div>

            <div class="result-view__summary-step result-view__summary-step--area">
              <span class="result-view__summary-step-label">どこ？</span>

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
          </div>

          <small v-if="!isAllAnswered" class="result-view__summary-note">
            ※現在回答済みの{{ answeredCount }}名から集計しています
          </small>
        </section>

        <section class="result-view__details">
          <h2>
            <AppIcon class="result-view__details-heading-icon" name="chart-bar" :size="22" />
            <span>詳しい集計</span>
          </h2>

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
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    text-align: center;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-1;
    margin: 0;
    color: $color-primary;
    font-size: $font-size-page-title;
    font-weight: $font-weight-bold;
  }

  &__event-card {
    position: relative;
    overflow: hidden;
    padding: $spacing-3 $spacing-2;
    margin-top: $spacing-2;
    border: 1px solid rgba(32, 167, 160, 0.3);
    border-radius: calc($radius-card + 6px);
    background: linear-gradient(120deg, rgba(221, 245, 243, 0.82), $color-surface 50%, #eaf6ff);
    box-shadow: 0 6px 18px rgba(21, 32, 51, 0.06);

    &::before,
    &::after {
      position: absolute;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      content: '';
      pointer-events: none;
    }

    &::before {
      top: 18px;
      left: 22px;
      background: rgba(32, 167, 160, 0.24);
      box-shadow: 18px 28px 0 rgba(90, 131, 191, 0.14);
    }

    &::after {
      right: 24px;
      bottom: 20px;
      background: rgba(90, 131, 191, 0.2);
      box-shadow: -16px -30px 0 rgba(246, 200, 95, 0.2);
    }
  }

  &__schedule-name {
    position: relative;
    z-index: 1;
    max-width: 560px;
    margin: 0 auto;
    color: $color-text;
    font-size: clamp(26px, 6vw, 38px);
    font-weight: $font-weight-bold;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  &__answered-count {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 6px 14px;
    margin: $spacing-2 0 0;
    border: 1px solid rgba(152, 162, 179, 0.24);
    border-radius: $radius-chip;
    background: rgba(255, 255, 255, 0.8);
    color: $color-neutral-600;
    font-size: $font-size-caption;
    font-weight: $font-weight-semibold;

    &--complete {
      border-color: rgba(32, 167, 160, 0.24);
      color: $color-primary-dark;
    }
  }

  &__complete-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__summary {
    width: 100%;
    max-width: 760px;
    padding: $spacing-3;
    margin-top: $spacing-4;
    margin-right: auto;
    margin-left: auto;
    border: 1px solid $color-neutral-200;
    border-radius: calc($radius-card + 8px);
    background: linear-gradient(145deg, $color-surface, rgba(247, 251, 250, 0.86));
    box-shadow: 0 8px 22px rgba(21, 32, 51, 0.05);

    > h2 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 0 0 $spacing-2;
      color: $color-text;
      font-size: $font-size-section-title;
      text-align: center;
    }
  }

  &__summary-heading-icon {
    color: $color-primary;

    &:last-child {
      color: $color-accent-pink-dark;
    }
  }

  &__summary-story {
    width: 100%;
    max-width: 680px;
    padding: $spacing-1;
    margin: 0 auto;
    border-radius: $radius-card;
    background: transparent;
  }

  &__summary-step {
    position: relative;
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr);
    align-items: center;
    gap: 12px;

    & + & {
      margin-top: 14px;
    }

    &:not(:last-child)::after {
      position: absolute;
      z-index: 0;
      top: calc(50% + 27px);
      bottom: -21px;
      left: 27px;
      width: 1px;
      background: repeating-linear-gradient(
        to bottom,
        currentColor 0 5px,
        transparent 5px 9px
      );
      content: '';
      opacity: 0.55;
    }

    &--date {
      color: $color-accent-blue-dark;

      .result-view__summary-step-label {
        background: $color-accent-blue-dark;
      }
    }

    &--activity {
      color: $color-primary-dark;

      .result-view__summary-step-label {
        background: $color-primary-dark;
      }
    }

    &--area {
      color: $color-accent-pink-dark;

      .result-view__summary-step-label {
        background: $color-accent-pink-dark;
      }
    }
  }

  &__summary-step-label {
    position: relative;
    z-index: 1;
    display: grid;
    width: 56px;
    min-height: 56px;
    place-items: center;
    padding: 6px;
    border-radius: 50%;
    color: $color-neutral-0;
    font-size: 11px;
    font-weight: $font-weight-bold;
    line-height: 1.15;
    text-align: center;
  }

  &__summary-tile {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-width: 0;
    min-height: 104px;
    padding: 12px $spacing-2;
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

      .result-view__summary-description {
        color: $color-accent-blue-dark;
      }
    }

    &--activity {
      border: 1px solid $color-primary-dark;
      background: $color-primary-light;

      .result-view__summary-description {
        color: $color-primary-dark;
      }
    }

    &--area {
      border: 1px solid $color-accent-pink-dark;
      background: #ffeaf1;

      .result-view__summary-description {
        color: $color-accent-pink-dark;
      }
    }
  }

  &__summary-icon {
    width: 38px;
    height: 38px;

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
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    min-width: 0;
    align-items: baseline;
    gap: 6px $spacing-1;

    > strong {
      grid-column: 1;
    }
  }

  &__summary-chip {
    grid-column: 2;
    justify-self: end;
    padding: 3px 8px;
    border-radius: $radius-chip;
    background: rgba(255, 255, 255, 0.75);
    color: $color-text !important;
    font-weight: $font-weight-semibold;
  }

  &__summary-description {
    grid-column: 1;
    font-weight: $font-weight-semibold;
    line-height: 1.35;
  }

  &__summary-tie {
    grid-column: 2;
    justify-self: end;
    font-size: 11px;
    line-height: 1.3;
    text-align: right;
  }

  &__summary-note {
    display: block;
    max-width: 680px;
    margin-top: $spacing-1;
    margin-right: auto;
    margin-left: auto;
    color: $color-neutral-600;
  }

  @media (max-width: 420px) {
    &__content {
      padding-top: $spacing-2;
    }

    &__title {
      font-size: 21px;
    }

    &__event-card {
      padding: 20px 14px;
      margin-top: 12px;
    }

    &__schedule-name {
      font-size: clamp(24px, 8vw, 30px);
    }

    &__answered-count {
      margin-top: 12px;
    }

    &__summary {
      padding: $spacing-2 10px;
      margin-top: $spacing-3;

      > h2 {
        gap: 7px;
        font-size: 17px;
      }
    }

    &__summary-heading-icon {
      width: 16px;
      height: 16px;
    }

    &__summary-story {
      padding: 8px 0;
    }

    &__summary-step {
      grid-template-columns: 48px minmax(0, 1fr);
      gap: 10px;

      &:not(:last-child)::after {
        top: calc(50% + 23px);
        left: 23px;
      }
    }

    &__summary-step-label {
      width: 48px;
      min-height: 48px;
      padding: 4px;
      font-size: 10px;
    }

    &__summary-tile {
      grid-template-columns: 34px minmax(0, 1fr);
      gap: 10px;
      min-height: 96px;
      padding: 10px 12px;
    }

    &__summary-icon {
      width: 30px;
      height: 30px;
    }
  }

  &__details {
    margin-top: $spacing-4;

    > h2 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 0 0 $spacing-3;
      color: $color-text;
      font-size: $font-size-section-title;
      text-align: center;

      &::before,
      &::after {
        width: clamp(28px, 10vw, 72px);
        height: 1px;
        background: linear-gradient(90deg, transparent, $color-neutral-300);
        content: '';
      }

      &::after {
        background: linear-gradient(90deg, $color-neutral-300, transparent);
      }
    }
  }

  &__details-heading-icon {
    color: $color-primary-dark;
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
