import type { CellValue, DataType } from '../types'

/**
 * Infer SQL-compatible data type from an array of cell values
 * Analyzes non-null values to determine the most appropriate type
 *
 * @param values - Array of cell values from a column
 * @returns Inferred DataType
 */
export function inferDataType(values: CellValue[]): DataType {
  // Filter out nulls and empty strings for type inference
  const nonEmptyValues = values.filter(v =>
    v !== null
    && (typeof v !== 'string' || v.trim() !== ''),
  )

  // If all values are empty/null, default to string
  if (nonEmptyValues.length === 0) {
    return 'string'
  }

  // Check if all values are integers
  const allIntegers = nonEmptyValues.every((v) => {
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
  const allNumbers = nonEmptyValues.every((v) => {
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
  const allBooleans = nonEmptyValues.every((v) => {
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

  // Default to string
  return 'string'
}
