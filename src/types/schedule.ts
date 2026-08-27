export type ScheduleStatus = 'active' | 'completed'

export type Member = {
  id: string
  name: string
}

export type ScheduleResponse = {
  userId: string
  availableDates: string[]
  activities: string[]
  departure: string
  travelTime: string
  preferredArea?: string
}

export type ResultItem = {
  label: string
  count: number
}

export type ScheduleResult = {
  summary: {
    date: string
    activity: string
    area: string
  }

  dates: ResultItem[]
  activities: ResultItem[]
  areas: ResultItem[]
}

export type Schedule = {
  id: string

  title: string
  startDate: string
  endDate: string
  memo?: string

  status: ScheduleStatus

  members: Member[]
  responses: ScheduleResponse[]

  inviteCode: string
}