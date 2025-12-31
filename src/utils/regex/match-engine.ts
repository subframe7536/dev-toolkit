import type { CaptureGroup, MatchResult, RegexFlags, ReplacementResult, TextValidationResult, ValidationMode } from './types'

/**
 * Convert RegexFlags object to flag string
 */
export function flagsToString(flags: RegexFlags): string {
  const flagMap: Record<keyof RegexFlags, string> = {
    global: 'g',
    ignoreCase: 'i',
    multiline: 'm',
    dotAll: 's',
    unicode: 'u',
    sticky: 'y',
  }

  return Object.entries(flags)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => flagMap[key as keyof RegexFlags])
    .join('')
}

/**
 * Find capture group positions within the match
 * Uses indexOf with offset to find actual positions
 */
function findGroupPositions(
  text: string,
  match: RegExpExecArray,
  matchStart: number,
): CaptureGroup[] {
  const groups: CaptureGroup[] = []

  // Process numbered capture groups (indices 1+)
  for (let i = 1; i < match.length; i++) {
    const groupValue = match[i]
    if (groupValue === undefined) {
      continue
    }

    // Find the position of this group within the full match
    // Start searching from the match start position
    let groupStart = text.indexOf(groupValue, matchStart)

    // If not found starting from matchStart, the group might be at a different position
    // This can happen with overlapping groups or backreferences
    if (groupStart === -1 || groupStart >= matchStart + match[0].length) {
      // Fallback: search within the match bounds
      const matchText = match[0]
      const relativePos = matchText.indexOf(groupValue)
      if (relativePos !== -1) {
        groupStart = matchStart + relativePos
      } else {
        // Group value not found in expected range, skip
        continue
      }
    }

    const groupEnd = groupStart + groupValue.length

    // Check for named groups (ES2018+)
    let groupName: string | undefined
    if (match.groups) {
      for (const [name, value] of Object.entries(match.groups)) {
        if (value === groupValue) {
          groupName = name
          break
        }
      }
    }

    groups.push({
      index: i,
      name: groupName,
      value: groupValue,
      start: groupStart,
      end: groupEnd,
    })
  }

  return groups
}

/**
 * Find all matches in text using the given pattern and flags
 * Properly handles global vs non-global matching
 */
export function findMatches(
  pattern: string,
  flags: RegexFlags,
  text: string,
): MatchResult[] {
  if (!pattern || !text) {
    return []
  }

  try {
    const flagString = flagsToString(flags)
    const regex = new RegExp(pattern, flagString)
    const matches: MatchResult[] = []

    if (flags.global) {
      // Global matching - find all matches
      let matchIndex = 0
      const maxIterations = 10000 // Safety limit

      for (let i = 0; i < maxIterations; i++) {
        const match = regex.exec(text)
        if (match === null) {
          break
        }

        const groups = findGroupPositions(text, match, match.index)

        matches.push({
          index: matchIndex++,
          fullMatch: match[0],
          groups,
          start: match.index,
          end: match.index + match[0].length,
        })

        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex++
        }
      }
    } else {
      // Single match - find first match only
      const match = regex.exec(text)
      if (match) {
        const groups = findGroupPositions(text, match, match.index)

        matches.push({
          index: 0,
          fullMatch: match[0],
          groups,
          start: match.index,
          end: match.index + match[0].length,
        })
      }
    }

    return matches
  } catch {
    // Pattern is invalid, return empty matches
    return []
  }
}

/**
 * Validate a regex pattern
 * Returns validation result with error details if invalid
 */
