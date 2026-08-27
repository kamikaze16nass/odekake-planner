<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import BackButton from '@/components/common/BackButton.vue'
import { useScheduleStore } from '@/stores/schedule'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()

const copied = ref(false)

const scheduleId = computed(() => String(route.params.id))

const schedule = computed(() => scheduleStore.getScheduleById(scheduleId.value))

const inviteUrl = computed(() => {
  if (!schedule.value) return ''

  return `${window.location.origin}/join/${schedule.value.inviteCode}`
})

const inviteMessage = computed(() => {
  if (!schedule.value) return ''

  return `「${schedule.value.title}」の予定を一緒に決めよう！

▼ここから回答できます
${inviteUrl.value}

招待コード：${schedule.value.inviteCode}

ホーム画面から招待コードを入力しても参加できます`
})

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)

    copied.value = true

    window.setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copied.value = false
  }
}

const shareInvite = async () => {
  if (!schedule.value) return

  if (navigator.share) {
    await navigator.share({
      title: schedule.value.title,
      text: inviteMessage.value,
    })

    return
  }

  await copyText(inviteMessage.value)
}

const goDetail = () => {
  router.push({
    name: 'schedule-detail',
    params: { id: scheduleId.value },
  })
}
</script>

<template>
  <main class="page invite-view">
    <template v-if="schedule">
      <!-- ヘッダー -->
      <header class="invite-view__header">
        <BackButton class="invite-view__back" @click="goDetail" />

        <div class="invite-view__heading">
          <h1 class="invite-view__title">友達を招待</h1>

          <p class="invite-view__schedule-name">「{{ schedule.title }}」</p>
        </div>
      </header>

      <p class="invite-view__lead">友達をこの予定に招待しよう</p>

      <!-- 招待メッセージ -->
      <section class="invite-view__section">
        <h2>招待メッセージ</h2>

        <div class="invite-view__message">
          <p>「{{ schedule.title }}」の予定を 一緒に決めよう！</p>

          <p>
            ▼ここから回答できます<br />
            <span class="invite-view__url">
              {{ inviteUrl }}
            </span>
          </p>

          <p>
            招待コード：
            <strong>
              {{ schedule.inviteCode }}
            </strong>
          </p>

          <p>ホーム画面から招待コードを入力しても 参加できます</p>
        </div>

        <BaseButton variant="secondary" @click="copyText(inviteMessage)">
          <span class="invite-view__button-content">
            <svg class="invite-view__button-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="8"
                y="8"
                width="11"
                height="11"
                rx="2"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />

              <path
                d="M16 8V6C16 4.9 15.1 4 14 4H6C4.9 4 4 4.9 4 6V14C4 15.1 4.9 16 6 16H8"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>

            <span>招待メッセージをコピー</span>
          </span>
        </BaseButton>

        <BaseButton @click="shareInvite">
          <span class="invite-view__button-content">
            <svg class="invite-view__button-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 16V4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />

              <path
                d="M8 8L12 4L16 8"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <path
                d="M6 11V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V11"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>

            <span>共有する</span>
          </span>
        </BaseButton>
      </section>

      <!-- 招待コード -->
      <section class="invite-view__section">
        <h2>招待コード</h2>

        <div class="invite-view__code-card">
          <strong>
            {{ schedule.inviteCode }}
          </strong>

          <button
            type="button"
            class="invite-view__copy-code"
            aria-label="招待コードをコピー"
            @click="copyText(schedule.inviteCode)"
          >
            <svg class="invite-view__copy-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="8"
                y="8"
                width="11"
                height="11"
                rx="2"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />

              <path
                d="M16 8V6C16 4.9 15.1 4 14 4H6C4.9 4 4 4.9 4 6V14C4 15.1 4.9 16 6 16H8"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </section>

      <div v-if="copied" class="invite-view__toast" role="status">コピーしました</div>
    </template>

    <p v-else>予定が見つかりません。</p>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.invite-view {
  position: relative;

  padding-top: $spacing-3;
  padding-bottom: $spacing-4;

  // ========================================
  // ヘッダー
  // ========================================

  &__header {
    position: relative;

    display: flex;
    justify-content: center;

    min-height: 72px;
  }

  &__back {
    position: absolute;
    top: 0;
    left: 0;
  }

  &__heading {
    display: flex;
    flex-direction: column;
    align-items: center;

    padding-inline: 48px;

    text-align: center;
  }

  &__title {
    margin: 0;

    color: $color-text;
    font-size: $font-size-page-title;
    font-weight: $font-weight-bold;
    line-height: 1.35;
  }

  &__schedule-name {
    margin: 6px 0 0;

    color: $color-primary-dark;
    font-size: $font-size-card-title;
    font-weight: $font-weight-semibold;
    line-height: 1.4;
  }

  &__lead {
    margin: $spacing-1 0 $spacing-3;

    color: $color-neutral-600;
    font-size: $font-size-body;
    text-align: center;
  }

  // ========================================
  // セクション
  // ========================================

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;

    & + & {
      margin-top: $spacing-4;
    }

    h2 {
      margin: 0;

      font-size: $font-size-section-title;
      font-weight: $font-weight-bold;
    }
  }

  // ========================================
  // 招待メッセージ
  // ========================================

  &__message {
    padding: $spacing-2;

    border: 1px solid $color-neutral-300;
    border-radius: $radius-card;
    background: $color-surface;

    p {
      margin: 0;

      line-height: 1.6;
      overflow-wrap: anywhere;

      & + p {
        margin-top: $spacing-2;
      }
    }

    strong {
      color: $color-primary-dark;
    }
  }

  &__url {
    color: $color-primary-dark;
  }

  // ========================================
  // ボタン
  // ========================================

  &__button-content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  &__button-icon {
    width: 22px;
    height: 22px;

    flex-shrink: 0;
  }

  // ========================================
  // 招待コード
  // ========================================

  &__code-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-2;

    padding: $spacing-2;

    border: 1px solid $color-neutral-300;
    border-radius: $radius-card;
    background: $color-surface;

    strong {
      color: $color-primary-dark;
      font-size: 20px;
      letter-spacing: 0.08em;
    }
  }

  &__copy-code {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 40px;
    height: 40px;
    padding: 0;

    border: 0;
    border-radius: 50%;
    background: transparent;

    color: $color-primary;
    cursor: pointer;

    &:hover {
      background: $color-primary-light;
    }

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: 2px;
    }
  }

  &__copy-icon {
    width: 24px;
    height: 24px;
  }

  // ========================================
  // トースト
  // ========================================

  &__toast {
    position: sticky;
    bottom: $spacing-2;

    width: fit-content;
    margin: $spacing-3 auto 0;
    padding: 8px 16px;

    border-radius: $radius-chip;
    background: $color-text;
    color: $color-neutral-0;

    font-size: $font-size-caption;
  }
}
</style>
