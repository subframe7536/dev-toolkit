import type { ExplanationResult, RegexElement } from './types'

/**
 * Regex element types for categorization
 */
export type RegexElementType =
  | 'literal'
  | 'quantifier'
  | 'character-class'
  | 'predefined-class'
  | 'anchor'
  | 'group'
  | 'lookahead'
  | 'lookbehind'
  | 'alternation'
  | 'escape'
  | 'backreference'
  | 'flag'

/**
 * Token representation for parsed regex elements
 */
interface Token {
  type: RegexElementType
  value: string
  start: number
  end: number
  description: string
  details?: string
}

/**
 * Quantifier descriptions
 */
const QUANTIFIER_DESCRIPTIONS: Record<string, string> = {
  '*': 'Matches zero or more of the preceding element (greedy)',
  '+': 'Matches one or more of the preceding element (greedy)',
  '?': 'Matches zero or one of the preceding element (optional)',
  '*?': 'Matches zero or more of the preceding element (non-greedy/lazy)',
  '+?': 'Matches one or more of the preceding element (non-greedy/lazy)',
  '??': 'Matches zero or one of the preceding element (non-greedy/lazy)',
  '*+': 'Matches zero or more of the preceding element (possessive)',
  '++': 'Matches one or more of the preceding element (possessive)',
  '?+': 'Matches zero or one of the preceding element (possessive)',
}

/**
 * Predefined character class descriptions
 */
const PREDEFINED_CLASS_DESCRIPTIONS: Record<string, string> = {
  '\\d': 'Matches any digit (0-9)',
  '\\D': 'Matches any non-digit character',
  '\\w': 'Matches any word character (a-z, A-Z, 0-9, _)',
  '\\W': 'Matches any non-word character',
  '\\s': 'Matches any whitespace character (space, tab, newline)',
  '\\S': 'Matches any non-whitespace character',
  '\\b': 'Matches a word boundary',
  '\\B': 'Matches a non-word boundary',
  '\\n': 'Matches a newline character',
  '\\r': 'Matches a carriage return',
  '\\t': 'Matches a tab character',
  '\\f': 'Matches a form feed character',
  '\\v': 'Matches a vertical tab character',
  '\\0': 'Matches a null character',
  '.': 'Matches any character except newline (unless dotAll flag is set)',
}

/**
 * Anchor descriptions
 */
const ANCHOR_DESCRIPTIONS: Record<string, string> = {
  '^': 'Matches the start of the string (or line in multiline mode)',
  '$': 'Matches the end of the string (or line in multiline mode)',
}

/**
 * Parse a quantifier range like {n}, {n,}, or {n,m}
 */
function parseQuantifierRange(value: string): string {
  const match = value.match(/^\{(\d+)(?:,(\d*))?\}(\?|\+)?$/)
  if (!match) {
    return `Matches with quantifier ${value}`
  }

  const [, min, max, modifier] = match
  const modifierText = modifier === '?' ? ' (non-greedy)' : modifier === '+' ? ' (possessive)' : ' (greedy)'

  if (max === undefined) {
    return `Matches exactly ${min} of the preceding element${modifierText}`
  } else if (max === '') {
    return `Matches ${min} or more of the preceding element${modifierText}`
  } else {
    return `Matches between ${min} and ${max} of the preceding element${modifierText}`
  }
}

/**
 * Parse a character class like [abc] or [a-z]
 */
function parseCharacterClass(value: string): string {
  const isNegated = value.startsWith('[^')
  const inner = value.slice(isNegated ? 2 : 1, -1)

  if (isNegated) {
    return `Matches any character NOT in: ${inner}`
  }
  return `Matches any character in: ${inner}`
}

/**
 * Parse group type and provide description
 */
