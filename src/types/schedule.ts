export type ScheduleStatus = 'active' | 'completed'

export type TransportPolicy = 'transit' | 'flexible'

export type Member = {
  id: string
  name: string
}

export type TransportMode =
  | 'walking'
  | 'driving'
  | 'transit'
  | null

export type LocationValue = {
  lat: number
  lng: number
}

export type ScheduleResponse = {
  userId: string
  availableDates: string[]
  activities: string[]

  departure: string
  departureLocation: LocationValue | null

  transportMode: TransportMode
  travelTime: number | null

  preferredAreas?: string[]
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
  transportModes: ResultItem[]
  walkingTravelTimes: ResultItem[]
  drivingTravelTimes: ResultItem[]
  travelTimes: ResultItem[]
}

export type Schedule = {
  id: string

  title: string
  startDate: string
  endDate: string
  memo?: string

  status: ScheduleStatus
  transportPolicy: TransportPolicy

  members: Member[]
  responses: ScheduleResponse[]

  inviteCode: string
}
