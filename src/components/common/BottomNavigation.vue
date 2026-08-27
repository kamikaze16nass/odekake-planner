<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isHomeActive = () => route.name === 'home'

const isScheduleActive = () =>
  ['schedule-list', 'schedule-detail', 'result'].includes(String(route.name))

const goHome = () => {
  router.push({ name: 'home' })
}

const goScheduleList = () => {
  router.push({ name: 'schedule-list' })
}
</script>

<template>
  <nav class="bottom-navigation" aria-label="メインナビゲーション">
    <!-- ホーム -->
    <button
      type="button"
      class="bottom-navigation__item"
      :class="{
        'bottom-navigation__item--active': isHomeActive(),
      }"
      @click="goHome"
    >
      <svg class="bottom-navigation__icon" viewBox="0 0 24 24" aria-hidden="true">
        <!-- 選択中 -->
        <path
          v-if="isHomeActive()"
          d="
            M3 10.5
            12 3
            21 10.5
            V21
            H14.5
            V15
            H9.5
            V21
            H3
            Z
          "
          fill="currentColor"
        />

        <!-- 未選択 -->
        <path
          v-else
          d="
            M3 10.5
            12 3
            21 10.5
            V21
            H14.5
            V15
            H9.5
            V21
            H3
            Z
          "
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </svg>

      <span>ホーム</span>
    </button>

    <!-- 予定 -->
    <button
      type="button"
      class="bottom-navigation__item"
      :class="{
        'bottom-navigation__item--active': isScheduleActive(),
      }"
      @click="goScheduleList"
    >
      <svg class="bottom-navigation__icon" viewBox="0 0 24 24" aria-hidden="true">
        <!-- 選択中 -->
        <g v-if="isScheduleActive()">
          <rect x="2" y="4" width="20" height="18" rx="3" fill="currentColor" />

          <path
            d="M7 2V6 M17 2V6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />

          <path
            class="bottom-navigation__calendar-line"
            d="M3 10H21"
            fill="none"
            stroke-width="2"
          />
        </g>

        <!-- 未選択 -->
        <g v-else>
          <rect
            x="2"
            y="4"
            width="20"
            height="18"
            rx="3"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />

          <path
            d="M7 2V6 M17 2V6 M2 10H22"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </g>
      </svg>

      <span>予定</span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.bottom-navigation {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;

  display: grid;
  grid-template-columns: repeat(2, 1fr);

  width: 100%;
  min-height: calc(64px + env(safe-area-inset-bottom));

  padding-bottom: env(safe-area-inset-bottom);

  border-top: 1px solid $color-neutral-300;
  background-color: $color-surface;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;

    min-height: 64px;
    padding: 6px 0;

    border: 0;
    background: transparent;

    color: $color-neutral-600;
    font-family: inherit;
    font-size: $font-size-caption;
    line-height: 1;
    cursor: pointer;

    transition:
      color 0.15s ease,
      background-color 0.15s ease;

    &--active {
      color: $color-primary;
      font-weight: $font-weight-semibold;
    }

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: -2px;
    }
  }

  &__icon {
    display: block;

    width: 26px;
    height: 26px;

    flex-shrink: 0;
  }

  &__calendar-line {
    stroke: $color-surface;
  }
}
</style>
