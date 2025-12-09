/**
 * JSON Formatter Utilities
 * Provides functions for formatting, minifying, and sorting JSON data
 */

import { jsonrepair } from 'jsonrepair'

export interface JSONError {
  message: string
  line?: number
  column?: number
}

export interface FormatOptions {
  indent?: number
  sortKeys?: boolean
}

/**
 * Format JSON with proper indentation
 * @param input - JSON string to format
 * @param options - Formatting options
 * @returns Formatted JSON string
 * @throws JSONError with line/column information for invalid JSON
 */
export function formatJSON(input: string, options: FormatOptions = {}): string {
  const { indent = 2, sortKeys = false } = options

  try {
    const parsed = JSON.parse(input)
    const formatted = sortKeys
      ? JSON.stringify(sortObjectKeys(parsed), null, indent)
      : JSON.stringify(parsed, null, indent)
    return formatted
  } catch (error) {
    throw parseJSONError(error, input)
  }
}

/**
 * Minify JSON by removing all unnecessary whitespace
 * @param input - JSON string to minify
 * @returns Minified JSON string
 * @throws JSONError with line/column information for invalid JSON
 */
export function minifyJSON(input: string): string {
  try {
    const parsed = JSON.parse(input)
    return JSON.stringify(parsed)
  } catch (error) {
    throw parseJSONError(error, input)
  }
}

/**
 * Sort all object keys alphabetically (recursive)
 * @param input - JSON string to sort
 * @param indent - Number of spaces for indentation
 * @returns JSON string with sorted keys
 * @throws JSONError with line/column information for invalid JSON
 */
export function sortKeys(input: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(input)
    const sorted = sortObjectKeys(parsed)
    return JSON.stringify(sorted, null, indent)
  } catch (error) {
    throw parseJSONError(error, input)
  }
}

/**
 * Recursively sort object keys alphabetically
 * @param obj - Object to sort
 * @returns Object with sorted keys
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }

  const sorted: Record<string, any> = {}
  const keys = Object.keys(obj).sort()

  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key])
  }

  return sorted
}

/**
 * Parse JSON error and extract line/column information
 * @param error - Error from JSON.parse
 * @param input - Original input string
 * @returns JSONError with detailed information
 */
function parseJSONError(error: unknown, input: string): JSONError {
  if (!(error instanceof SyntaxError)) {
    return {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }

  const message = error.message

  // Try to extract position from error message
  // Chrome: "Unexpected token } in JSON at position 42"
  // Firefox: "JSON.parse: unexpected character at line 2 column 3"
  const positionMatch = message.match(/position (\d+)/)
  const lineColMatch = message.match(/line (\d+) column (\d+)/)

  if (lineColMatch) {
    return {
      message,
      line: Number.parseInt(lineColMatch[1], 10),
      column: Number.parseInt(lineColMatch[2], 10),
    }
  }

  if (positionMatch) {
    const position = Number.parseInt(positionMatch[1], 10)
    const { line, column } = getLineAndColumn(input, position)
    return {
      message,
      line,
      column,
    }
  }

  return {
    message,
  }
}

/**
 * Convert character position to line and column numbers
 * @param input - Input string
 * @param position - Character position
 * @returns Line and column numbers (1-indexed)
 */
function getLineAndColumn(input: string, position: number): { line: number, column: number } {
  const lines = input.substring(0, position).split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}

/**
 * Validate if a string is valid JSON
 * @param input - String to validate
 * @returns true if valid JSON, false otherwise
 */
export function isValidJSON(input: string): boolean {
  try {
    JSON.parse(input)
    return true
  } catch {
    return false
  }
}

/**
 * Repair malformed JSON string using jsonrepair
 * @param input - JSON string to repair
 * @returns Repaired JSON string
 * @throws JSONError if repair fails or input cannot be parsed
 */
export function repairJSON(input: string): string {
  try {
    // First check if it's already valid
    if (isValidJSON(input)) {
      return input
    }

    // Attempt to repair
    const repaired = jsonrepair(input)

    // Validate the repaired result
    JSON.parse(repaired)
    return repaired
  } catch (error) {
    throw parseJSONError(error, input)
  }
}

/**
 * Recursively parse nested serialized JSON strings
 * @param obj - Object to process
 * @returns Object with all nested JSON strings parsed
 */
function parseNestedJSON(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(parseNestedJSON)
  }

  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string'
      && value.trim().length > 0
      && ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}')))
    ) {
      // Try to parse string as JSON
      try {
        const parsed = JSON.parse(value)
        // Recursively parse nested JSON
        result[key] = parseNestedJSON(parsed)
      } catch {
        // Not a JSON string, keep original value
        result[key] = value
      }
    } else {
      result[key] = parseNestedJSON(value)
    }
  }

  return result
}

/**
 * Format JSON with nested serialized JSON strings parsed
 * @param input - JSON string to format
 * @param options - Formatting options
 * @returns Formatted JSON string with nested JSON parsed
 * @throws JSONError with line/column information for invalid JSON
 */
export function formatJSONWithNested(input: string, options: FormatOptions = {}): string {
  const { indent = 2, sortKeys = false } = options

  try {
    const parsed = JSON.parse(input)
    const withNestedParsed = parseNestedJSON(parsed)
    const formatted = sortKeys
      ? JSON.stringify(sortObjectKeys(withNestedParsed), null, indent)
      : JSON.stringify(withNestedParsed, null, indent)
    return formatted
  } catch (error) {
    throw parseJSONError(error, input)
  }
}
