<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseChip from '@/components/common/BaseChip.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BackButton from '@/components/common/BackButton.vue'
import { useScheduleStore } from '@/stores/schedule'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()

const scheduleId = computed(() => String(route.params.id))

const schedule = computed(() => scheduleStore.getScheduleById(scheduleId.value))

const existingResponse = computed(() => scheduleStore.getCurrentUserResponse(scheduleId.value))

const activities = [
  'ごはん',
  '映画',
  'ショッピング',
  'アクティビティ',
  '美術館',
  'のんびり',
  '何でもOK',
]

const selectedDates = ref<string[]>([])
const selectedActivities = ref<string[]>([])
const departure = ref('')
const travelTime = ref('')
const preferredArea = ref('')

type CalendarDay = {
  key: string
  day: number
  label: string
  selectable: boolean
}

type CalendarMonth = {
  key: string
  year: number
  month: number
  days: (CalendarDay | null)[]
}

const parseDate = (value: string) => {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number)

  return new Date(year, month - 1, day)
}

const formatDateKey = (year: number, month: number, day: number) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const formatDateLabel = (month: number, day: number) => {
  return `${month}/${day}`
}

const calendarMonths = computed<CalendarMonth[]>(() => {
  if (!schedule.value) return []

  const start = parseDate(schedule.value.startDate)

  const end = parseDate(schedule.value.endDate)

  const months: CalendarMonth[] = []

  let year = start.getFullYear()
  let month = start.getMonth() + 1

  const endYear = end.getFullYear()
  const endMonth = end.getMonth() + 1

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

    const lastDayOfMonth = new Date(year, month, 0).getDate()

    const days: (CalendarDay | null)[] = []

    // 月初の曜日位置を合わせるための空セル
    for (let index = 0; index < firstDayOfMonth; index++) {
      days.push(null)
    }

    // その月の日付はすべて表示する
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const date = new Date(year, month - 1, day)

      const selectable = date >= start && date <= end

      days.push({
        key: formatDateKey(year, month, day),
        day,
        label: formatDateLabel(month, day),
        selectable,
      })
    }

    months.push({
      key: `${year}-${month}`,
      year,
      month,
      days,
    })

    month++

    if (month === 13) {
      month = 1
      year++
    }
  }

  return months
})

const currentMonthIndex = ref(0)

const currentCalendar = computed(() => {
  return calendarMonths.value[currentMonthIndex.value]
})

const canGoPreviousMonth = computed(() => currentMonthIndex.value > 0)

const canGoNextMonth = computed(() => currentMonthIndex.value < calendarMonths.value.length - 1)

const goPreviousMonth = () => {
  if (!canGoPreviousMonth.value) return

  currentMonthIndex.value--
}

const goNextMonth = () => {
  if (!canGoNextMonth.value) return

  currentMonthIndex.value++
}

watch(
  calendarMonths,
  () => {
    currentMonthIndex.value = 0
  },
  {
    immediate: true,
  },
)

watch(
  existingResponse,
  (response) => {
    if (!response) return

    selectedDates.value = response.availableDates.map((savedDate) => {
      // 新形式
      if (/^\d{4}-\d{2}-\d{2}$/.test(savedDate)) {
        return savedDate
      }

      // 旧モック形式 9/12 などにも対応
      const [month, day] = savedDate.split('/').map(Number)

      const matchingDate = calendarMonths.value
        .flatMap((calendar) => calendar.days)
        .find((calendarDay) => calendarDay?.label === `${month}/${day}` && calendarDay.selectable)

      return matchingDate?.key ?? savedDate
    })

    selectedActivities.value = [...response.activities]

    departure.value = response.departure
    travelTime.value = response.travelTime
    preferredArea.value = response.preferredArea ?? ''
  },
  {
    immediate: true,
  },
)

const toggleDate = (date: CalendarDay) => {
  if (!date.selectable) return

  selectedDates.value = selectedDates.value.includes(date.key)
    ? selectedDates.value.filter((item) => item !== date.key)
    : [...selectedDates.value, date.key]
}

const toggleActivity = (activity: string) => {
  if (activity === '何でもOK') {
    selectedActivities.value = selectedActivities.value.includes(activity) ? [] : ['何でもOK']

    return
  }

  const values = selectedActivities.value.filter((item) => item !== '何でもOK')

  selectedActivities.value = values.includes(activity)
    ? values.filter((item) => item !== activity)
    : [...values, activity]
}

