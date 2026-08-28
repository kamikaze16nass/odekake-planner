<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import appMark from '@/assets/images/app-mark.png'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BottomNavigation from '@/components/common/BottomNavigation.vue'
import NoticeCard from '@/components/schedule/NoticeCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useScheduleStore } from '@/stores/schedule'

const router = useRouter()
const route = useRoute()
const scheduleStore = useScheduleStore()

const inviteCode = ref('')

const displayNameInput = ref('')

const hasDisplayName = computed(() => {
  return scheduleStore.hasDisplayName
})

const saveDisplayName = async () => {
  const saved = scheduleStore.setDisplayName(displayNameInput.value)

  if (!saved) {
    return
  }

  displayNameInput.value = ''

  // 招待URLから来た場合は、名前保存後にそのまま参加して回答画面へ進む
  if (route.name === 'join') {
    const code = String(route.params.inviteCode ?? '')
      .trim()
      .toUpperCase()

    if (!code) {
      return
    }

    const schedule = await scheduleStore.findScheduleByInviteCode(code)

    if (!schedule) {
      await router.replace({
        name: 'home',
        query: {
          inviteError: 'not-found',
        },
      })

      return
    }

    const joined = await scheduleStore.joinSchedule(schedule.id)

    if (!joined) {
      await router.replace({
        name: 'home',
        query: {
          inviteError: 'join-failed',
        },
      })

      return
    }

    await router.replace({
      name: 'condition-input',
      params: {
        id: schedule.id,
      },
    })
  }
}

const unansweredSchedule = computed(() => scheduleStore.unansweredSchedules[0])

const allAnsweredSchedule = computed(() => scheduleStore.allAnsweredSchedules[0])

const formatPeriod = (startDate: string, endDate: string) => {
  const format = (dateString: string) => {
    const [, month, day] = dateString.split('-').map(Number)

    return `${month}/${day}`
  }

  return `${format(startDate)}〜${format(endDate)}`
}

const goCreateSchedule = () => {
  router.push({ name: 'schedule-create' })
}

const goAnswer = (id: string) => {
  router.push({
    name: 'condition-input',
    params: { id },
  })
}

const goResult = (id: string) => {
  router.push({
    name: 'result',
    params: { id },
  })
}

const joinByInviteCode = async () => {
  const code = inviteCode.value.trim().toUpperCase()

  if (!code) {
    return
  }

  const schedule = await scheduleStore.findScheduleByInviteCode(code)

  if (!schedule) {
    console.error('招待コードに一致する予定がありません。')

    return
  }

  const joined = await scheduleStore.joinSchedule(schedule.id)

  if (!joined) {
    return
  }

  router.push({
    name: 'condition-input',
    params: {
      id: schedule.id,
    },
  })
}
</script>

<template>
  <div class="home-view">
    <main class="page page--with-bottom-nav home-view__content">
      <!-- アプリロゴ -->
      <header class="home-view__header">
        <img :src="appMark" alt="" class="home-view__logo" />

        <h1 class="home-view__title">おでかけ検討アプリ</h1>
      </header>

      <!-- 初回セットアップ -->
      <section v-if="!hasDisplayName" class="home-view__setup">
        <div class="home-view__setup-heading">
          <h2>はじめまして！</h2>

          <p>
            このアプリで使う名前を<br />
            教えてください
          </p>
        </div>

        <form class="home-view__setup-form" @submit.prevent="saveDisplayName">
          <BaseInput v-model="displayNameInput" placeholder="名前を入力" />

          <BaseButton type="submit" :disabled="!displayNameInput.trim()"> はじめる </BaseButton>
        </form>

        <p class="home-view__setup-hint">入力した名前は、参加する予定で友達にも表示されます。</p>
      </section>

      <!-- 通常ホーム -->
      <template v-else>
        <!-- お知らせ -->
        <section class="home-view__section">
          <div class="home-view__notice-list">
            <NoticeCard
              v-if="unansweredSchedule"
              type="answer-required"
              title="回答が必要な予定があります！"
              :schedule-name="unansweredSchedule.title"
              :period="formatPeriod(unansweredSchedule.startDate, unansweredSchedule.endDate)"
              :response-status="`${unansweredSchedule.members.length}人中${unansweredSchedule.responses.length}人が回答済み`"
              action-label="回答する"
              @action="goAnswer(unansweredSchedule.id)"
            />

            <NoticeCard
              v-if="allAnsweredSchedule"
              type="all-answered"
              title="みんなの回答がそろいました！"
              :schedule-name="allAnsweredSchedule.title"
              :period="formatPeriod(allAnsweredSchedule.startDate, allAnsweredSchedule.endDate)"
              action-label="集計結果を見る"
              @action="goResult(allAnsweredSchedule.id)"
            />

            <EmptyState
              v-if="!unansweredSchedule && !allAnsweredSchedule"
              title="今やることはありません"
              description="次のおでかけ予定を、みんなで考えてみませんか？"
              @action="goCreateSchedule"
            />
          </div>
        </section>

        <!-- 新規予定 -->
        <section v-if="unansweredSchedule || allAnsweredSchedule" class="home-view__section">
          <BaseButton variant="secondary" @click="goCreateSchedule">
            ＋ 新しい予定を作る
          </BaseButton>
        </section>

        <!-- 招待コード -->
        <section class="home-view__section">
          <h2 class="home-view__section-title">招待コードをもらった？</h2>

          <form class="home-view__invite-form" @submit.prevent="joinByInviteCode">
            <BaseInput v-model="inviteCode" placeholder="8桁の招待コードを入力" />

            <BaseButton type="submit" :disabled="!inviteCode.trim()">
              招待コードで参加する
            </BaseButton>
          </form>
        </section>
      </template>
    </main>

    <BottomNavigation />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.home-view {
  display: flex;
  flex-direction: column;

  min-height: 100dvh;

  &__content {
    flex: 1;

    padding-top: $spacing-3;
  }

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-1;

    margin-bottom: $spacing-3;
  }

  &__logo {
    display: block;

    width: 128px;
    height: auto;

    object-fit: contain;
  }

  &__title {
    margin: 0;

    color: $color-primary;
    font-size: $font-size-page-title;
    font-weight: $font-weight-bold;
    line-height: 1.3;
    text-align: center;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;

    & + & {
      margin-top: $spacing-3;
    }
  }

  &__section-title {
    margin: 0;

    font-size: $font-size-section-title;
    font-weight: $font-weight-bold;
  }

  &__notice-list,
  &__invite-form {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__create-button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-1;
  }

  &__create-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 24px;
    height: 24px;

    border: 2px solid currentColor;
    border-radius: 50%;

    font-size: 20px;
    font-weight: $font-weight-semibold;
    line-height: 1;
  }

  &__setup {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;

    padding: $spacing-3;

    border: 1px solid $color-neutral-300;
    border-radius: $radius-card;
    background: $color-surface;
  }

  &__setup-heading {
    text-align: center;

    h2 {
      margin: 0;

      color: $color-primary;
      font-size: $font-size-page-title;
      font-weight: $font-weight-bold;
    }

    p {
      margin: $spacing-1 0 0;

      color: $color-neutral-600;
      line-height: 1.7;
    }
  }

  &__setup-form {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__setup-hint {
    margin: 0;

    color: $color-neutral-600;
    font-size: $font-size-caption;
    line-height: 1.6;
    text-align: center;
  }
}
</style>