function parseGroup(value: string): { description: string, details?: string } {
  // Named capture group (?<name>...)
  const namedMatch = value.match(/^\(\?<([^>]+)>/)
  if (namedMatch) {
    return {
      description: `Named capture group "${namedMatch[1]}"`,
      details: 'Captures the matched text and assigns it to the specified name',
    }
  }

  // Non-capturing group (?:...)
  if (value.startsWith('(?:')) {
    return {
      description: 'Non-capturing group',
      details: 'Groups the pattern without capturing the matched text',
    }
  }

  // Positive lookahead (?=...)
  if (value.startsWith('(?=')) {
    return {
      description: 'Positive lookahead assertion',
      details: 'Matches if the pattern inside would match at this position, without consuming characters',
    }
  }

  // Negative lookahead (?!...)
  if (value.startsWith('(?!')) {
    return {
      description: 'Negative lookahead assertion',
      details: 'Matches if the pattern inside would NOT match at this position, without consuming characters',
    }
  }

  // Positive lookbehind (?<=...)
  if (value.startsWith('(?<=')) {
    return {
      description: 'Positive lookbehind assertion',
      details: 'Matches if the pattern inside would match before this position, without consuming characters',
    }
  }

  // Negative lookbehind (?<!...)
  if (value.startsWith('(?<!')) {
    return {
      description: 'Negative lookbehind assertion',
      details: 'Matches if the pattern inside would NOT match before this position, without consuming characters',
    }
  }

  // Atomic group (?>...)
  if (value.startsWith('(?>')) {
    return {
      description: 'Atomic group',
      details: 'Prevents backtracking once the group has matched',
    }
  }

  // Regular capture group
  return {
    description: 'Capture group',
    details: 'Captures the matched text for later reference',
  }
}

/**
 * Tokenize a regex pattern into elements
 */
export function tokenizePattern(pattern: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < pattern.length) {
    const char = pattern[i]
    const remaining = pattern.slice(i)

    // Quantifier range {n}, {n,}, {n,m}
    const quantifierRangeMatch = remaining.match(/^\{(\d+)(?:,(\d*))?\}(\?|\+)?/)
    if (quantifierRangeMatch) {
      const value = quantifierRangeMatch[0]
      tokens.push({
        type: 'quantifier',
        value,
        start: i,
        end: i + value.length,
        description: parseQuantifierRange(value),
      })
      i += value.length
      continue
    }

    // Quantifiers with modifiers
    if (char === '*' || char === '+' || char === '?') {
      const next = pattern[i + 1]
      if (next === '?' || next === '+') {
        const value = char + next
        tokens.push({
          type: 'quantifier',
          value,
          start: i,
          end: i + 2,
          description: QUANTIFIER_DESCRIPTIONS[value] || `Quantifier ${value}`,
        })
        i += 2
        continue
      }
      tokens.push({
        type: 'quantifier',
        value: char,
        start: i,
        end: i + 1,
        description: QUANTIFIER_DESCRIPTIONS[char] || `Quantifier ${char}`,
      })
      i++
      continue
    }

    // Escape sequences
    if (char === '\\') {
      const next = pattern[i + 1]
      if (next) {
        const escapeSeq = `\\${next}`

        // Predefined character classes
        if (PREDEFINED_CLASS_DESCRIPTIONS[escapeSeq]) {
          tokens.push({
            type: 'predefined-class',
            value: escapeSeq,
            start: i,
            end: i + 2,
            description: PREDEFINED_CLASS_DESCRIPTIONS[escapeSeq],
          })
          i += 2
          continue
        }

        // Backreference \1, \2, etc.
        const backrefMatch = remaining.match(/^\\(\d+)/)
        if (backrefMatch) {
          const value = backrefMatch[0]
          tokens.push({
            type: 'backreference',
            value,
            start: i,
            end: i + value.length,
            description: `Backreference to capture group ${backrefMatch[1]}`,
          })
          i += value.length
          continue
        }

        // Named backreference \k<name>
        const namedBackrefMatch = remaining.match(/^\\k<([^>]+)>/)
        if (namedBackrefMatch) {
          const value = namedBackrefMatch[0]
          tokens.push({
            type: 'backreference',
            value,
            start: i,
            end: i + value.length,
            description: `Backreference to named group "${namedBackrefMatch[1]}"`,
          })
          i += value.length
          continue
        }

        // Unicode escape \u{...} or \uXXXX
        const unicodeMatch = remaining.match(/^\\u(?:\{([0-9a-fA-F]+)\}|([0-9a-fA-F]{4}))/)
        if (unicodeMatch) {
          const value = unicodeMatch[0]
          const codePoint = unicodeMatch[1] || unicodeMatch[2]
          tokens.push({
            type: 'escape',
            value,
            start: i,
            end: i + value.length,
            description: `Unicode character U+${codePoint.toUpperCase()}`,
          })
          i += value.length
          continue
        }

        // Hex escape \xXX
        const hexMatch = remaining.match(/^\\x([0-9a-fA-F]{2})/)
        if (hexMatch) {
          const value = hexMatch[0]
          tokens.push({
            type: 'escape',
            value,
            start: i,
            end: i + value.length,
            description: `Hexadecimal character 0x${hexMatch[1].toUpperCase()}`,
          })
          i += value.length
          continue
        }

        // Generic escape (literal character)
        tokens.push({
          type: 'escape',
          value: escapeSeq,
          start: i,
          end: i + 2,
          description: `Escaped literal character "${next}"`,
        })
        i += 2
        continue
      }
    }

    // Character class [...]
    if (char === '[') {
      let depth = 1
      let j = i + 1
      const isNegated = pattern[j] === '^'
      if (isNegated) {
        j++
      }

      // Handle ] as first character in class
      if (pattern[j] === ']') {
        j++
      }

      while (j < pattern.length && depth > 0) {
        if (pattern[j] === '\\' && j + 1 < pattern.length) {
          j += 2 // Skip escaped character
          continue
        }
        if (pattern[j] === '[') {
          depth++
        }
        if (pattern[j] === ']') {
          depth--
        }
        j++
      }

      const value = pattern.slice(i, j)
      tokens.push({
        type: 'character-class',
        value,
        start: i,
        end: j,
        description: parseCharacterClass(value),
      })
      i = j
      continue
    }

    // Groups (...)
    if (char === '(') {
      let depth = 1
      let j = i + 1

      while (j < pattern.length && depth > 0) {
        if (pattern[j] === '\\' && j + 1 < pattern.length) {
          j += 2 // Skip escaped character
          continue
        }
        if (pattern[j] === '(') {
          depth++
        }
        if (pattern[j] === ')') {
          depth--
        }
        j++
      }

      const value = pattern.slice(i, j)
      const groupInfo = parseGroup(value)

      // Determine group type for token
      let type: RegexElementType = 'group'
      if (value.startsWith('(?=') || value.startsWith('(?!')) {
        type = 'lookahead'
      } else if (value.startsWith('(?<=') || value.startsWith('(?<!')) {
        type = 'lookbehind'
      }

      tokens.push({
        type,
        value,
        start: i,
        end: j,
        description: groupInfo.description,
        details: groupInfo.details,
      })
      i = j
      continue
    }

    // Anchors
    if (char === '^' || char === '$') {
      tokens.push({
        type: 'anchor',
        value: char,
        start: i,
        end: i + 1,
        description: ANCHOR_DESCRIPTIONS[char],
      })
      i++
      continue
    }

    // Alternation
    if (char === '|') {
      tokens.push({
        type: 'alternation',
        value: char,
        start: i,
        end: i + 1,
        description: 'Alternation - matches either the pattern before or after',
      })
      i++
      continue
    }

    // Dot (any character)
    if (char === '.') {
      tokens.push({
        type: 'predefined-class',
        value: char,
        start: i,
        end: i + 1,
        description: PREDEFINED_CLASS_DESCRIPTIONS['.'],
      })
      i++
      continue
    }

    // Literal character
    tokens.push({
      type: 'literal',
      value: char,
      start: i,
      end: i + 1,
      description: `Literal character "${char}"`,
    })
    i++
  }

  return tokens
}

