<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseChip from '@/components/common/BaseChip.vue'
import BackButton from '@/components/common/BackButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import MapPicker from '@/components/common/MapPicker.vue'
import { forwardGeocode, reverseGeocode } from '@/services/geoapify'
import { useScheduleStore } from '@/stores/schedule'

import type { TransportMode } from '@/types/schedule'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()

const scheduleId = computed(() => String(route.params.id))
const schedule = computed(() => scheduleStore.getScheduleById(scheduleId.value))
const existingResponse = computed(() => scheduleStore.getCurrentUserResponse(scheduleId.value))

const isInitialLoading = computed(
  () =>
    scheduleStore.scheduleDataStatus === 'idle' ||
    (scheduleStore.scheduleDataStatus === 'loading' && !schedule.value),
)

const hasInitialError = computed(
  () => scheduleStore.scheduleDataStatus === 'error' && !schedule.value,
)

const retryScheduleData = async () => {
  const authSuccess = await scheduleStore.initializeAuth()
  if (!authSuccess) return
  await scheduleStore.fetchScheduleData()
}

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

type TravelOption = 'walking' | 'driving' | 'none'

const travelOptions = [
  { value: 'walking', label: '徒歩', icon: 'walking' },
  { value: 'driving', label: '車', icon: 'car' },
  { value: 'none', label: '何でもOK', icon: 'no-condition' },
] as const

const travelOption = ref<TravelOption | null>(null)
const travelTime = ref<number | null>(null)

const departure = ref('')
const departureLocation = ref<{
  lat: number
  lng: number
} | null>(null)

const isResolvingDeparture = ref(false)
const isSearchingDeparture = ref(false)
const isDepartureSearchPending = ref(false)
const departureLocationError = ref('')

let departureSearchTimer: ReturnType<typeof setTimeout> | null = null
let forwardGeocodeController: AbortController | null = null
let reverseGeocodeController: AbortController | null = null

const preferredAreaInput = ref('')
const preferredAreas = ref<string[]>([])
const preferredAreaError = ref('')
const preferredAreaLimit = 5
const isSubmitting = ref(false)
const submitError = ref('')

const isTransitSchedule = computed(() => schedule.value?.transportPolicy === 'transit')

const needsDeparture = computed(
  () =>
    !isTransitSchedule.value &&
    (travelOption.value === 'walking' || travelOption.value === 'driving'),
)

const isMapInteractionDisabled = computed(
  () =>
    !needsDeparture.value ||
    isResolvingDeparture.value ||
    isSearchingDeparture.value ||
    isDepartureSearchPending.value,
)

const departurePlaceholder = computed(() => {
  if (isResolvingDeparture.value) return '地点情報を取得中...'
  if (isSearchingDeparture.value) return '地点を検索中...'
  return '例：東京駅'
})

const travelTimeConfig = computed(() => {
  switch (travelOption.value) {
    case 'walking':
      return { min: 10, max: 60, step: 10, defaultValue: 30 }
    case 'driving':
      return { min: 30, max: 180, step: 30, defaultValue: 60 }
    default:
      return null
  }
})

const travelTimeOptions = computed(() => {
  const config = travelTimeConfig.value
  if (!config) return []

  const values: number[] = []
  for (let value = config.min; value <= config.max; value += config.step) {
    values.push(value)
  }
  return values
})

const travelTimeProgress = computed(() => {
  const config = travelTimeConfig.value
  const value = travelTime.value

  if (!config || value === null || config.max === config.min) {
    return '0%'
  }

  const progress = ((value - config.min) / (config.max - config.min)) * 100

  return `${Math.min(100, Math.max(0, progress))}%`
})

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError'

const clearDepartureSearchTimer = () => {
  if (!departureSearchTimer) return
  clearTimeout(departureSearchTimer)
  departureSearchTimer = null
}

const cancelForwardGeocoding = () => {
  clearDepartureSearchTimer()
  forwardGeocodeController?.abort()
  forwardGeocodeController = null
  isDepartureSearchPending.value = false
  isSearchingDeparture.value = false
}

const cancelReverseGeocoding = () => {
  reverseGeocodeController?.abort()
  reverseGeocodeController = null
  isResolvingDeparture.value = false
}

const cancelAllGeocoding = () => {
  cancelForwardGeocoding()
  cancelReverseGeocoding()
}

const clearDepartureState = () => {
  cancelAllGeocoding()
  departure.value = ''
  departureLocation.value = null
  departureLocationError.value = ''
}

