const parseDateParts = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return null

  return { year, month, day }
}

const formatDateParts = (
  value: string,
  includeYear: boolean,
) => {
  const parts = parseDateParts(value)

  if (!parts) return value

  const month = String(parts.month).padStart(2, '0')
  const day = String(parts.day).padStart(2, '0')

  return includeYear
    ? `${parts.year}/${month}/${day}`
    : `${month}/${day}`
}

export const formatSchedulePeriod = (
  startDate: string,
  endDate: string,
) => {
  const start = parseDateParts(startDate)
  const end = parseDateParts(endDate)
  const crossesYear = Boolean(start && end && start.year !== end.year)

  return `${formatDateParts(startDate, crossesYear)} 〜 ${formatDateParts(endDate, crossesYear)}`
}