/**
 * Generate a human-readable overall description of the pattern
 */
function generateOverallDescription(tokens: Token[]): string {
  if (tokens.length === 0) {
    return 'Empty pattern'
  }

  const parts: string[] = []

  // Check for common patterns
  const hasStartAnchor = tokens.some(t => t.type === 'anchor' && t.value === '^')
  const hasEndAnchor = tokens.some(t => t.type === 'anchor' && t.value === '$')
  const hasAlternation = tokens.some(t => t.type === 'alternation')
  const hasLookahead = tokens.some(t => t.type === 'lookahead')
  const hasLookbehind = tokens.some(t => t.type === 'lookbehind')
  const captureGroups = tokens.filter(t => t.type === 'group' && !t.value.startsWith('(?:'))

  if (hasStartAnchor && hasEndAnchor) {
    parts.push('Matches the entire string')
  } else if (hasStartAnchor) {
    parts.push('Matches from the start of the string')
  } else if (hasEndAnchor) {
    parts.push('Matches at the end of the string')
  }

  if (hasAlternation) {
    parts.push('Contains alternation (OR logic)')
  }

  if (hasLookahead || hasLookbehind) {
    parts.push('Uses zero-width assertions')
  }

  if (captureGroups.length > 0) {
    parts.push(`Contains ${captureGroups.length} capture group${captureGroups.length > 1 ? 's' : ''}`)
  }

  if (parts.length === 0) {
    parts.push('Matches a pattern in the text')
  }

  return `${parts.join('. ')}.`
}

/**
 * Convert tokens to RegexElement format for the UI
 */
function tokensToElements(tokens: Token[]): RegexElement[] {
  return tokens.map(token => ({
    type: token.type,
    value: token.value,
    description: token.description + (token.details ? ` - ${token.details}` : ''),
    position: { start: token.start, end: token.end },
  }))
}

/**
 * Main function to explain a regex pattern
 */
export function explainPattern(pattern: string): ExplanationResult {
  if (!pattern) {
    return {
      elements: [],
      description: 'Enter a regex pattern to see its explanation.',
    }
  }

  try {
    const tokens = tokenizePattern(pattern)
    const elements = tokensToElements(tokens)
    const description = generateOverallDescription(tokens)

    return {
      elements,
      description,
    }
  } catch (error) {
    return {
      elements: [],
      description: `Unable to parse pattern: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Get explanation for a specific element type (for help panel)
 */
export function getElementTypeDescription(type: RegexElementType): string {
  const descriptions: Record<RegexElementType, string> = {
    'literal': 'Literal characters match themselves exactly in the text.',
    'quantifier': 'Quantifiers specify how many times the preceding element should match.',
    'character-class': 'Character classes match any single character from a set of characters.',
    'predefined-class': 'Predefined classes are shortcuts for common character sets.',
    'anchor': 'Anchors match positions in the text rather than characters.',
    'group': 'Groups combine multiple elements and can capture matched text.',
    'lookahead': 'Lookahead assertions check what follows without consuming characters.',
    'lookbehind': 'Lookbehind assertions check what precedes without consuming characters.',
    'alternation': 'Alternation allows matching one pattern or another.',
    'escape': 'Escape sequences represent special or literal characters.',
    'backreference': 'Backreferences match the same text as a previous capture group.',
    'flag': 'Flags modify the overall behavior of the regex pattern.',
  }
  return descriptions[type]
}
