import { defineStore } from 'pinia'

import { signInAnonymously } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

import type {
  ResultItem,
  Schedule,
  ScheduleResponse,
  ScheduleResult,
} from '@/types/schedule'

type ScheduleState = {
  currentUserId: string | null
  displayName: string
  schedules: Schedule[]
  authInitialized: boolean
  authError: string | null
}


type ScheduleRow = {
  id: string
  title: string
  start_date: string
  end_date: string
  memo: string | null
  status: 'active' | 'completed'
  invite_code: string
  created_by: string
  created_at: string
}

type MemberRow = {
  id: string
  schedule_id: string
  user_id: string
  name: string
  created_at: string
}

type ResponseRow = {
  id: string
  schedule_id: string
  user_id: string
  available_dates: string[]
  activities: string[]
  departure: string
  travel_time: string
  preferred_area: string | null
  created_at: string
  updated_at: string
}






// ========================================
// Store
// ========================================

export const useScheduleStore =
  defineStore('schedule', {
    state: (): ScheduleState => ({
      currentUserId: null,
      displayName: localStorage.getItem('displayName') ?? '',
      schedules: [],
      authInitialized: false,
      authError: null,
    }),

    getters: {
      // ========================================
      // 認証
      // ========================================

      isAuthenticated(state) {
        return Boolean(
          state.currentUserId,
        )
      },

      hasDisplayName(state) {
        return Boolean(
          state.displayName.trim(),
        )
      },

      // ========================================
      // 予定取得
      // ========================================

      getScheduleById:
        (state) =>
          (id: string) => {
            return state.schedules.find(
              (schedule) =>
                schedule.id === id,
            )
          },

      getScheduleByInviteCode:
        (state) =>
          (inviteCode: string) => {
            const normalizedCode =
              inviteCode
                .trim()
                .toUpperCase()

            return state.schedules.find(
              (schedule) =>
                schedule.inviteCode.toUpperCase() ===
                normalizedCode,
            )
          },

      // ========================================
      // 予定一覧
      // ========================================

      activeSchedules(state) {
        if (!state.currentUserId) {
          return []
        }

        return state.schedules.filter(
          (schedule) =>
            schedule.status ===
            'active' &&
            schedule.members.some(
              (member) =>
                member.id ===
                state.currentUserId,
            ),
        )
      },

      // ========================================
      // 回答状態
      // ========================================

      getResponseCount:
        (state) =>
          (scheduleId: string) => {
            const schedule =
              state.schedules.find(
                (item) =>
                  item.id === scheduleId,
              )

            return (
              schedule?.responses.length ??
              0
            )
          },

      getCurrentUserResponse:
        (state) =>
          (scheduleId: string) => {
            if (!state.currentUserId) {
              return undefined
            }

            const schedule =
              state.schedules.find(
                (item) =>
                  item.id === scheduleId,
              )

            return schedule?.responses.find(
              (response) =>
                response.userId ===
                state.currentUserId,
            )
          },

      hasCurrentUserAnswered:
        (state) =>
          (scheduleId: string) => {
            if (!state.currentUserId) {
              return false
            }

            const schedule =
              state.schedules.find(
                (item) =>
                  item.id === scheduleId,
              )

            return Boolean(
              schedule?.responses.some(
                (response) =>
                  response.userId ===
                  state.currentUserId,
              ),
            )
          },

      isAllAnswered:
        (state) =>
          (scheduleId: string) => {
            const schedule =
              state.schedules.find(
                (item) =>
                  item.id === scheduleId,
              )

            if (!schedule) {
              return false
            }

            return (
              schedule.members.length >
              0 &&
              schedule.responses.length ===
              schedule.members.length
            )
          },

      // ========================================
      // ホーム通知
      // ========================================

      unansweredSchedules(state) {
        if (!state.currentUserId) {
          return []
        }

        return state.schedules.filter(
          (schedule) => {
            if (
              schedule.status !==
              'active'
            ) {
              return false
            }

            const isMember =
              schedule.members.some(
                (member) =>
                  member.id ===
                  state.currentUserId,
              )

            if (!isMember) {
              return false
            }

            return !schedule.responses.some(
              (response) =>
                response.userId ===
                state.currentUserId,
            )
          },
        )
      },

      allAnsweredSchedules(state) {
        if (!state.currentUserId) {
          return []
        }

        return state.schedules.filter(
          (schedule) => {
            const isMember =
              schedule.members.some(
                (member) =>
                  member.id ===
                  state.currentUserId,
              )

            if (!isMember) {
              return false
            }

            return (
              schedule.members.length >
              0 &&
              schedule.responses.length ===
              schedule.members.length
            )
          },
        )
      },

      // ========================================
      // 集計結果
      // ========================================

      getResultByScheduleId:
        (state) =>
          (
            scheduleId: string,
          ):
            | ScheduleResult
            | undefined => {
            const schedule =
              state.schedules.find(
                (item) =>
                  item.id === scheduleId,
              )

            if (!schedule) {
              return undefined
            }

            const responses =
              schedule.responses

            const countValues = (
              values: string[],
            ): ResultItem[] => {
              const counts =
                new Map<
                  string,
                  number
                >()

              values.forEach((value) => {
                counts.set(
                  value,
                  (counts.get(value) ??
                    0) + 1,
                )
              })

              return Array.from(
                counts.entries(),
              )
                .map(
                  ([
                    label,
                    count,
                  ]) => ({
                    label,
                    count,
                  }),
                )
                .sort(
                  (a, b) =>
                    b.count - a.count,
                )
            }

            const dates = countValues(
              responses.flatMap(
                (response) =>
                  response.availableDates,
              ),
            )

            const activityCandidates =
              Array.from(
                new Set(
                  responses.flatMap(
                    (response) =>
                      response.activities.filter(
                        (activity) =>
                          activity !==
                          '何でもOK',
                      ),
                  ),
                ),
              )

            const activities: ResultItem[] =
              activityCandidates
                .map((activity) => {
                  const count =
                    responses.filter(
                      (response) =>
                        response.activities.includes(
                          activity,
                        ) ||
                        response.activities.includes(
                          '何でもOK',
                        ),
                    ).length

                  return {
                    label: activity,
                    count,
                  }
                })
                .sort(
                  (a, b) =>
                    b.count - a.count,
                )

            if (
              activities.length === 0 &&
              responses.some(
                (response) =>
                  response.activities.includes(
                    '何でもOK',
                  ),
              )
            ) {
              activities.push({
                label: '何でもOK',
                count:
                  responses.length,
              })
            }

            const areas = countValues(
              responses
                .map(
                  (response) =>
                    response.preferredArea,
                )
                .filter(
                  (
                    area,
                  ): area is string =>
                    Boolean(area),
                ),
            )

            return {
              summary: {
                date:
                  dates[0]?.label ??
                  '未集計',

                activity:
                  activities[0]
                    ?.label ??
                  '未集計',

                area:
                  areas[0]?.label ??
                  '未集計',
              },

              dates,
              activities,
              areas,
            }
          },
    },

    actions: {
      // ========================================
      // 表示名
      // ========================================

      setDisplayName(name: string) {
        const normalizedName = name.trim()

        if (!normalizedName) {
          return false
        }

        this.displayName = normalizedName
        localStorage.setItem(
          'displayName',
          normalizedName,
        )

        return true
      },

      // ========================================
      // Supabase Auth 初期化
      // ========================================

      async initializeAuth() {
        if (this.authInitialized) {
          return true
        }

        this.authError = null

        try {
          const user =
            await signInAnonymously()

          if (!user) {
            this.authError =
              'ユーザー認証に失敗しました。'

            this.authInitialized =
              true

            return false
          }

          const supabaseUserId =
            user.id



          this.currentUserId =
            supabaseUserId

          this.authInitialized = true

          return true
        } catch (error) {
          console.error(
            'Supabase認証の初期化に失敗しました。',
            error,
          )

          this.authError =
            'ユーザー認証に失敗しました。'

          this.authInitialized = true

          return false
        }
      },

      // ========================================
      // Supabase：予定取得
      // ========================================

      async fetchSchedulesFromSupabase() {
        const {
          data,
          error,
        } = await supabase
          .from('schedules')
          .select('*')

        if (error) {
          console.error(
            '予定データの取得に失敗しました。',
            error,
          )

          return []
        }


        return data as ScheduleRow[]
      },

      // ========================================
      // Supabase：参加者取得
      // ========================================

      async fetchMembersFromSupabase() {
        const {
          data,
          error,
        } = await supabase
          .from('members')
          .select('*')

        if (error) {
          console.error(
            '参加者データの取得に失敗しました。',
            error,
          )

          return []
        }

        return data as MemberRow[]
      },

      // ========================================
      // Supabase：回答取得
      // ========================================

      async fetchResponsesFromSupabase() {
        const {
          data,
          error,
        } = await supabase
          .from('responses')
          .select('*')

        if (error) {
          console.error(
            '回答データの取得に失敗しました。',
            error,
          )

          return []
        }


        return data as ResponseRow[]
      },

      // ========================================
      // Supabase：
      // 3テーブルをSchedule[]へ変換
      // ========================================

      async fetchScheduleData() {
        const [
          scheduleRows,
          memberRows,
          responseRows,
        ] = await Promise.all([
          this.fetchSchedulesFromSupabase(),
          this.fetchMembersFromSupabase(),
          this.fetchResponsesFromSupabase(),
        ])

        const schedules: Schedule[] =
          scheduleRows.map(
            (scheduleRow) => {
              const members =
                memberRows
                  .filter(
                    (memberRow) =>
                      memberRow.schedule_id ===
                      scheduleRow.id,
                  )
                  .map(
                    (memberRow) => ({
                      id:
                        memberRow.user_id,

                      name:
                        memberRow.name,
                    }),
                  )

              const responses:
                ScheduleResponse[] =
                responseRows
                  .filter(
                    (responseRow) =>
                      responseRow.schedule_id ===
                      scheduleRow.id,
                  )
                  .map(
                    (responseRow) => ({
                      userId:
                        responseRow.user_id,

                      availableDates:
                        responseRow.available_dates ??
                        [],

                      activities:
                        responseRow.activities ??
                        [],

                      departure:
                        responseRow.departure,

                      travelTime:
                        responseRow.travel_time,

                      preferredArea:
                        responseRow.preferred_area ??
                        undefined,
                    }),
                  )

              const schedule: Schedule = {
                id:
                  scheduleRow.id,

                title:
                  scheduleRow.title,

                startDate:
                  scheduleRow.start_date,

                endDate:
                  scheduleRow.end_date,

                memo:
                  scheduleRow.memo ??
                  undefined,

                status:
                  scheduleRow.status,

                members,
                responses,

                inviteCode:
                  scheduleRow.invite_code,
              }

              return schedule
            },
          )


        this.schedules = schedules

        return schedules
      },

      // ========================================
      // 招待コードから予定を検索
      // ========================================

      async findScheduleByInviteCode(
        inviteCode: string,
      ) {
        const normalizedCode =
          inviteCode.trim().toUpperCase()

        const {
          data,
          error,
        } = await supabase.rpc(
          'find_schedule_by_invite_code',
          {
            input_invite_code:
              normalizedCode,
          },
        )

        if (error) {
          console.error(
            '招待コードから予定を取得できませんでした。',
            error,
          )

          return null
        }

        if (!data || data.length === 0) {
          return null
        }

        return data[0] as ScheduleRow
      },

      // ========================================
      // 予定に参加
      // ========================================

      async joinSchedule(
        scheduleId: string,
      ) {
        const currentUserId =
          this.currentUserId

        const memberName =
          this.displayName.trim()

        if (!currentUserId) {
          console.error(
            '認証完了前に予定へ参加しようとしました。',
          )

          return false
        }

        if (!memberName) {
          console.error(
            '表示名が設定されていません。',
          )

          return false
        }

        const {
          error,
        } = await supabase
          .from('members')
          .upsert(
            {
              schedule_id: scheduleId,
              user_id: currentUserId,
              name: memberName,
            },
            {
              onConflict:
                'schedule_id,user_id',
            },
          )

        if (error) {
          console.error(
            '予定への参加に失敗しました。',
            error,
          )

          return false
        }

        await this.fetchScheduleData()

        return true
      },

      // ========================================
      // 回答を登録・更新
      // ========================================

      async submitResponse(
        scheduleId: string,
        response: Omit<
          ScheduleResponse,
          'userId'
        >,
      ) {
        const currentUserId =
          this.currentUserId

        if (!currentUserId) {
          console.error(
            '認証完了前に回答を保存しようとしました。',
          )

          return false
        }

        // まず、この予定の参加者になっていることを保証
        const joined =
          await this.joinSchedule(scheduleId)

        if (!joined) {
          console.error(
            '予定への参加処理に失敗したため、回答を保存できませんでした。',
          )

          return false
        }

        const {
          error,
        } = await supabase
          .from('responses')
          .upsert(
            {
              schedule_id: scheduleId,
              user_id: currentUserId,

              available_dates:
                response.availableDates,

              activities:
                response.activities,

              departure:
                response.departure,

              travel_time:
                response.travelTime,

              preferred_area:
                response.preferredArea ??
                null,
            },
            {
              onConflict:
                'schedule_id,user_id',
            },
          )

        if (error) {
          console.error(
            '回答の保存に失敗しました。',
            error,
          )

          return false
        }

        // DBに保存された最新状態を画面へ反映
        await this.fetchScheduleData()

        return true
      },

      // ========================================
      // 予定作成
      // ========================================

      async createSchedule(input: {
        title: string
        startDate: string
        endDate: string
        memo?: string
      }) {
        const currentUserId =
          this.currentUserId

        const memberName =
          this.displayName.trim()

        if (!currentUserId) {
          throw new Error(
            '認証完了前に予定を作成することはできません。',
          )
        }

        if (!memberName) {
          throw new Error(
            '表示名が設定されていません。',
          )
        }

        const inviteCode =
          Math.random()
            .toString(36)
            .slice(2, 10)
            .toUpperCase()

        const {
          data: scheduleData,
          error: scheduleError,
        } = await supabase
          .from('schedules')
          .insert({
            title: input.title,
            start_date: input.startDate,
            end_date: input.endDate,
            memo: input.memo ?? null,
            status: 'active',
            invite_code: inviteCode,
            created_by: currentUserId,
          })
          .select()
          .single()

        if (scheduleError) {
          console.error(
            '予定の作成に失敗しました。',
            scheduleError,
          )

          throw scheduleError
        }

        const scheduleId =
          scheduleData.id as string

        const {
          error: memberError,
        } = await supabase
          .from('members')
          .insert({
            schedule_id: scheduleId,
            user_id: currentUserId,
            name: memberName,
          })

        if (memberError) {
          console.error(
            '作成者の参加登録に失敗しました。',
            memberError,
          )

          throw memberError
        }

        await this.fetchScheduleData()

        return scheduleId
      },

    },
  })