const canSubmit = computed(
  () =>
    selectedDates.value.length > 0 &&
    selectedActivities.value.length > 0 &&
    Boolean(departure.value.trim()) &&
    Boolean(travelTime.value),
)

const submitAnswer = () => {
  if (!canSubmit.value) return

  scheduleStore.submitResponse(scheduleId.value, {
    availableDates: selectedDates.value,
    activities: selectedActivities.value,
    departure: departure.value.trim(),
    travelTime: travelTime.value,
    preferredArea: preferredArea.value.trim() || undefined,
  })

  router.push({
    name: 'schedule-detail',
    params: {
      id: scheduleId.value,
    },
  })
}
const goBack = () => {
  router.back()
}
</script>

<template>
  <main class="page condition-input">
    <template v-if="schedule">
      <header class="condition-input__header">
        <BackButton @click="goBack" />

        <div>
          <h1>{{ schedule.title }}</h1>

          <p>おでかけの条件を設定します。</p>
        </div>
      </header>

      <form class="condition-input__form" @submit.prevent="submitAnswer">
        <!-- いつ遊べる？ -->
        <section class="condition-input__section">
          <div class="condition-input__section-heading">
            <svg class="condition-input__section-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="2"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />

              <path
                d="M7 3V7 M17 3V7 M3 10H21"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>

            <h2>いつ遊べる？</h2>
          </div>

          <p>遊べる日をすべて選んでください。</p>

          <div v-if="currentCalendar" class="condition-input__calendar">
            <div class="condition-input__calendar-header">
              <button
                type="button"
                class="condition-input__month-button"
                :disabled="!canGoPreviousMonth"
                aria-label="前の月"
                @click="goPreviousMonth"
              >
                ‹
              </button>

              <h3>{{ currentCalendar.year }}年{{ currentCalendar.month }}月</h3>

              <button
                type="button"
                class="condition-input__month-button"
                :disabled="!canGoNextMonth"
                aria-label="次の月"
                @click="goNextMonth"
              >
                ›
              </button>
            </div>

            <div class="condition-input__weekdays">
              <span>日</span>
              <span>月</span>
              <span>火</span>
              <span>水</span>
              <span>木</span>
              <span>金</span>
              <span>土</span>
            </div>

            <div class="condition-input__calendar-grid">
              <template
                v-for="(date, index) in currentCalendar.days"
                :key="date?.key ?? `${currentCalendar.key}-${index}`"
              >
                <button
                  v-if="date"
                  type="button"
                  class="condition-input__date"
                  :class="{
                    'condition-input__date--selected': selectedDates.includes(date.key),
                    'condition-input__date--disabled': !date.selectable,
                  }"
                  :disabled="!date.selectable"
                  :aria-pressed="date.selectable ? selectedDates.includes(date.key) : undefined"
                  @click="toggleDate(date)"
                >
                  {{ date.day }}
                </button>

                <span v-else class="condition-input__date-placeholder" />
              </template>
            </div>
          </div>
        </section>

        <!-- なにしたい？ -->
        <section class="condition-input__section">
          <div class="condition-input__section-heading">
            <svg class="condition-input__section-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />

              <path
                d="M19 14L19.8 16.2L22 17L19.8 17.8L19 20L18.2 17.8L16 17L18.2 16.2L19 14Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />

              <path
                d="M5 14L5.7 16L8 17L5.7 18L5 20L4.3 18L2 17L4.3 16L5 14Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />
            </svg>

            <h2>なにしたい？</h2>
          </div>

          <p>いくつでも選べます。</p>

          <div class="condition-input__chips">
            <BaseChip
              v-for="activity in activities"
              :key="activity"
              :label="activity"
              :selected="selectedActivities.includes(activity)"
              @select="toggleActivity(activity)"
            />
          </div>
        </section>

        <!-- どこまでいける？ -->
        <section class="condition-input__section">
          <div class="condition-input__section-heading">
            <svg class="condition-input__section-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 21C12 21 19 15.2 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 15.2 12 21 12 21Z"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />

              <circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>

            <h2>どこまでいける？</h2>
          </div>

          <BaseInput v-model="departure" label="出発地点" placeholder="例：東京駅" required />

          <fieldset class="condition-input__travel-time">
            <legend>移動できる時間</legend>

            <label
              v-for="option in ['徒歩圏内', '30分以内', '1時間以内', '2時間以内']"
              :key="option"
              class="condition-input__radio-label"
            >
              <input
                v-model="travelTime"
                class="condition-input__radio"
                type="radio"
                :value="option"
              />

              <span>
                {{ option === '徒歩圏内' ? option : `電車で${option}` }}
              </span>
            </label>
          </fieldset>

          <BaseInput
            v-model="preferredArea"
            label="行ってみたい場所（任意）"
            placeholder="例：新宿、横浜"
          />
        </section>

        <BaseButton type="submit" :disabled="!canSubmit">
          {{ existingResponse ? '回答を更新' : '回答を送信' }}
        </BaseButton>
      </form>
    </template>

    <p v-else>予定が見つかりません。</p>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/styles/tokens' as *;

