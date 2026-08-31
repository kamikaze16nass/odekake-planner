<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import BottomNavigation from '@/components/common/BottomNavigation.vue'
import ScheduleCard from '@/components/schedule/ScheduleCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { useScheduleStore } from '@/stores/schedule'
import { formatSchedulePeriod } from '@/utils/scheduleDate'

const router = useRouter()
const scheduleStore = useScheduleStore()

const schedules = computed(() => scheduleStore.activeSchedules)

const scheduleSections = computed(() => {
  return [
    {
      id: 'unanswered',
      title: '自分の回答が必要',
      schedules: scheduleStore.unansweredSchedules,
      answered: false,
    },
    {
      id: 'waiting',
      title: 'みんなの回答待ち',
      schedules: scheduleStore.waitingForOthersSchedules,
      answered: true,
    },
    {
      id: 'all-answered',
      title: '全員回答済み',
      schedules: scheduleStore.allAnsweredSchedules,
      answered: true,
    },
  ].filter((section) => section.schedules.length > 0)
})

const isInitialLoading = computed(
  () =>
    scheduleStore.scheduleDataStatus === 'idle' ||
    (scheduleStore.scheduleDataStatus === 'loading' && scheduleStore.schedules.length === 0),
)

const hasInitialError = computed(
  () => scheduleStore.scheduleDataStatus === 'error' && scheduleStore.schedules.length === 0,
)

const retryScheduleData = async () => {
  const authSuccess = await scheduleStore.initializeAuth()
  if (!authSuccess) return
  await scheduleStore.fetchScheduleData()
}

const goCreateSchedule = () => {
  router.push({
    name: 'schedule-create',
  })
}
</script>

<template>
  <div class="schedule-list-view">
    <main class="page page--with-bottom-nav schedule-list-view__content">
      <header class="schedule-list-view__header">
        <h1 class="schedule-list-view__title">予定一覧</h1>

        <p class="schedule-list-view__description">参加中の予定を確認できます</p>
      </header>

      <LoadingState v-if="isInitialLoading" label="予定を読み込んでいます" />

      <div v-else-if="hasInitialError" role="alert">
        <EmptyState
          title="予定を読み込めませんでした"
          :description="scheduleStore.scheduleDataError ?? 'もう一度お試しください。'"
          action-label="再試行"
          @action="retryScheduleData"
        />
      </div>

      <div v-else class="schedule-list-view__sections">
        <template v-if="schedules.length > 0">
          <section
            v-for="section in scheduleSections"
            :key="section.id"
            class="schedule-list-view__section"
          >
            <div class="schedule-list-view__section-heading">
              <h2>{{ section.title }}</h2>
              <span>{{ section.schedules.length }}件</span>
            </div>

            <div class="schedule-list-view__track">
              <ScheduleCard
                v-for="schedule in section.schedules"
                :key="schedule.id"
                :schedule-id="schedule.id"
                :title="schedule.title"
                :period="formatSchedulePeriod(schedule.startDate, schedule.endDate)"
                :response-status="`${schedule.responses.length} / ${schedule.members.length} 人回答`"
                :answered="section.answered"
              />
            </div>
          </section>
        </template>

        <EmptyState
          v-else-if="scheduleStore.scheduleDataStatus === 'success'"
          title="まだ予定はありません"
          description="まずは新しい予定を作って、みんなを誘ってみましょう。"
          @action="goCreateSchedule"
        />
      </div>
    </main>

    <BottomNavigation />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.schedule-list-view {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;

  &__content {
    width: 100%;
    max-width: 960px;
    margin-inline: auto;
    flex: 1;
    padding-top: $spacing-3;
    overflow-x: clip;
  }

  &__header {
    margin-bottom: $spacing-3;
  }

  &__title {
    margin: 0;

    font-size: $font-size-page-title;
    font-weight: $font-weight-bold;
  }

  &__description {
    margin: $spacing-1 0 0;

    color: $color-neutral-600;
    font-size: $font-size-body;
  }

  &__sections {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__section {
    min-width: 0;
  }

  &__section-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $spacing-2;
    margin-bottom: $spacing-2;

    h2 {
      margin: 0;
      font-size: $font-size-section-title;
      font-weight: $font-weight-bold;
    }

    span {
      flex-shrink: 0;
      color: $color-neutral-600;
      font-size: $font-size-caption;
    }
  }

  &__track {
    display: flex;
    gap: $spacing-2;

    width: 100%;
    padding: 2px 2px $spacing-1;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: inline proximity;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    > * {
      flex: 0 0 80%;
      min-width: 0;
      scroll-snap-align: start;
    }
  }
}

@media (min-width: 720px) {
  .schedule-list-view__track > * {
    flex-basis: 32%;
    min-width: 260px;
  }
}
</style>
