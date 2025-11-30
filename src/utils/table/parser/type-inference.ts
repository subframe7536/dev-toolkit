import type { CellValue, DataType } from '../types'

/**
 * Check if a string value represents a date (without time component)
 * Supports common date formats: ISO (YYYY-MM-DD), US (MM/DD/YYYY), EU (DD/MM/YYYY)
 */
function isDateString(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return false
  }

  // ISO date format: YYYY-MM-DD
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
  if (isoDatePattern.test(trimmed)) {
    const date = new Date(trimmed)
    return !Number.isNaN(date.getTime())
  }

  // US date format: MM/DD/YYYY or M/D/YYYY
  const usDatePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/
  if (usDatePattern.test(trimmed)) {
    const date = new Date(trimmed)
    return !Number.isNaN(date.getTime())
  }

  // EU date format: DD/MM/YYYY or D/M/YYYY (need to parse manually)
  const euDatePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/
  const euMatch = trimmed.match(euDatePattern)
  if (euMatch) {
    const day = Number.parseInt(euMatch[1], 10)
    const month = Number.parseInt(euMatch[2], 10)
    const year = Number.parseInt(euMatch[3], 10)

    // Basic validation
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const date = new Date(year, month - 1, day)
      return !Number.isNaN(date.getTime())
    }
  }

  return false
}

/**
 * Check if a string value represents a datetime (with time component)
 * Supports ISO 8601 format and common datetime patterns
 */
function isDateTimeString(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return false
  }

  // ISO 8601 datetime: YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS
  const isoDateTimePattern = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/
  if (isoDateTimePattern.test(trimmed)) {
    const date = new Date(trimmed)
    return !Number.isNaN(date.getTime())
  }

  // Common datetime format: YYYY-MM-DD HH:MM or MM/DD/YYYY HH:MM
  const commonDateTimePattern = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM))?$/i
  if (commonDateTimePattern.test(trimmed)) {
    const date = new Date(trimmed)
    return !Number.isNaN(date.getTime())
  }

  return false
}

/**
 * Infer SQL-compatible data type from an array of cell values
 * Analyzes non-null values to determine the most appropriate type
 *
 * @param values - Array of cell values from a column
 * @returns Inferred DataType
 */
export function inferDataType(values: CellValue[]): DataType {
  // Remove null values for analysis
  const nonNullValues = values.filter(v => v !== null)

  // If all values are null or empty, default to string
  if (nonNullValues.length === 0) {
    return 'string'
  }

  // Check if all values are integers
  const allIntegers = nonNullValues.every((v) => {
    if (typeof v === 'number') {
      return Number.isInteger(v)
    }
    if (typeof v === 'string') {
      const trimmed = v.trim()
      // Check if string represents an integer
      return /^-?\d+$/.test(trimmed) && Number.isInteger(Number(trimmed))
    }
    return false
  })

  if (allIntegers) {
    return 'integer'
  }

  // Check if all values are numbers (including decimals)
  const allNumbers = nonNullValues.every((v) => {
    if (typeof v === 'number') {
      return !Number.isNaN(v) && Number.isFinite(v)
    }
    if (typeof v === 'string') {
      const trimmed = v.trim()
      // Check if string represents a number (including decimals)
      const num = Number(trimmed)
      return !Number.isNaN(num) && Number.isFinite(num) && /^-?\d+(?:\.\d+)?$/.test(trimmed)
    }
    return false
  })

  if (allNumbers) {
    return 'decimal'
  }

  // Check if all values are booleans
  const allBooleans = nonNullValues.every((v) => {
    if (typeof v === 'boolean') {
      return true
    }
    if (typeof v === 'string') {
      const lower = v.trim().toLowerCase()
      return lower === 'true' || lower === 'false' || lower === '1' || lower === '0'
    }
    if (typeof v === 'number') {
      return v === 0 || v === 1
    }
    return false
  })

  if (allBooleans) {
    return 'boolean'
  }

  // Check for datetime patterns (must check before date patterns)
  const allDateTimes = nonNullValues.every(v => isDateTimeString(v))
  if (allDateTimes) {
    return 'datetime'
  }

  // Check for date patterns
  const allDates = nonNullValues.every(v => isDateString(v))
  if (allDates) {
    return 'date'
  }

  // Default to string
  return 'string'
}
