/**
 * JSON Import/Export Utilities
 * Provides functions for converting JSON to/from various formats
 */

import * as yaml from 'js-yaml'

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
 * Convert JSON to JavaScript object literal
 * @param input - JSON string to convert
 * @returns ConversionResult with JS object output or error
 */
export function jsonToJSObject(input: string): ConversionResult {
  try {
    const parsed = JSON.parse(input)

    // Use a custom stringify that produces valid JS object syntax
    const jsObject = JSON.stringify(parsed, null, 2)
      .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
      .replace(/: "([^"]*)"([,\n])/g, ': \'$1\'$2') // Use single quotes for strings

    return { success: true, output: jsObject }
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
 * Convert JavaScript object literal to JSON
 * @param input - JS object string to convert
 * @returns ConversionResult with JSON output or error
 */
export function jsObjectToJSON(input: string): ConversionResult {
  try {
    // Wrap in parentheses and evaluate to parse JS object
    // eslint-disable-next-line no-new-func
    const parsed = new Function(`return (${input})`)()
    const json = JSON.stringify(parsed, null, 2)
    return { success: true, output: json }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Invalid JavaScript object',
        details: error instanceof Error ? error.message : 'Unknown parsing error',
      },
    }
  }
}

/**
 * Convert JSON to TypeScript interface definition
 * @param input - JSON string to convert
 * @returns ConversionResult with TS interface output or error
 */
export function jsonToTSInterface(input: string): ConversionResult {
  try {
    const parsed = JSON.parse(input)
    const interfaceDef = generateTSInterface(parsed, 'Root')
    return { success: true, output: interfaceDef }
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
 * Convert JSON to Java class definition
 * @param input - JSON string to convert
 * @returns ConversionResult with Java class output or error
 */
export function jsonToJavaClass(input: string): ConversionResult {
  try {
    const parsed = JSON.parse(input)
    const classDef = generateJavaClass(parsed, 'Root')
    return { success: true, output: classDef }
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
 * Generate TypeScript interface from object
 */
function generateTSInterface(obj: any, name: string, indent = 0): string {
  const indentStr = '  '.repeat(indent)

  if (typeof obj !== 'object' || obj === null) {
    return `${indentStr}export type ${name} = ${getTSType(obj)}\n`
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return `${indentStr}export type ${name} = any[]\n`
    }
    const itemType = getTSType(obj[0])
    return `${indentStr}export type ${name} = ${itemType}[]\n`
  }

  let result = `${indentStr}export interface ${name} {\n`

  for (const [key, value] of Object.entries(obj)) {
    const type = getTSType(value)
    result += `${indentStr}  ${key}: ${type}\n`
  }

  result += `${indentStr}}\n`
  return result
}

/**
 * Get TypeScript type for a value
 */
function getTSType(value: any): string {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'any[]'
    }
    return `${getTSType(value[0])}[]`
  }

  const type = typeof value
  if (type === 'object') {
    return 'object'
  }
  if (type === 'string') {
    return 'string'
  }
  if (type === 'number') {
    return 'number'
  }
  if (type === 'boolean') {
    return 'boolean'
  }
  return 'any'
}

/**
 * Generate Java class from object
 */
function generateJavaClass(obj: any, name: string, indent = 0): string {
  const indentStr = '  '.repeat(indent)

  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return `${indentStr}// Cannot generate class for non-object type\n`
  }

  let result = `${indentStr}public class ${name} {\n`

  for (const [key, value] of Object.entries(obj)) {
    const javaType = getJavaType(value)
    const fieldName = key.replace(/[^a-z0-9]/gi, '_')
    result += `${indentStr}  private ${javaType} ${fieldName};\n`
  }

  result += '\n'

  // Generate getters and setters
  for (const [key, value] of Object.entries(obj)) {
    const javaType = getJavaType(value)
    const fieldName = key.replace(/[^a-z0-9]/gi, '_')
    const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)

    result += `${indentStr}  public ${javaType} get${capitalizedName}() {\n`
    result += `${indentStr}    return ${fieldName};\n`
    result += `${indentStr}  }\n\n`

    result += `${indentStr}  public void set${capitalizedName}(${javaType} ${fieldName}) {\n`
    result += `${indentStr}    this.${fieldName} = ${fieldName};\n`
    result += `${indentStr}  }\n\n`
  }

  result += `${indentStr}}\n`
  return result
}

/**
 * Get Java type for a value
 */
function getJavaType(value: any): string {
  if (value === null) {
    return 'Object'
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'List<Object>'
    }
    return `List<${getJavaType(value[0])}>`
  }

  const type = typeof value
  if (type === 'object') {
    return 'Object'
  }
  if (type === 'string') {
    return 'String'
  }
  if (type === 'number') {
    return Number.isInteger(value) ? 'Integer' : 'Double'
  }
  if (type === 'boolean') {
    return 'Boolean'
  }
  return 'Object'
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
export function detectFormat(input: string): 'json' | 'yaml' | 'query' | 'jsobject' | 'unknown' {
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
      // Might be JS object
      try {
        // eslint-disable-next-line no-new-func
        new Function(`return (${trimmed})`)()
        return 'jsobject'
      } catch {
        // Not valid
      }
    }
  }

  // Check for query parameters
  if (trimmed.includes('=') && (trimmed.includes('&') || !trimmed.includes('\n'))) {
    return 'query'
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