const handleDepartureInput = (value: string) => {
  if (!needsDeparture.value || isResolvingDeparture.value) return

  cancelForwardGeocoding()
  departureLocationError.value = ''
  departureLocation.value = null

  const query = value.trim()
  if (!query) return

  isDepartureSearchPending.value = true

  departureSearchTimer = setTimeout(async () => {
    if (!needsDeparture.value) return

    departureSearchTimer = null
    isDepartureSearchPending.value = false
    forwardGeocodeController = new AbortController()
    const controller = forwardGeocodeController

    isSearchingDeparture.value = true
    departureLocationError.value = ''

    try {
      const location = await forwardGeocode(query, controller.signal)

      if (!needsDeparture.value || controller.signal.aborted) return

      if (!location) {
        departureLocationError.value = '地点を見つけられませんでした。入力内容を確認してください。'
        return
      }

      departureLocation.value = {
        lat: location.lat,
        lng: location.lng,
      }
    } catch (error) {
      if (isAbortError(error)) return

      console.error('出発地点の座標を取得できませんでした。', error)
      departureLocationError.value =
        '地点の検索に失敗しました。時間をおいてもう一度お試しください。'
    } finally {
      if (forwardGeocodeController === controller) {
        forwardGeocodeController = null
        isSearchingDeparture.value = false
      }
    }
  }, 1000)
}

const handleLocationSelected = async (location: { lat: number; lng: number }) => {
  if (!needsDeparture.value || isMapInteractionDisabled.value) return

  cancelForwardGeocoding()
  cancelReverseGeocoding()

  reverseGeocodeController = new AbortController()
  const controller = reverseGeocodeController

  isResolvingDeparture.value = true
  departureLocationError.value = ''
  departure.value = ''

  try {
    const placeName = await reverseGeocode(location.lat, location.lng, controller.signal)

    if (!needsDeparture.value || controller.signal.aborted) return

    if (!placeName) {
      departureLocationError.value =
        'この地点の地名を取得できませんでした。出発地点を入力してください。'
      return
    }

    departure.value = placeName
  } catch (error) {
    if (isAbortError(error)) return

    console.error('出発地点の地名を取得できませんでした。', error)
    departureLocationError.value = '地名の取得に失敗しました。出発地点を入力してください。'
  } finally {
    if (reverseGeocodeController === controller) {
      reverseGeocodeController = null
      isResolvingDeparture.value = false
    }
  }
}

const selectTravelOption = (option: TravelOption) => {
  const wasDepartureMode = needsDeparture.value

  cancelAllGeocoding()
  travelOption.value = option

  if (option === 'walking' || option === 'driving') {
    const config = travelTimeConfig.value
    if (config) {
      const isValidCurrentTime =
        travelTime.value !== null &&
        travelTime.value >= config.min &&
        travelTime.value <= config.max &&
        (travelTime.value - config.min) % config.step === 0

      if (!isValidCurrentTime) {
        travelTime.value = config.defaultValue
      }
    }

    if (!wasDepartureMode) {
      departure.value = ''
      departureLocation.value = null
      departureLocationError.value = ''
    }

    return
  }

  travelTime.value = null
  clearDepartureState()
}

const normalizePreferredArea = (value: string) =>
  value.normalize('NFKC').trim().replace(/\s+/g, ' ')

const addPreferredArea = () => {
  preferredAreaError.value = ''

  if (preferredAreas.value.length >= preferredAreaLimit) {
    preferredAreaError.value = `登録できるのは最大${preferredAreaLimit}つまでです。`
    return
  }

  const value = normalizePreferredArea(preferredAreaInput.value)

  if (!value) {
    preferredAreaError.value = '場所またはジャンルを1つ入力してください。'
    return
  }

  preferredAreas.value.push(value)
  preferredAreaInput.value = ''
}

const removePreferredArea = (index: number) => {
  preferredAreas.value.splice(index, 1)
  preferredAreaError.value = ''
}

