/**
 * JSON Import/Export Utilities
 * Provides functions for converting JSON to/from various formats
 */

import * as yaml from 'js-yaml'
import Papa from 'papaparse'

export interface ConversionError {
  message: string
  details?: string
}

export interface ConversionResult {
  success: boolean
  output?: string
  error?: ConversionError
}

/**
 * Convert JSON to CSV format
 * @param input - JSON string to convert
 * @returns ConversionResult with CSV output or error
 */
export function jsonToCSV(input: string): ConversionResult {
  try {
    const parsed = JSON.parse(input)

    // Handle array of objects
    if (Array.isArray(parsed) && parsed.length > 0) {
      const csv = Papa.unparse(parsed)
      return { success: true, output: csv }
    }

    // Handle single object - convert to array with one item
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const csv = Papa.unparse([parsed])
      return { success: true, output: csv }
    }

    return {
      success: false,
      error: {
        message: 'Invalid data format',
        details: 'JSON must be an object or array of objects to convert to CSV',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Invalid JSON',
        details: error instanceof Error ? error.message : 'Unknown parsing error',
      },
    }
  }
}

/**
 * Convert CSV to JSON format
 * @param input - CSV string to convert
 * @param hasHeaders - Whether the CSV has headers (auto-detected if not specified)
 * @returns ConversionResult with JSON output or error
 */
export function csvToJSON(input: string, hasHeaders?: boolean): ConversionResult {
  try {
    const parseResult = Papa.parse(input, {
      header: hasHeaders !== false, // Default to true unless explicitly false
      skipEmptyLines: true,
      dynamicTyping: true, // Automatically convert numbers and booleans
    })

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        error: {
          message: 'CSV parsing error',
          details: parseResult.errors.map(e => e.message).join(', '),
        },
      }
    }

    const json = JSON.stringify(parseResult.data, null, 2)
    return { success: true, output: json }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'CSV conversion failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Convert JSON to YAML format
 * @param input - JSON string to convert
 * @returns ConversionResult with YAML output or error
 */
export function jsonToYAML(input: string): ConversionResult {
  try {
    const parsed = JSON.parse(input)
    const yamlOutput = yaml.dump(parsed, {
      indent: 2,
      lineWidth: -1, // No line wrapping
      noRefs: true, // Don't use references
    })
    return { success: true, output: yamlOutput }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'JSON to YAML conversion failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Convert YAML to JSON format
 * @param input - YAML string to convert
 * @returns ConversionResult with JSON output or error
 */
export function yamlToJSON(input: string): ConversionResult {
  try {
    const parsed = yaml.load(input)
    const json = JSON.stringify(parsed, null, 2)
    return { success: true, output: json }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'YAML to JSON conversion failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Convert JSON to URL query parameters
 * @param input - JSON string to convert
 * @returns ConversionResult with query parameters output or error
 */
export function jsonToQueryParams(input: string): ConversionResult {
  try {
    const parsed = JSON.parse(input)

    // Only handle flat objects for query parameters
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        success: false,
        error: {
          message: 'Invalid data format',
          details: 'JSON must be a flat object to convert to query parameters',
        },
      }
    }

    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(parsed)) {
      if (value !== null && value !== undefined) {
        // Convert complex values to JSON strings
        if (typeof value === 'object') {
          params.append(key, JSON.stringify(value))
        } else {
          params.append(key, String(value))
        }
      }
    }

    return { success: true, output: params.toString() }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'JSON to query parameters conversion failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Convert URL query parameters to JSON
 * @param input - Query parameters string to convert
 * @returns ConversionResult with JSON output or error
 */
export function queryParamsToJSON(input: string): ConversionResult {
  try {
    // Remove leading ? if present
    const cleanInput = input.startsWith('?') ? input.slice(1) : input

    const params = new URLSearchParams(cleanInput)
    const result: Record<string, any> = {}

    for (const [key, value] of params.entries()) {
      // Try to parse as JSON first (for complex values)
      try {
        result[key] = JSON.parse(value)
      } catch {
        // If not valid JSON, keep as string but try to convert numbers/booleans
        if (value === 'true') {
          result[key] = true
        } else if (value === 'false') {
          result[key] = false
        } else if (value === 'null') {
          result[key] = null
        } else if (!Number.isNaN(Number(value)) && value !== '') {
          result[key] = Number(value)
        } else {
          result[key] = value
        }
      }
    }

    const json = JSON.stringify(result, null, 2)
    return { success: true, output: json }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Query parameters to JSON conversion failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Detect the format of input text
 * @param input - Text to analyze
 * @returns Detected format or 'unknown'
 */
export function detectFormat(input: string): 'json' | 'csv' | 'yaml' | 'query' | 'unknown' {
  const trimmed = input.trim()

  if (!trimmed) {
    return 'unknown'
  }

  // Check for JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}'))
    || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      // Not valid JSON
    }
  }

  // Check for query parameters
  if (trimmed.includes('=') && (trimmed.includes('&') || !trimmed.includes('\n'))) {
    return 'query'
  }

  // Check for CSV (simple heuristic)
  if (trimmed.includes(',') && trimmed.includes('\n')) {
    return 'csv'
  }

  // Check for YAML (simple heuristic)
  if (trimmed.includes(':') && (trimmed.includes('\n') || trimmed.includes('- '))) {
    try {
      yaml.load(trimmed)
      return 'yaml'
    } catch {
      // Not valid YAML
    }
  }

  return 'unknown'
}
