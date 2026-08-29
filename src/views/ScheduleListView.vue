<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import BottomNavigation from '@/components/common/BottomNavigation.vue'
import ScheduleCard from '@/components/schedule/ScheduleCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { useScheduleStore } from '@/stores/schedule'

const router = useRouter()
const scheduleStore = useScheduleStore()

const schedules = computed(() => scheduleStore.activeSchedules)

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

const formatPeriod = (startDate: string, endDate: string) => {
  const format = (dateString: string) => {
    const date = new Date(dateString)

    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return `${format(startDate)}〜${format(endDate)}`
}

const goDetail = (id: string) => {
  router.push({
    name: 'schedule-detail',
    params: { id },
  })
}

const goResult = (id: string) => {
  router.push({
    name: 'result',
    params: { id },
  })
}

const goAnswer = (id: string) => {
  router.push({
    name: 'condition-input',
    params: { id },
  })
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

      <section v-else class="schedule-list-view__list">
        <template v-if="schedules.length > 0">
          <ScheduleCard
            v-for="schedule in schedules"
            :key="schedule.id"
            :title="schedule.title"
            :period="formatPeriod(schedule.startDate, schedule.endDate)"
            :response-status="`${schedule.members.length}人中${schedule.responses.length}人が回答済み`"
            :answered="scheduleStore.hasCurrentUserAnswered(schedule.id)"
            :all-answered="
              schedule.members.length > 0 && schedule.responses.length >= schedule.members.length
            "
            @detail="goDetail(schedule.id)"
            @result="goResult(schedule.id)"
            @answer="goAnswer(schedule.id)"
          />
        </template>

        <EmptyState
          v-else-if="scheduleStore.scheduleDataStatus === 'success'"
          title="まだ予定はありません"
          description="まずは新しい予定を作って、みんなを誘ってみましょう。"
          @action="goCreateSchedule"
        />
      </section>
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
    flex: 1;
    padding-top: $spacing-3;
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

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }
}
</style>
