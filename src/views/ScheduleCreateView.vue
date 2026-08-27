<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BackButton from '@/components/common/BackButton.vue'
import { useScheduleStore } from '@/stores/schedule'

const router = useRouter()
const scheduleStore = useScheduleStore()

const title = ref('')
const startDate = ref('')
const endDate = ref('')
const memo = ref('')

const createSchedule = async () => {
  if (!title.value.trim() || !startDate.value || !endDate.value) {
    return
  }

  const id = await scheduleStore.createSchedule({
    title: title.value.trim(),
    startDate: startDate.value,
    endDate: endDate.value,
    memo: memo.value.trim() || undefined,
  })

  router.push({
    name: 'condition-input',
    params: { id },
  })
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <main class="page schedule-create">
    <header class="schedule-create__header">
      <BackButton @click="goBack" />

      <h1 class="schedule-create__title">予定を作成</h1>
    </header>

    <p class="schedule-create__description">みんなで決める予定の基本情報を入力してください。</p>

    <form class="schedule-create__form" @submit.prevent="createSchedule">
      <BaseInput v-model="title" label="予定の名前" placeholder="例：9月中に同窓会！" required />

      <section class="schedule-create__field">
        <h2 class="schedule-create__label">
          いつごろ開催する？
          <span>*</span>
        </h2>

        <p class="schedule-create__hint">参加者はこの期間から遊べる日を選びます。</p>

        <div class="schedule-create__date-range">
          <label>
            <span>開始日</span>

            <input v-model="startDate" type="date" required />
          </label>

          <span class="schedule-create__separator"> 〜 </span>

          <label>
            <span>終了日</span>

            <input v-model="endDate" type="date" :min="startDate" required />
          </label>
        </div>
      </section>

      <label class="schedule-create__memo">
        <span>メモ（任意）</span>

        <textarea
          v-model="memo"
          maxlength="500"
          placeholder="みんなに伝えておきたいことがあれば入力"
        />

        <small> {{ memo.length }}/500 </small>
      </label>

      <div class="schedule-create__submit">
        <BaseButton type="submit" :disabled="!title.trim() || !startDate || !endDate">
          予定を作成
        </BaseButton>

        <p>続けてあなたの希望を回答します</p>
      </div>
    </form>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.schedule-create {
  padding-top: $spacing-3;
  padding-bottom: $spacing-4;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-2;
  }

  &__back {
    font-size: 24px;
  }

  &__title {
    margin: 0;
    font-size: $font-size-page-title;
  }

  &__description {
    margin: $spacing-2 0 $spacing-3;
    color: $color-neutral-600;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  &__field,
  &__memo {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__label,
  &__memo > span {
    margin: 0;
    font-size: $font-size-body;
    font-weight: $font-weight-semibold;
  }

  &__label span {
    color: $color-primary;
  }

  &__hint {
    margin: 0;
    color: $color-neutral-600;
    font-size: $font-size-caption;
  }

  &__date-range {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: $spacing-1;

    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;

      span {
        color: $color-neutral-600;
        font-size: $font-size-caption;
      }
    }

    input {
      width: 100%;
      min-width: 0;
      min-height: 44px;
      padding: 8px;

      border: 1px solid $color-neutral-300;
      border-radius: $radius-input;
      background: $color-surface;
    }
  }

  &__separator {
    padding-bottom: 10px;
  }

  &__memo {
    textarea {
      min-height: 120px;
      padding: $spacing-2;
      resize: vertical;

      border: 1px solid $color-neutral-300;
      border-radius: $radius-input;

      font: inherit;

      &:focus {
        border-color: $color-primary;
        outline: 3px solid $color-primary-light;
      }
    }

    small {
      align-self: flex-end;
      color: $color-neutral-600;
    }
  }

  &__submit {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;

    p {
      margin: 0;
      text-align: center;
      color: $color-neutral-600;
      font-size: $font-size-caption;
    }
  }
}
</style>
