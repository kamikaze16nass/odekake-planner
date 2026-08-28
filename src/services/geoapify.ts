type GeoapifyReverseResult = {
  name?: string
  address_line1?: string
  formatted?: string
}

type GeoapifyReverseResponse = {
  results?: GeoapifyReverseResult[]
}

type GeoapifyForwardResult = {
  lat?: number
  lon?: number
  formatted?: string
}

type GeoapifyForwardResponse = {
  results?: GeoapifyForwardResult[]
}

export type GeocodedLocation = {
  lat: number
  lng: number
}

const apiKey =
  import.meta.env.VITE_GEOAPIFY_API_KEY

const assertApiKey = () => {
  if (!apiKey) {
    throw new Error(
      'VITE_GEOAPIFY_API_KEY が設定されていません。',
    )
  }
}

export const reverseGeocode = async (
  lat: number,
  lng: number,
  signal?: AbortSignal,
) => {
  assertApiKey()

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    lang: 'ja',
    format: 'json',
    apiKey,
  })

  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?${params.toString()}`,
    {
      signal,
    },
  )

  if (!response.ok) {
    throw new Error(
      `Geoapify API error: ${response.status}`,
    )
  }

  const data =
    (await response.json()) as GeoapifyReverseResponse

  const result = data.results?.[0]

  if (!result) {
    return null
  }

  return (
    result.name?.trim() ||
    result.address_line1?.trim() ||
    result.formatted?.trim() ||
    null
  )
}

export const forwardGeocode = async (
  text: string,
  signal?: AbortSignal,
): Promise<GeocodedLocation | null> => {
  assertApiKey()

  const params = new URLSearchParams({
    text,
    lang: 'ja',
    format: 'json',
    limit: '1',
    apiKey,
  })

  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/search?${params.toString()}`,
    {
      signal,
    },
  )

  if (!response.ok) {
    throw new Error(
      `Geoapify API error: ${response.status}`,
    )
  }

  const data =
    (await response.json()) as GeoapifyForwardResponse

  const result = data.results?.[0]

  if (
    !result ||
    typeof result.lat !== 'number' ||
    typeof result.lon !== 'number'
  ) {
    return null
  }

  return {
    lat: result.lat,
    lng: result.lon,
  }
}
