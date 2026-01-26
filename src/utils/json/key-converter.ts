/**
 * JSON Key Style Converter Utilities
 * Provides functions for converting JSON key naming conventions
 */

import { repairJSON } from './formatter'

export type CaseStyle = 'As is' | 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase' | 'CONSTANT_CASE' | 'lowercase' | 'UPPERCASE'

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
 * Convert JSON keys to specified case style
 * @param input - JSON string to convert
 * @param targetCase - Target case style
 * @param repair - If true, attempt to repair JSON before parsing (default: false)
 * @returns ConversionResult with converted JSON or error
 */
export function convertKeys(input: string, targetCase: CaseStyle, repair: boolean = false): ConversionResult {
  try {
    let jsonToParse = input

    // Attempt repair if requested and input is invalid
    if (repair) {
      try {
        JSON.parse(input)
      } catch {
        // Input is invalid, try to repair
        try {
          jsonToParse = repairJSON(input)
        } catch (repairError) {
          return {
            success: false,
            error: {
              message: 'Invalid JSON and repair failed',
              details: repairError instanceof Error ? repairError.message : 'Unknown repair error',
            },
          }
        }
      }
    }

    const parsed = JSON.parse(jsonToParse)
    const converted = targetCase !== 'As is' ? convertObjectKeys(parsed, targetCase) : parsed
    const output = JSON.stringify(converted, null, 2)
    return { success: true, output }
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
 * Recursively convert object keys to target case style
 * @param obj - Object to convert
 * @param targetCase - Target case style
 * @returns Object with converted keys
 */
function convertObjectKeys(obj: any, targetCase: CaseStyle): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertObjectKeys(item, targetCase))
  }

  const converted: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    const newKey = convertCase(key, targetCase)
    converted[newKey] = convertObjectKeys(value, targetCase)
  }

  return converted
}

/**
 * Convert a string to the specified case style
 * @param str - String to convert
 * @param targetCase - Target case style
 * @returns Converted string
 */
export function convertCase(str: string, targetCase: CaseStyle): string {
  // First, split the string into words
  const words = splitIntoWords(str)

  switch (targetCase) {
    case 'camelCase':
      return words
        .map((word, index) =>
          index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join('')

    case 'snake_case':
      return words.map(word => word.toLowerCase()).join('_')

    case 'kebab-case':
      return words.map(word => word.toLowerCase()).join('-')

    case 'PascalCase':
      return words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')

    case 'CONSTANT_CASE':
      return words.map(word => word.toUpperCase()).join('_')

    case 'lowercase':
      return words.map(word => word.toLowerCase()).join('')

    case 'UPPERCASE':
      return words.map(word => word.toUpperCase()).join('')

    default:
      return str
  }
}

/**
 * Split a string into words, handling various naming conventions
 * @param str - String to split
 * @returns Array of words
 */
export function splitIntoWords(str: string): string[] {
  // Handle empty string
  if (!str) {
    return []
  }

  // Replace common delimiters with spaces
  let normalized = str
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters in camelCase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // Handle acronyms like "XMLParser" -> "XML Parser"

  // Split by spaces and filter out empty strings
  const words = normalized.split(/\s+/).filter(word => word.length > 0)

  return words
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