onUnmounted(() => {
  cancelAllGeocoding()
})

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
      if (/^\d{4}-\d{2}-\d{2}$/.test(savedDate)) {
        return savedDate
      }

      const [month, day] = savedDate.split('/').map(Number)

      const matchingDate = calendarMonths.value
        .flatMap((calendar) => calendar.days)
        .find((calendarDay) => calendarDay?.label === `${month}/${day}` && calendarDay.selectable)

      return matchingDate?.key ?? savedDate
    })

    selectedActivities.value = [...response.activities]
    travelTime.value = isTransitSchedule.value ? null : response.travelTime
    preferredAreas.value = [...(response.preferredAreas ?? [])]
    preferredAreaInput.value = ''

    if (response.transportMode === 'walking') {
      travelOption.value = 'walking'
    } else if (response.transportMode === 'driving') {
      travelOption.value = 'driving'
    } else if (response.transportMode === null) {
      travelOption.value = 'none'
    } else {
      travelOption.value = null
    }

    if (response.transportMode === 'walking' || response.transportMode === 'driving') {
      departure.value = response.departure
      departureLocation.value = response.departureLocation
    } else {
      departure.value = ''
      departureLocation.value = null
    }

    departureLocationError.value = ''
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

const canSubmit = computed(() => {
  if (
    selectedDates.value.length === 0 ||
    selectedActivities.value.length === 0 ||
    isResolvingDeparture.value ||
    isSearchingDeparture.value ||
    isDepartureSearchPending.value
  ) {
    return false
  }

  if (isTransitSchedule.value) {
    return preferredAreas.value.length >= 1
  }

  if (!travelOption.value) return false

  if (needsDeparture.value) {
    return (
      Boolean(departure.value.trim()) &&
      Boolean(departureLocation.value) &&
      travelTime.value !== null
    )
  }

  return true
})

