<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BackButton from '@/components/common/BackButton.vue'
import { useScheduleStore } from '@/stores/schedule'

import type { TransportPolicy } from '@/types/schedule'

const router = useRouter()
const scheduleStore = useScheduleStore()

const title = ref('')
const startDate = ref('')
const endDate = ref('')
const transportPolicy = ref<TransportPolicy>('flexible')
const isCreating = ref(false)
const createError = ref('')

const parseDateParts = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return { year, month, day }
}

const formatDateValue = (year: number, month: number, day: number) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const addCalendarMonths = (value: string, monthsToAdd: number) => {
  const parts = parseDateParts(value)

  if (!parts) return ''

  const targetMonthIndex = parts.month - 1 + monthsToAdd
  const targetYear = parts.year + Math.floor(targetMonthIndex / 12)
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  const targetDay = Math.min(parts.day, lastDay)

  return formatDateValue(targetYear, targetMonth + 1, targetDay)
}

const maxEndDate = computed(() => addCalendarMonths(startDate.value, 3))

const dateValidationError = computed(() => {
  if (!startDate.value || !endDate.value) return ''

  if (!parseDateParts(startDate.value) || !parseDateParts(endDate.value)) {
    return '正しい日付を入力してください。'
  }

  if (endDate.value < startDate.value) {
    return '終了日は開始日以降を選んでください。'
  }

  if (!maxEndDate.value || endDate.value > maxEndDate.value) {
    return '候補期間は最大3か月です。'
  }

  return ''
})

const canCreate = computed(
  () =>
    Boolean(title.value.trim() && startDate.value && endDate.value) && !dateValidationError.value,
)

watch(startDate, () => {
  if (
    endDate.value &&
    (endDate.value < startDate.value ||
      Boolean(maxEndDate.value && endDate.value > maxEndDate.value))
  ) {
    endDate.value = ''
  }
})

const createSchedule = async () => {
  if (isCreating.value || !canCreate.value) {
    return
  }

  isCreating.value = true
  createError.value = ''

  try {
    const id = await scheduleStore.createSchedule({
      title: title.value.trim(),
      startDate: startDate.value,
      endDate: endDate.value,
      transportPolicy: transportPolicy.value,
    })

    await router.push({
      name: 'condition-input',
      params: { id },
    })
  } catch {
    createError.value = '予定を作成できませんでした。もう一度お試しください。'
  } finally {
    isCreating.value = false
  }
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

    <form class="schedule-create__form" @submit.prevent="createSchedule">
      <BaseInput v-model="title" label="予定の名前" placeholder="例：9月中に同窓会！" required />

      <section class="schedule-create__field schedule-create__field--date">
        <div class="schedule-create__field-heading">
          <AppIcon name="calendar" :size="21" />
          <h2 class="schedule-create__label">
            いつごろ開催する？
            <span>*</span>
          </h2>
        </div>

        <p class="schedule-create__hint">参加者はこの期間から遊べる日を選びます（最大3か月）</p>

        <div class="schedule-create__date-range">
          <label>
            <span>開始日</span>

            <input v-model="startDate" type="date" required />
          </label>

          <label>
            <span>終了日</span>

            <input
              v-model="endDate"
              type="date"
              :min="startDate"
              :max="maxEndDate || undefined"
              required
            />
          </label>
        </div>

        <p v-if="dateValidationError" class="schedule-create__field-error" role="alert">
          {{ dateValidationError }}
        </p>
      </section>

      <fieldset class="schedule-create__transport-fieldset">
        <legend class="schedule-create__field-heading">
          <AppIcon name="route" :size="21" />
          <span class="schedule-create__label">移動方法はどうする？</span>
        </legend>

        <div class="schedule-create__transport-options">
          <label
            class="schedule-create__transport-option"
            :class="{
              'schedule-create__transport-option--selected': transportPolicy === 'flexible',
            }"
          >
            <input
              v-model="transportPolicy"
              type="radio"
              name="transport-policy"
              value="flexible"
            />

            <span class="schedule-create__transport-option-copy">
              <strong>各自で選ぶ</strong>
              <small>徒歩・車・条件なしから回答</small>
            </span>
          </label>

          <label
            class="schedule-create__transport-option"
            :class="{
              'schedule-create__transport-option--selected': transportPolicy === 'transit',
            }"
          >
            <input v-model="transportPolicy" type="radio" name="transport-policy" value="transit" />

            <span class="schedule-create__transport-option-copy">
              <strong>電車で行く</strong>
              <small>この予定は電車移動で固定</small>
            </span>
          </label>
        </div>
      </fieldset>

      <div class="schedule-create__submit">
        <p v-if="createError" class="schedule-create__error" role="alert">
          {{ createError }}
        </p>

        <BaseButton
          type="submit"
          :disabled="!canCreate"
          :loading="isCreating"
          loading-label="予定を作成中..."
        >
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
  width: 100%;
  max-width: 640px;
  margin-inline: auto;
  padding-top: $spacing-3;
  padding-bottom: $spacing-4;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-2;
  }

  &__title {
    margin: 0;
    font-size: $font-size-page-title;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
    margin-top: $spacing-3;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;

    &--date .schedule-create__field-heading {
      color: $color-accent-blue-dark;
    }
  }

  &__field-heading {
    display: flex;
    align-items: center;
    gap: $spacing-1;
    margin: 0;
  }

  &__label {
    margin: 0;
    color: $color-text;
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
    grid-template-columns: minmax(0, 1fr);
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

      &:focus-visible {
        border-color: $color-accent-blue-dark;
        outline: 3px solid $color-accent-blue-light;
      }
    }
  }

  &__field-error {
    margin: 0;
    color: $color-error;
    font-size: $font-size-caption;
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

  &__transport-fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;

    > .schedule-create__field-heading {
      color: $color-accent-yellow-dark;
    }
  }

  &__transport-options {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
    margin-top: $spacing-2;
  }

  &__transport-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: $spacing-2;
    border: 1px solid $color-neutral-300;
    border-radius: $radius-input;
    background: $color-surface;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;

    &--selected {
      border-color: $color-accent-yellow-dark;
      background: $color-accent-yellow-light;
    }

    &:has(input:focus-visible) {
      outline: 3px solid rgba($color-accent-yellow-dark, 0.22);
      outline-offset: 2px;
    }

    input {
      width: 20px;
      height: 20px;
      margin: 2px 0 0;
      flex-shrink: 0;
      accent-color: $color-accent-yellow-dark;

      &:focus-visible {
        outline: none;
      }
    }
  }

  &__transport-option-copy {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 4px;

    strong {
      color: $color-text;
      font-size: $font-size-body;
    }

    small {
      color: $color-neutral-600;
      font-size: $font-size-caption;
      line-height: 1.5;
    }
  }

  &__submit &__error {
    margin: 0;
    color: $color-error;
    font-size: $font-size-caption;
    text-align: center;
  }
}

@media (min-width: 520px) {
  .schedule-create__date-range {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $spacing-2;
  }
}
</style>
