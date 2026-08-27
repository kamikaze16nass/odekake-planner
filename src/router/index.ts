import {
  createRouter,
  createWebHistory,
} from 'vue-router'

// @ts-ignore
import HomeView from '@/views/HomeView.vue'
// @ts-ignore
import ScheduleListView from '@/views/ScheduleListView.vue'
// @ts-ignore
import ScheduleCreateView from '@/views/ScheduleCreateView.vue'
// @ts-ignore
import ConditionInputView from '@/views/ConditionInputView.vue'
// @ts-ignore
import ScheduleDetailView from '@/views/ScheduleDetailView.vue'
// @ts-ignore
import ResultView from '@/views/ResultView.vue'
// @ts-ignore
import InviteView from '@/views/InviteView.vue'

import { useScheduleStore } from '@/stores/schedule'

const router = createRouter({
  history: createWebHistory(
    import.meta.env.BASE_URL,
  ),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },

    {
      path: '/schedules',
      name: 'schedule-list',
      component: ScheduleListView,
    },

    {
      path: '/schedules/create',
      name: 'schedule-create',
      component: ScheduleCreateView,
    },

    {
      path: '/schedules/:id/condition',
      name: 'condition-input',
      component: ConditionInputView,
    },

    {
      path: '/schedules/:id',
      name: 'schedule-detail',
      component: ScheduleDetailView,
    },

    {
      path: '/schedules/:id/result',
      name: 'result',
      component: ResultView,
    },

    {
      path: '/schedules/:id/invite',
      name: 'invite',
      component: InviteView,
    },

    // ========================================
    // 招待URL
    // ========================================
    {
      path: '/join/:inviteCode',
      name: 'join',
      component: HomeView,

      beforeEnter: async (to) => {
        const scheduleStore =
          useScheduleStore()

        const inviteCode = String(
          to.params.inviteCode,
        )

        const authSuccess =
          await scheduleStore.initializeAuth()

        if (!authSuccess) {
          return {
            name: 'home',
          }
        }

        const schedule =
          await scheduleStore.findScheduleByInviteCode(
            inviteCode,
          )

        if (!schedule) {
          return {
            name: 'home',
            query: {
              inviteError: 'not-found',
            },
          }
        }

        const joined =
          await scheduleStore.joinSchedule(
            schedule.id,
          )

        if (!joined) {
          return {
            name: 'home',
            query: {
              inviteError: 'join-failed',
            },
          }
        }

        return {
          name: 'condition-input',
          params: {
            id: schedule.id,
          },
        }
      },
    },
    // ========================================
    // 存在しないURL
    // ========================================

    {
      path: '/:pathMatch(.*)*',
      redirect: {
        name: 'home',
      },
    },
  ],
})

export default router