export function validatePattern(
  pattern: string,
  flags: RegexFlags,
): { isValid: boolean, error?: { message: string, position: number, length: number } } {
  if (!pattern) {
    return { isValid: true }
  }

  try {
    const flagString = flagsToString(flags)
    // Test pattern compilation
    const _testRegex = new RegExp(pattern, flagString)
    void _testRegex // Suppress unused variable warning
    return { isValid: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid regex pattern'
    let position = 0
    let length = 1

    // Try to extract position from common error patterns
    const positionMatch = errorMessage.match(/at position (\d+)/)
    if (positionMatch) {
      position = Number.parseInt(positionMatch[1], 10)
    } else {
      // Detect common error patterns and estimate position
      if (errorMessage.includes('Unterminated character class')) {
        const lastBracket = pattern.lastIndexOf('[')
        if (lastBracket !== -1) {
          position = lastBracket
          length = pattern.length - lastBracket
        }
      } else if (errorMessage.includes('Unterminated group')) {
        const lastParen = pattern.lastIndexOf('(')
        if (lastParen !== -1) {
          position = lastParen
          length = pattern.length - lastParen
        }
      } else if (errorMessage.includes('Invalid escape')) {
        const lastBackslash = pattern.lastIndexOf('\\')
        if (lastBackslash !== -1) {
          position = lastBackslash
          length = Math.min(2, pattern.length - lastBackslash)
        }
      } else if (errorMessage.includes('Invalid quantifier')) {
        const quantifierPattern = /([*+?{][^}]*)$/
        const quantifierMatch = pattern.match(quantifierPattern)
        if (quantifierMatch) {
          position = pattern.length - quantifierMatch[1].length
          length = quantifierMatch[1].length
        }
      }
    }

    return {
      isValid: false,
      error: {
        message: errorMessage,
        position,
        length,
      },
    }
  }
}

/**
 * Validate text against a regex pattern
 * Supports "contains" (partial match) and "fullMatch" (entire string) modes
 */
export function validateText(
  pattern: string,
  flags: RegexFlags,
  text: string,
  mode: ValidationMode,
): TextValidationResult {
  if (!pattern) {
    return {
      passed: true,
      mode,
      message: 'No pattern to validate',
    }
  }

  if (!text) {
    return {
      passed: false,
      mode,
      message: 'No text to validate',
    }
  }

  try {
    const flagString = flagsToString(flags)
    const regex = new RegExp(pattern, flagString)

    if (mode === 'fullMatch') {
      // Full string match - pattern must match entire text
      // Use anchors to ensure full match
      const fullMatchPattern = `^(?:${pattern})$`
      const fullMatchRegex = new RegExp(fullMatchPattern, flagString)
      const match = fullMatchRegex.exec(text)

      if (match && match[0] === text) {
        return {
          passed: true,
          mode,
          message: 'Full string matches the pattern',
        }
      }

      // Find where the match fails
      // Try to find partial match to show what matched
      const partialMatch = regex.exec(text)
      if (partialMatch) {
        // Pattern matches somewhere but not the full string
        const failPosition = partialMatch.index === 0
          ? partialMatch[0].length // Match starts at beginning but doesn't cover all
          : 0 // Match doesn't start at beginning
        return {
          passed: false,
          mode,
          failPosition,
          failLength: 1,
          message: failPosition === 0
            ? 'Pattern does not match from the start of the text'
            : `Pattern matches only part of the text (${partialMatch[0].length} of ${text.length} characters)`,
        }
      }

      // No match at all
      return {
        passed: false,
        mode,
        failPosition: 0,
        failLength: 1,
        message: 'Pattern does not match the text',
      }
    } else {
      // Contains mode - pattern must match somewhere in text
      const match = regex.exec(text)

      if (match) {
        return {
          passed: true,
          mode,
          message: `Text contains a match at position ${match.index}`,
        }
      }

      return {
        passed: false,
        mode,
        failPosition: 0,
        failLength: text.length,
        message: 'Pattern not found in text',
      }
    }
  } catch {
    return {
      passed: false,
      mode,
      message: 'Invalid regex pattern',
    }
  }
}

/**
 * Replace matches in text using a replacement pattern
 * Supports capture group references ($1, $2, etc.) and named groups ($<name>)
 */
export function replaceMatches(
  pattern: string,
  flags: RegexFlags,
  text: string,
  replacement: string,
): ReplacementResult {
  if (!pattern || !text) {
    return {
      result: text,
      replacementCount: 0,
    }
  }

  try {
    const flagString = flagsToString(flags)
    const regex = new RegExp(pattern, flagString)

    // Count replacements
    let replacementCount = 0

    // Use String.replace with a function to count replacements
    const result = text.replace(regex, (...args) => {
      replacementCount++

      // Process the replacement string
      // args: [match, ...groups, offset, string, namedGroups?]
      const match = args[0] as string
      const namedGroups = typeof args[args.length - 1] === 'object' ? args[args.length - 1] as Record<string, string> : undefined

      let processedReplacement = replacement

      // Replace $& with full match
      processedReplacement = processedReplacement.replace(/\$&/g, match)

      // Replace $` with text before match
      const offset = args[args.length - (namedGroups ? 3 : 2)] as number
      const inputString = args[args.length - (namedGroups ? 2 : 1)] as string
      processedReplacement = processedReplacement.replace(/\$`/g, inputString.slice(0, offset))

      // Replace $' with text after match
      processedReplacement = processedReplacement.replace(/\$'/g, inputString.slice(offset + match.length))

      // Replace $$ with literal $
      processedReplacement = processedReplacement.replace(/\$\$/g, '\0DOLLAR\0')

      // Replace numbered capture groups ($1, $2, etc.)
      processedReplacement = processedReplacement.replace(/\$(\d+)/g, (_, num) => {
        const groupIndex = Number.parseInt(num, 10)
        // Groups start at index 1 in args array
        const groupValue = args[groupIndex]
        return typeof groupValue === 'string' ? groupValue : ''
      })

      // Replace named capture groups ($<name>)
      if (namedGroups) {
        processedReplacement = processedReplacement.replace(/\$<([^>]+)>/g, (_, name) => {
          return namedGroups[name] ?? ''
        })
      }

      // Restore literal $
      processedReplacement = processedReplacement.replace(/\0DOLLAR\0/g, '$')

      return processedReplacement
    })

    return {
      result,
      replacementCount,
    }
  } catch {
    return {
      result: text,
      replacementCount: 0,
    }
  }
}
