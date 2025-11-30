/**
 * DateTime utility functions using Intl API
 */

export interface DateTimeFormat {
  locale: string
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  timeStyle?: 'full' | 'long' | 'medium' | 'short'
  timeZone?: string
}

export interface DateTimeManipulation {
  years?: number
  months?: number
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
}

/**
 * Format date using Intl.DateTimeFormat
 */
export function formatDateTime(
  date: Date,
  options: DateTimeFormat,
): string {
  const { locale, dateStyle, timeStyle, timeZone } = options

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    timeZone,
  })

  return formatter.format(date)
}

/**
 * Format date with custom pattern using Intl
 */
export function formatDateTimeCustom(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const formatter = new Intl.DateTimeFormat(locale, options)
  return formatter.format(date)
}

/**
 * Parse manipulation string like "+1h", "-2m", "+3s"
 */
export function parseManipulation(input: string): DateTimeManipulation {
  const result: DateTimeManipulation = {}

  // Match patterns like +1h, -2m, +3s, +1y, +1M, +1d
  const regex = /([+-]?\d+)([yMdhms])/g
  let match: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(input)) !== null) {
    const value = Number.parseInt(match[1], 10)
    const unit = match[2]

    switch (unit) {
      case 'y':
        result.years = (result.years || 0) + value
        break
      case 'M':
        result.months = (result.months || 0) + value
        break
      case 'd':
        result.days = (result.days || 0) + value
        break
      case 'h':
        result.hours = (result.hours || 0) + value
        break
      case 'm':
        result.minutes = (result.minutes || 0) + value
        break
      case 's':
        result.seconds = (result.seconds || 0) + value
        break
    }
  }

  return result
}

/**
 * Manipulate date by adding/subtracting time units
 */
export function manipulateDateTime(
  date: Date,
  manipulation: DateTimeManipulation,
): Date {
  const result = new Date(date)

  if (manipulation.years) {
    result.setFullYear(result.getFullYear() + manipulation.years)
  }
  if (manipulation.months) {
    result.setMonth(result.getMonth() + manipulation.months)
  }
  if (manipulation.days) {
    result.setDate(result.getDate() + manipulation.days)
  }
  if (manipulation.hours) {
    result.setHours(result.getHours() + manipulation.hours)
  }
  if (manipulation.minutes) {
    result.setMinutes(result.getMinutes() + manipulation.minutes)
  }
  if (manipulation.seconds) {
    result.setSeconds(result.getSeconds() + manipulation.seconds)
  }

  return result
}

/**
 * Manipulate date using string notation
 */
export function manipulateDateTimeString(
  date: Date,
  manipulationString: string,
): Date {
  const manipulation = parseManipulation(manipulationString)
  return manipulateDateTime(date, manipulation)
}

/**
 * Get available time zones
 */
export const commonTimeZones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
]

/**
 * Get ISO 8601 string
 */
export function toISOString(date: Date): string {
  return date.toISOString()
}

/**
 * Get Unix timestamp (seconds)
 */
export function toUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

/**
 * Get Unix timestamp (milliseconds)
 */
export function toUnixTimestampMs(date: Date): number {
  return date.getTime()
}

/**
 * Format date with custom pattern
 */
export function formatWithPattern(date: Date, pattern: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')

  return pattern
    .replace(/yyyy/g, String(year))
    .replace(/MM/g, month)
    .replace(/dd/g, day)
    .replace(/HH/g, hours)
    .replace(/hh/g, hours)
    .replace(/mm/g, minutes)
    .replace(/ss/g, seconds)
    .replace(/SSS/g, milliseconds)
}

/**
 * Parse date from various formats including custom patterns
 */
export function parseDate(input: string): Date | null {
  // Try ISO string
  const isoDate = new Date(input)
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate
  }

  // Try Unix timestamp (seconds)
  const unixSeconds = Number.parseInt(input, 10)
  if (!Number.isNaN(unixSeconds) && input.length === 10) {
    return new Date(unixSeconds * 1000)
  }

  // Try Unix timestamp (milliseconds)
  const unixMs = Number.parseInt(input, 10)
  if (!Number.isNaN(unixMs) && input.length === 13) {
    return new Date(unixMs)
  }

  // Try common patterns like yyyy-MM-dd hh:mm:ss
  const patterns = [
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/, // yyyy-MM-dd hh:mm:ss
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/, // yyyy-MM-ddThh:mm:ss
    /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/, // yyyy/MM/dd hh:mm:ss
  ]

  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) {
      const [, year, month, day, hours, minutes, seconds] = match
      const date = new Date(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10) - 1,
        Number.parseInt(day, 10),
        Number.parseInt(hours, 10),
        Number.parseInt(minutes, 10),
        Number.parseInt(seconds, 10),
      )
      if (!Number.isNaN(date.getTime())) {
        return date
      }
    }
  }

  return null
}