.condition-input {
  padding-top: $spacing-3;
  padding-bottom: $spacing-4;

  &__header {
    display: flex;
    align-items: flex-start;
    gap: $spacing-2;
    margin-bottom: $spacing-3;

    h1,
    p {
      margin: 0;
    }

    h1 {
      font-size: $font-size-page-title;
    }

    p {
      margin-top: 4px;
      color: $color-neutral-600;
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;

    h2,
    p {
      margin: 0;
    }

    > p {
      color: $color-neutral-600;
      font-size: $font-size-caption;
    }
  }

  &__section-heading {
    display: flex;
    align-items: center;
    gap: 10px;

    h2 {
      color: $color-text;
      font-size: $font-size-section-title;
      font-weight: $font-weight-bold;
    }
  }

  &__section-icon {
    flex-shrink: 0;

    width: 26px;
    height: 26px;

    color: $color-primary;
  }

  &__field-icon {
    flex-shrink: 0;

    width: 20px;
    height: 20px;

    color: $color-primary;
  }

  &__calendar {
    width: 100%;
    padding: $spacing-2;

    border: 1px solid $color-neutral-300;
    border-radius: $radius-card;
    background: $color-surface;
  }

  &__calendar-header {
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;

    margin-bottom: $spacing-2;

    h3 {
      margin: 0;

      text-align: center;
      font-size: $font-size-body;
      font-weight: $font-weight-semibold;
    }
  }

  &__month-button {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 44px;
    height: 44px;

    border-radius: $radius-button;

    color: $color-primary;
    font-size: 28px;

    &:disabled {
      color: $color-neutral-300;
      cursor: default;
    }
  }

  &__weekdays,
  &__calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  &__weekdays {
    margin-bottom: 4px;

    span {
      text-align: center;
      color: $color-neutral-600;
      font-size: $font-size-caption;
    }
  }

  &__date,
  &__date-placeholder {
    width: 100%;
    height: 40px;
  }

  &__date {
    display: flex;
    align-items: center;
    justify-content: center;

    border: 1px solid transparent;
    border-radius: $radius-input;

    background: transparent;
    color: $color-text;

    font: inherit;

    &--selected {
      border-color: $color-primary;
      background: $color-primary-light;
      color: $color-primary-dark;
      font-weight: $font-weight-semibold;
    }

    &--disabled {
      color: $color-neutral-300;
      background: transparent;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 3px solid $color-primary-light;
      outline-offset: 1px;
    }
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-1;
  }

  &__travel-time {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;

    margin: 0;
    padding: 0;

    border: 0;

    legend {
      margin-bottom: $spacing-1;

      color: $color-text;
      font-weight: $font-weight-semibold;
    }
  }

  &__radio-label {
    display: flex;
    align-items: center;
    gap: 12px;

    min-height: 44px;

    color: $color-text;
    cursor: pointer;
  }

  &__radio {
    appearance: none;

    position: relative;

    width: 20px;
    height: 20px;
    margin: 0;

    flex-shrink: 0;

    border: 2px solid $color-neutral-400;
    border-radius: 50%;
    background-color: $color-surface;

    cursor: pointer;

    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;

    &::after {
      content: '';

      position: absolute;
      top: 50%;
      left: 50%;

      width: 10px;
      height: 10px;

      border-radius: 50%;
      background-color: transparent;

      transform: translate(-50%, -50%);
    }

    &:checked {
      border-color: $color-primary;
      background-color: $color-surface;

      &::after {
        background-color: $color-primary;
      }
    }

    &:focus-visible {
      outline: 3px solid $color-primary-light;
      outline-offset: 2px;
    }
  }
}
</style>
