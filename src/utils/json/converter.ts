/**
 * JSON Import/Export Utilities
 * Provides functions for converting JSON to/from various formats
 */

import * as yaml from 'js-yaml'
import Papa from 'papaparse'

import { repairJSON } from './formatter'

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

/**
 * Convert JSON to JavaScript object literal
 * @param input - JSON string to convert
 * @param useRepair - Whether to attempt repairing malformed JSON
 * @returns ConversionResult with JS object output or error
 */
export function jsonToJSObject(input: string, useRepair: boolean = false): ConversionResult {
  try {
    let jsonStr = input
    if (useRepair) {
      try {
        jsonStr = repairJSON(input)
      } catch {
        // If repair fails, try with original input
      }
    }

    const parsed = JSON.parse(jsonStr)

    // Format as JS object with proper indentation
    const formatted = formatAsJSObject(parsed, 0)
    return { success: true, output: formatted }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'JSON to JS Object conversion failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Convert JSON to TypeScript type definition
 * @param input - JSON string to convert
 * @param useRepair - Whether to attempt repairing malformed JSON
 * @returns ConversionResult with TS definition output or error
 */
export function jsonToTSDefinition(input: string, useRepair: boolean = false): ConversionResult {
  try {
    let jsonStr = input
    if (useRepair) {
      try {
        jsonStr = repairJSON(input)
      } catch {
        // If repair fails, try with original input
      }
    }

    const parsed = JSON.parse(jsonStr)
    const typeDef = generateTSType(parsed, 'Root')
    return { success: true, output: typeDef }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'JSON to TS Definition conversion failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Convert JSON to Java class
 * @param input - JSON string to convert
 * @param useRepair - Whether to attempt repairing malformed JSON
 * @returns ConversionResult with Java class output or error
 */
export function jsonToJavaClass(input: string, useRepair: boolean = false): ConversionResult {
  try {
    let jsonStr = input
    if (useRepair) {
      try {
        jsonStr = repairJSON(input)
      } catch {
        // If repair fails, try with original input
      }
    }

    const parsed = JSON.parse(jsonStr)
    const javaClass = generateJavaClass(parsed, 'Root')
    return { success: true, output: javaClass }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'JSON to Java Class conversion failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Format value as JavaScript object literal
 */
function formatAsJSObject(value: any, indent: number): string {
  const indentStr = '  '.repeat(indent)
  const nextIndentStr = '  '.repeat(indent + 1)

  if (value === null) {
    return 'null'
  }

  if (value === undefined) {
    return 'undefined'
  }

  if (typeof value === 'string') {
    return `'${value.replace(/'/g, '\\\'')}'`
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]'
    }
    const items = value.map(item => `${nextIndentStr}${formatAsJSObject(item, indent + 1)}`)
    return `[\n${items.join(',\n')}\n${indentStr}]`
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) {
      return '{}'
    }
    const props = keys.map((key) => {
      const validKey = /^[a-z_$][\w$]*$/i.test(key)
      const keyStr = validKey ? key : `'${key}'`
      return `${nextIndentStr}${keyStr}: ${formatAsJSObject(value[key], indent + 1)}`
    })
    return `{\n${props.join(',\n')}\n${indentStr}}`
  }

  return String(value)
}

/**
 * Generate TypeScript type definition from JSON value
 */
function generateTSType(value: any, typeName: string, indent: number = 0): string {
  const indentStr = '  '.repeat(indent)
  const nextIndentStr = '  '.repeat(indent + 1)

  if (value === null) {
    return `${indentStr}type ${typeName} = null`
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indentStr}type ${typeName} = any[]`
    }
    const itemType = inferTSType(value[0])
    return `${indentStr}type ${typeName} = ${itemType}[]`
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) {
      return `${indentStr}type ${typeName} = Record<string, never>`
    }
    const props = keys.map((key) => {
      const propType = inferTSType(value[key])
      return `${nextIndentStr}${key}: ${propType}`
    })
    return `${indentStr}type ${typeName} = {\n${props.join('\n')}\n${indentStr}}`
  }

  return `${indentStr}type ${typeName} = ${inferTSType(value)}`
}

/**
 * Infer TypeScript type from value
 */
function inferTSType(value: any): string {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'any[]'
    }
    const itemType = inferTSType(value[0])
    return `${itemType}[]`
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) {
      return 'Record<string, never>'
    }
    const props = keys.map((key) => {
      const propType = inferTSType(value[key])
      return `  ${key}: ${propType}`
    })
    return `{\n${props.join('\n')}\n}`
  }

  if (typeof value === 'string') {
    return 'string'
  }

  if (typeof value === 'number') {
    return 'number'
  }

  if (typeof value === 'boolean') {
    return 'boolean'
  }

  return 'any'
}

/**
 * Generate Java class from JSON value
 */
function generateJavaClass(value: any, className: string): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '// JSON must be an object to generate a Java class'
  }

  const keys = Object.keys(value)
  if (keys.length === 0) {
    return `public class ${className} {\n}`
  }

  const fields: string[] = []
  const getters: string[] = []
  const setters: string[] = []

  for (const key of keys) {
    const javaType = inferJavaType(value[key])
    const fieldName = key
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)

    fields.push(`  private ${javaType} ${fieldName};`)
    getters.push(`  public ${javaType} get${capitalizedKey}() {\n    return ${fieldName};\n  }`)
    setters.push(`  public void set${capitalizedKey}(${javaType} ${fieldName}) {\n    this.${fieldName} = ${fieldName};\n  }`)
  }

  return `public class ${className} {\n${fields.join('\n')}\n\n${getters.join('\n\n')}\n\n${setters.join('\n\n')}\n}`
}

/**
 * Infer Java type from value
 */
function inferJavaType(value: any): string {
  if (value === null) {
    return 'Object'
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'List<Object>'
    }
    const itemType = inferJavaType(value[0])
    return `List<${itemType}>`
  }

  if (typeof value === 'object') {
    return 'Object'
  }

  if (typeof value === 'string') {
    return 'String'
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int' : 'double'
  }

  if (typeof value === 'boolean') {
    return 'boolean'
  }

  return 'Object'
}