const submitAnswer = async () => {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const transitSchedule = schedule.value?.transportPolicy === 'transit'
    const selectedFlexibleMode: TransportMode =
      travelOption.value === 'walking' || travelOption.value === 'driving'
        ? travelOption.value
        : null

    const saved = await scheduleStore.submitResponse(scheduleId.value, {
      availableDates: selectedDates.value,
      activities: selectedActivities.value,
      departure: !transitSchedule && needsDeparture.value ? departure.value.trim() : '',
      departureLocation:
        !transitSchedule && needsDeparture.value ? departureLocation.value : null,
      transportMode: transitSchedule ? 'transit' : selectedFlexibleMode,
      travelTime: !transitSchedule && needsDeparture.value ? travelTime.value : null,
      preferredAreas: [...preferredAreas.value],
    })

    if (!saved) {
      submitError.value =
        scheduleStore.scheduleDataError ??
        '回答を保存できませんでした。時間をおいてもう一度お試しください。'
      return
    }

    await router.push({
      name: 'schedule-detail',
      params: {
        id: scheduleId.value,
      },
    })
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>
<template>
  <main class="page condition-input">
    <LoadingState v-if="isInitialLoading" label="予定を読み込んでいます" />

    <div v-else-if="hasInitialError" role="alert">
      <EmptyState
        title="予定を読み込めませんでした"
        :description="scheduleStore.scheduleDataError ?? 'もう一度お試しください。'"
        action-label="再試行"
        @action="retryScheduleData"
      />
    </div>

    <template v-else-if="schedule">
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
            <AppIcon class="condition-input__section-icon" name="calendar" />

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
                <AppIcon name="chevron-left" :size="20" />
              </button>

              <h3>{{ currentCalendar.year }}年{{ currentCalendar.month }}月</h3>

              <button
                type="button"
                class="condition-input__month-button"
                :disabled="!canGoNextMonth"
                aria-label="次の月"
                @click="goNextMonth"
              >
                <AppIcon name="chevron-right" :size="20" />
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
            <AppIcon class="condition-input__section-icon" name="sparkles" />

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

        <!-- どうやって行く？ -->
        <section class="condition-input__section condition-input__section--travel">
          <div class="condition-input__section-heading">
            <AppIcon class="condition-input__section-icon" name="route" />

            <h2>どうやって行く？</h2>
          </div>

          <p v-if="isTransitSchedule">
            この予定では、行きたい場所・ジャンルを投票してください。
          </p>
          <p v-else>まず移動方法を選ぶと、必要な条件だけ表示されます。</p>

          <div
            v-if="isTransitSchedule"
            class="condition-input__travel-message condition-input__travel-message--transit"
          >
            <strong class="condition-input__travel-message-heading">
              <AppIcon name="train" :size="20" />
              この予定は電車で移動します
            </strong>
            <p>移動方法・出発地点・移動時間の入力は必要ありません。</p>
          </div>

          <fieldset v-else class="condition-input__transport">
            <legend class="condition-input__sr-only">移動方法</legend>

            <div class="condition-input__transport-options">
              <label
                v-for="option in travelOptions"
                :key="option.value"
                class="condition-input__transport-option"
                :class="[
                  `condition-input__transport-option--${option.value}`,
                  {
                    'condition-input__transport-option--selected': travelOption === option.value,
                  },
                ]"
              >
                <input
                  class="condition-input__radio"
                  type="radio"
                  name="transport-mode"
                  :value="option.value"
                  :checked="travelOption === option.value"
                  @change="selectTravelOption(option.value)"
                />

                <AppIcon class="condition-input__transport-icon" :name="option.icon" :size="20" />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </fieldset>

          <template v-if="needsDeparture">
            <div class="condition-input__conditional-card condition-input__conditional-card--map">
              <div class="condition-input__conditional-heading">
                <strong>出発地点</strong>
                <span>必須</span>
              </div>

              <p>
                文字で検索するか、地図をタップしてください。検索中はもう片方を操作できないようにしています。
              </p>

              <fieldset
                class="condition-input__departure-fieldset"
                :disabled="isResolvingDeparture"
              >
                <label class="condition-input__text-label" for="departure"> 出発地点 </label>
                <input
                  id="departure"
                  v-model="departure"
                  class="condition-input__text-input"
                  type="text"
                  :placeholder="departurePlaceholder"
                  autocomplete="off"
                  required
                  @input="handleDepartureInput(($event.target as HTMLInputElement).value)"
                />
              </fieldset>

              <MapPicker
                v-model="departureLocation"
                :disabled="isMapInteractionDisabled"
                @location-selected="handleLocationSelected"
              />

              <p v-if="isResolvingDeparture" class="condition-input__status">
                地点情報を取得しています...
              </p>
              <p v-else-if="isDepartureSearchPending" class="condition-input__status">
                入力が終わるのを待っています...
              </p>
              <p v-else-if="isSearchingDeparture" class="condition-input__status">
                地点を検索しています...
              </p>
              <p
                v-else-if="departureLocationError"
                class="condition-input__status condition-input__status--error"
              >
                {{ departureLocationError }}
              </p>
              <p
                v-else-if="departureLocation"
                class="condition-input__status condition-input__status--ok"
              >
                <AppIcon name="check-circle" :size="18" />
                地点を登録できました
              </p>
            </div>

            <div v-if="travelTimeConfig" class="condition-input__travel-slider">
              <div class="condition-input__travel-slider-heading">
                <label for="travel-time">どのくらいまで行ける？</label>
                <strong>{{ travelTime }}分以内</strong>
              </div>

              <input
                id="travel-time"
                v-model.number="travelTime"
                class="condition-input__range"
                type="range"
                :min="travelTimeConfig.min"
                :max="travelTimeConfig.max"
                :step="travelTimeConfig.step"
                :style="{ '--range-progress': travelTimeProgress }"
              />

              <div class="condition-input__range-labels" aria-hidden="true">
                <span v-for="time in travelTimeOptions" :key="time">{{ time }}</span>
              </div>
            </div>
          </template>

          <div
            v-else-if="travelOption === 'none'"
            class="condition-input__travel-message condition-input__travel-message--none"
          >
            <strong class="condition-input__travel-message-heading">
              <AppIcon name="no-condition" :size="20" />
              移動条件はおまかせ
            </strong>
            <p>出発地点や移動時間を指定せず、行きたい候補だけ自由に足せます。</p>
          </div>

          <div v-if="isTransitSchedule || travelOption" class="condition-input__vote-card">
            <div class="condition-input__vote-heading">
              <div>
                <strong>行きたい場所・ジャンル</strong>
                <span v-if="isTransitSchedule" class="condition-input__required">
                  電車は1つ以上必須
                </span>
                <span v-else>任意</span>
              </div>

              <span>{{ preferredAreas.length }}/{{ preferredAreaLimit }}</span>
            </div>

            <p>行きたいところを最大5票まで追加できます。例：横浜 / カフェ / 公園</p>
            <p class="condition-input__vote-note">
              同じ候補を複数入れてOK。そのぶん「行きたい！」票として集計されます。
            </p>

            <div class="condition-input__vote-input-row">
              <input
                v-model="preferredAreaInput"
                class="condition-input__text-input"
                type="text"
                maxlength="40"
                placeholder="例：カフェ"
                :disabled="preferredAreas.length >= preferredAreaLimit"
                @keydown.enter.prevent="addPreferredArea"
              />
              <button
                type="button"
                class="condition-input__add-vote"
                :disabled="preferredAreas.length >= preferredAreaLimit"
                @click="addPreferredArea"
              >
                追加
              </button>
            </div>

            <div v-if="preferredAreas.length" class="condition-input__vote-chips">
              <button
                v-for="(area, index) in preferredAreas"
                :key="`${area}-${index}`"
                type="button"
                class="condition-input__vote-chip"
                :class="`condition-input__vote-chip--${index % 5}`"
                :aria-label="`${area}を削除`"
                @click="removePreferredArea(index)"
              >
                <span>{{ area }}</span>
                <AppIcon name="x" :size="16" />
              </button>
            </div>

            <p
              v-if="preferredAreaError"
              class="condition-input__status condition-input__status--error"
            >
              {{ preferredAreaError }}
            </p>
          </div>
        </section>
        <!-- 回答送信 -->
        <div class="condition-input__submit">
          <p
            v-if="submitError"
            class="condition-input__status condition-input__status--error"
            role="alert"
          >
            {{ submitError }}
          </p>

          <BaseButton
            type="submit"
            :disabled="!canSubmit"
            :loading="isSubmitting"
            loading-label="回答を保存中..."
          >
            回答を送る
          </BaseButton>
        </div>
      </form>
    </template>

    <p v-else-if="scheduleStore.scheduleDataStatus === 'success'">予定が見つかりません。</p>
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

  &__departure-fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;

    &:disabled {
      opacity: 0.72;
      cursor: wait;
    }
  }

  &__transport {
    margin: 0;
    padding: 0;
    border: 0;

    legend {
      margin-bottom: $spacing-1;
      color: $color-text;
      font-weight: $font-weight-semibold;
    }
  }

  &__transport-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $spacing-1;
  }

  &__transport-option {
    display: flex;
    align-items: center;
    gap: 10px;

    min-height: 48px;
    padding: 0 $spacing-2;

    border: 1px solid $color-neutral-300;
    border-radius: $radius-input;
    background: $color-surface;
    color: $color-text;

    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;

    &--selected {
      border-color: $color-primary;
      background: $color-primary-light;
      font-weight: $font-weight-semibold;
    }
  }

  &__travel-slider {
    display: flex;
    flex-direction: column;
    gap: 10px;

    padding: $spacing-2;

    border: 1px solid $color-neutral-300;
    border-radius: $radius-input;
    background: $color-surface;
  }

  &__travel-slider-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-2;

    label {
      color: $color-text;
      font-weight: $font-weight-semibold;
    }

    strong {
      flex-shrink: 0;
      color: $color-primary-dark;
      font-size: $font-size-body;
    }
  }

  &__range {
    appearance: none;
    width: 100%;
    height: 8px;
    margin: 4px 0 0;
    border-radius: $radius-chip;
    background: linear-gradient(
      to right,
      $color-primary 0%,
      $color-primary var(--range-progress),
      $color-neutral-200 var(--range-progress),
      $color-neutral-200 100%
    );
    cursor: pointer;

    &::-webkit-slider-runnable-track {
      height: 8px;
      border-radius: $radius-chip;
      background: transparent;
    }

    &::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      margin-top: -6px;
      border: 2px solid $color-surface;
      border-radius: 50%;
      background: $color-primary;
      box-shadow: 0 1px 4px rgba($color-neutral-900, 0.2);
    }

    &::-moz-range-track {
      height: 8px;
      border-radius: $radius-chip;
      background: transparent;
    }

    &::-moz-range-progress {
      height: 8px;
      border-radius: $radius-chip;
      background: $color-primary;
    }

    &::-moz-range-thumb {
      box-sizing: border-box;
      width: 20px;
      height: 20px;
      border: 2px solid $color-surface;
      border-radius: 50%;
      background: $color-primary;
      box-shadow: 0 1px 4px rgba($color-neutral-900, 0.2);
    }

    &:focus-visible {
      outline: 3px solid $color-primary-light;
      outline-offset: 4px;
    }
  }

  &__range-labels {
    display: flex;
    justify-content: space-between;
    gap: 4px;

    color: $color-neutral-600;
    font-size: 11px;

    span {
      min-width: 16px;
      text-align: center;
    }
  }

  &__travel-none {
    padding: 12px $spacing-2;
    border-radius: $radius-input;
    border: 1px dashed $color-neutral-300;
    background: $color-surface;
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
  &__section--travel {
    padding: $spacing-2;
    border-radius: $radius-card;
    background: linear-gradient(180deg, rgba(255, 248, 252, 0.88), rgba(247, 251, 255, 0.92));
  }

  &__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  &__transport-icon {
    .condition-input__transport-option--walking & {
      color: $color-accent-green-dark;
    }

    .condition-input__transport-option--driving & {
      color: $color-accent-blue-dark;
    }

    .condition-input__transport-option--transit & {
      color: $color-accent-purple-dark;
    }

    .condition-input__transport-option--none & {
      color: $color-accent-yellow-dark;
    }
  }

  &__transport-option--walking.condition-input__transport-option--selected {
    border-color: #7cc9a7;
    background: #eaf8f1;
  }

  &__transport-option--driving.condition-input__transport-option--selected {
    border-color: #80aeea;
    background: #eef5ff;
  }

  &__transport-option--transit.condition-input__transport-option--selected {
    border-color: #c19be7;
    background: #f7efff;
  }

  &__transport-option--none.condition-input__transport-option--selected {
    border-color: #e9b967;
    background: #fff8df;
  }

  &__conditional-card,
  &__vote-card,
  &__travel-message {
    padding: $spacing-2;
    border: 1px solid $color-neutral-300;
    border-radius: $radius-card;
    background: $color-surface;
  }

  &__conditional-card,
  &__vote-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__conditional-card > p {
    margin: 0;
    color: $color-neutral-600;
    font-size: $font-size-caption;
  }

  &__conditional-heading,
  &__vote-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-1;

    > span,
    > div > span {
      color: $color-neutral-600;
      font-size: $font-size-caption;
    }
  }

  &__required {
    display: inline-flex;
    margin-left: 6px;
    padding: 2px 7px;
    border-radius: $radius-chip;
    background: #fce9ef;
    color: #a94e70 !important;
  }

  &__text-label {
    display: block;
    margin-bottom: 6px;
    color: $color-text;
    font-size: $font-size-caption;
    font-weight: $font-weight-semibold;
  }

  &__text-input {
    box-sizing: border-box;
    width: 100%;
    min-height: 46px;
    padding: 0 $spacing-2;
    border: 1px solid $color-neutral-300;
    border-radius: $radius-input;
    background: $color-surface;
    color: $color-text;
    font: inherit;

    &:focus {
      border-color: $color-primary;
      outline: 3px solid $color-primary-light;
      outline-offset: 1px;
    }

    &:disabled {
      background: $color-neutral-100;
      cursor: not-allowed;
    }
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: $font-size-caption;

    &--error {
      color: #b34f63 !important;
    }

    &--ok {
      color: #438d6b !important;
    }
  }

  &__travel-message {
    strong,
    p {
      margin: 0;
    }

    p {
      margin-top: 6px;
      color: $color-neutral-600;
      font-size: $font-size-caption;
    }

    &--transit {
      border-color: #dbc4f2;
      background: #faf5ff;
    }

    &--none {
      border-color: #f0d995;
      background: #fffaf0;
    }
  }

  &__travel-message-heading {
    display: flex;
    align-items: center;
    gap: 8px;

    .condition-input__travel-message--transit & {
      color: $color-accent-purple-dark;
    }

    .condition-input__travel-message--none & {
      color: $color-accent-yellow-dark;
    }
  }

  &__vote-card {
    border-color: #ead8ef;
    background: linear-gradient(135deg, #fff8fb, #f7fbff);
  }

  &__vote-card > p {
    margin: 0;
    color: $color-neutral-600;
    font-size: $font-size-caption;
  }

  &__vote-note {
    padding: 8px 10px;
    border-radius: $radius-input;
    background: #fff5d9;
    color: #775a18 !important;
  }

  &__vote-input-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: $spacing-1;
  }

  &__add-vote {
    min-width: 72px;
    padding: 0 $spacing-2;
    border: 0;
    border-radius: $radius-button;
    background: $color-primary;
    color: $color-neutral-0;
    font: inherit;
    font-weight: $font-weight-semibold;

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  &__vote-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__vote-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 34px;
    padding: 0 12px;
    border: 0;
    border-radius: 999px;
    color: $color-text;
    font: inherit;
    cursor: pointer;

    &--0 {
      background: $color-accent-pink-light;
    }
    &--1 {
      background: $color-accent-green-light;
    }
    &--2 {
      background: $color-accent-blue-light;
    }
    &--3 {
      background: $color-accent-purple-light;
    }
    &--4 {
      background: $color-accent-yellow-light;
    }
  }
}
</style>
