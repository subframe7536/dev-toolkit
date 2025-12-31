import type { RegexFlags } from './types'

export interface ExportOptions {
  pattern: string
  flags: RegexFlags
  language: 'javascript' | 'python' | 'java'
  variableName: string
  includeComments: boolean
}

/**
 * Converts RegexFlags to a string representation for JavaScript
 */
function flagsToJsString(flags: RegexFlags): string {
  let result = ''
  if (flags.global) {
    result += 'g'
  }
  if (flags.ignoreCase) {
    result += 'i'
  }
  if (flags.multiline) {
    result += 'm'
  }
  if (flags.dotAll) {
    result += 's'
  }
  if (flags.unicode) {
    result += 'u'
  }
  if (flags.sticky) {
    result += 'y'
  }
  return result
}

/**
 * Escapes special characters in a string for use in JavaScript string literals
 */
function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * Escapes special characters for use in Python raw string literals
 */
function escapePythonRawString(str: string): string {
  // In raw strings, only need to escape quotes and backslash at end
  return str.replace(/'/g, '\\\'')
}

/**
 * Escapes special characters for use in Java string literals
 */
function escapeJavaString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * Generates JavaScript export code
 */
function generateJavaScript(options: ExportOptions): string {
  const { pattern, flags, variableName, includeComments } = options
  const flagString = flagsToJsString(flags)
  const lines: string[] = []

  if (includeComments) {
    lines.push('// Regular expression pattern')
    if (flagString) {
      lines.push(`// Flags: ${flagString}`)
    }
  }

  // Use RegExp constructor for patterns with special characters or when flags are present
  const hasSpecialChars = pattern.includes('/') || pattern.includes('\n')

  if (hasSpecialChars || flagString) {
    const escapedPattern = escapeJsString(pattern)
    if (flagString) {
      lines.push(`const ${variableName} = new RegExp('${escapedPattern}', '${flagString}');`)
    } else {
      lines.push(`const ${variableName} = new RegExp('${escapedPattern}');`)
    }
  } else {
    // Use regex literal for simple patterns
    lines.push(`const ${variableName} = /${pattern}/;`)
  }

  if (includeComments) {
    lines.push('')
    lines.push('// Usage example:')
    lines.push(`// const matches = text.match(${variableName});`)
    if (flags.global) {
      lines.push(`// const allMatches = [...text.matchAll(${variableName})];`)
    }
  }

  return lines.join('\n')
}

/**
 * Generates Python export code
 */
function generatePython(options: ExportOptions): string {
  const { pattern, flags, variableName, includeComments } = options
  const lines: string[] = []

  // Build Python flags
  const pythonFlags: string[] = []
  if (flags.ignoreCase) {
    pythonFlags.push('re.IGNORECASE')
  }
  if (flags.multiline) {
    pythonFlags.push('re.MULTILINE')
  }
  if (flags.dotAll) {
    pythonFlags.push('re.DOTALL')
  }
  if (flags.unicode) {
    pythonFlags.push('re.UNICODE')
  }

  if (includeComments) {
    lines.push('# Regular expression pattern')
    if (pythonFlags.length > 0) {
      lines.push(`# Flags: ${pythonFlags.join(', ')}`)
    }
    if (flags.global) {
      lines.push('# Note: Python uses findall()/finditer() for global matching')
    }
    if (flags.sticky) {
      lines.push('# Note: Python does not have a sticky flag equivalent')
    }
  }

  lines.push('import re')
  lines.push('')

  const escapedPattern = escapePythonRawString(pattern)

  if (pythonFlags.length > 0) {
    lines.push(`${variableName} = re.compile(r'${escapedPattern}', ${pythonFlags.join(' | ')})`)
  } else {
    lines.push(`${variableName} = re.compile(r'${escapedPattern}')`)
  }

  if (includeComments) {
    lines.push('')
    lines.push('# Usage example:')
    lines.push(`# match = ${variableName}.search(text)`)
    if (flags.global) {
      lines.push(`# all_matches = ${variableName}.findall(text)`)
    }
  }

  return lines.join('\n')
}

/**
 * Generates Java export code
 */
function generateJava(options: ExportOptions): string {
  const { pattern, flags, variableName, includeComments } = options
  const lines: string[] = []

  // Build Java flags
  const javaFlags: string[] = []
  if (flags.ignoreCase) {
    javaFlags.push('Pattern.CASE_INSENSITIVE')
  }
  if (flags.multiline) {
    javaFlags.push('Pattern.MULTILINE')
  }
  if (flags.dotAll) {
    javaFlags.push('Pattern.DOTALL')
  }
  if (flags.unicode) {
    javaFlags.push('Pattern.UNICODE_CASE')
  }

  if (includeComments) {
    lines.push('// Regular expression pattern')
    if (javaFlags.length > 0) {
      lines.push(`// Flags: ${javaFlags.join(', ')}`)
    }
    if (flags.global) {
      lines.push('// Note: Java uses Matcher.find() in a loop for global matching')
    }
    if (flags.sticky) {
      lines.push('// Note: Java does not have a sticky flag equivalent')
    }
  }

  lines.push('import java.util.regex.Pattern;')
  lines.push('import java.util.regex.Matcher;')
  lines.push('')

  const escapedPattern = escapeJavaString(pattern)
  // Capitalize first letter for Java convention
  const javaVarName = variableName.charAt(0).toLowerCase() + variableName.slice(1)

  if (javaFlags.length > 0) {
    lines.push(`Pattern ${javaVarName} = Pattern.compile("${escapedPattern}", ${javaFlags.join(' | ')});`)
  } else {
    lines.push(`Pattern ${javaVarName} = Pattern.compile("${escapedPattern}");`)
  }

  if (includeComments) {
    lines.push('')
    lines.push('// Usage example:')
    lines.push(`// Matcher matcher = ${javaVarName}.matcher(text);`)
    lines.push('// if (matcher.find()) {')
    lines.push('//     String match = matcher.group();')
    lines.push('// }')
  }

  return lines.join('\n')
}

/**
 * Generates export code for the specified language
 */
export function generateExportCode(options: ExportOptions): string {
  const { language } = options

  // Validate variable name
  const varName = options.variableName.trim() || 'regex'
  const sanitizedOptions = { ...options, variableName: varName }

  switch (language) {
    case 'javascript':
      return generateJavaScript(sanitizedOptions)
    case 'python':
      return generatePython(sanitizedOptions)
    case 'java':
      return generateJava(sanitizedOptions)
    default:
      return '// Unsupported language'
  }
}
