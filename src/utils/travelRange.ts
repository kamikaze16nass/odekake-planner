import type { TransportMode } from '@/types/schedule'

export type TravelRange = {
  id: string
  lat: number
  lng: number
  radiusMeters: number
}

export const calculateTravelRadiusMeters = (
  transportMode: TransportMode,
  travelTime: number | null,
): number | null => {
  if (
    travelTime === null ||
    !Number.isFinite(travelTime) ||
    travelTime <= 0
  ) {
    return null
  }

  const metersPerMinute =
    transportMode === 'walking'
      ? 100
      : transportMode === 'driving'
        ? 500
        : null

  if (metersPerMinute === null) return null

  const radiusMeters = travelTime * metersPerMinute

  return Number.isFinite(radiusMeters) && radiusMeters > 0
    ? radiusMeters
    : null
}
