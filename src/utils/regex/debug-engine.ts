import type { DebugSession, DebugStep, RegexFlags } from './types'

import { flagsToString } from './match-engine'

/**
 * Simulates regex matching step-by-step for educational visualization.
 * Note: This is a simplified simulation that demonstrates the concept of regex matching,
 * not an exact replication of the JavaScript regex engine's internal behavior.
 */

interface PatternToken {
  type: 'literal' | 'charClass' | 'quantifier' | 'anchor' | 'group' | 'alternation' | 'escape' | 'dot'
  value: string
  position: number
  length: number
  description: string
}

/**
 * Tokenize a regex pattern into meaningful elements for step visualization
 */
function tokenizePattern(pattern: string): PatternToken[] {
  const tokens: PatternToken[] = []
  let i = 0

  while (i < pattern.length) {
    const char = pattern[i]

    // Escape sequences
    if (char === '\\' && i + 1 < pattern.length) {
      const nextChar = pattern[i + 1]
      const escapeMap: Record<string, string> = {
        d: 'digit (0-9)',
        D: 'non-digit',
        w: 'word character (a-z, A-Z, 0-9, _)',
        W: 'non-word character',
        s: 'whitespace',
        S: 'non-whitespace',
        b: 'word boundary',
        B: 'non-word boundary',
        n: 'newline',
        r: 'carriage return',
        t: 'tab',
      }

      tokens.push({
        type: 'escape',
        value: pattern.slice(i, i + 2),
        position: i,
        length: 2,
        description: escapeMap[nextChar] || `escaped "${nextChar}"`,
      })
      i += 2
      continue
    }

    // Character classes [...]
    if (char === '[') {
      let end = i + 1
      let isNegated = false
      if (pattern[end] === '^') {
        isNegated = true
        end++
      }
      while (end < pattern.length && pattern[end] !== ']') {
        if (pattern[end] === '\\') {
          end++
        }
        end++
      }
      end++ // Include closing bracket
      const classContent = pattern.slice(i, end)
      tokens.push({
        type: 'charClass',
        value: classContent,
        position: i,
        length: end - i,
        description: isNegated ? `any character NOT in ${classContent}` : `any character in ${classContent}`,
      })
      i = end
      continue
    }

    // Groups (...)
    if (char === '(') {
      let depth = 1
      let end = i + 1
      while (end < pattern.length && depth > 0) {
        if (pattern[end] === '\\') {
          end++
        } else if (pattern[end] === '(') {
          depth++
        } else if (pattern[end] === ')') {
          depth--
        }
        end++
      }
      const groupContent = pattern.slice(i, end)
      let groupType = 'capturing group'
      if (groupContent.startsWith('(?:')) {
        groupType = 'non-capturing group'
      } else if (groupContent.startsWith('(?=')) {
        groupType = 'positive lookahead'
      } else if (groupContent.startsWith('(?!')) {
        groupType = 'negative lookahead'
      } else if (groupContent.startsWith('(?<=')) {
        groupType = 'positive lookbehind'
      } else if (groupContent.startsWith('(?<!')) {
        groupType = 'negative lookbehind'
      } else if (groupContent.startsWith('(?<')) {
        const nameMatch = groupContent.match(/^\(\?<([^>]+)>/)
        if (nameMatch) {
          groupType = `named group "${nameMatch[1]}"`
        }
      }
      tokens.push({
        type: 'group',
        value: groupContent,
        position: i,
        length: end - i,
        description: groupType,
      })
      i = end
      continue
    }

    // Quantifiers
    if (char === '*' || char === '+' || char === '?') {
      const isLazy = pattern[i + 1] === '?'
      const quantifierMap: Record<string, string> = {
        '*': 'zero or more',
        '+': 'one or more',
        '?': 'zero or one',
      }
      tokens.push({
        type: 'quantifier',
        value: isLazy ? `${char}?` : char,
        position: i,
        length: isLazy ? 2 : 1,
        description: `${quantifierMap[char]}${isLazy ? ' (lazy)' : ' (greedy)'}`,
      })
      i += isLazy ? 2 : 1
      continue
    }

    // Range quantifiers {n,m}
    if (char === '{') {
      const match = pattern.slice(i).match(/^\{(\d+)(,(\d*))?\}\??/)
      if (match) {
        const isLazy = match[0].endsWith('?')
        let desc = ''
        if (match[2] === undefined) {
          desc = `exactly ${match[1]} times`
        } else if (match[3] === '') {
          desc = `${match[1]} or more times`
        } else {
          desc = `between ${match[1]} and ${match[3]} times`
        }
        tokens.push({
          type: 'quantifier',
          value: match[0],
          position: i,
          length: match[0].length,
          description: `${desc}${isLazy ? ' (lazy)' : ' (greedy)'}`,
        })
        i += match[0].length
        continue
      }
    }

    // Anchors
    if (char === '^') {
      tokens.push({
        type: 'anchor',
        value: '^',
        position: i,
        length: 1,
        description: 'start of string/line',
      })
      i++
      continue
    }

    if (char === '$') {
      tokens.push({
        type: 'anchor',
        value: '$',
        position: i,
        length: 1,
        description: 'end of string/line',
      })
      i++
      continue
    }

    // Alternation
    if (char === '|') {
      tokens.push({
        type: 'alternation',
        value: '|',
        position: i,
        length: 1,
        description: 'OR (alternation)',
      })
      i++
      continue
    }

    // Dot (any character)
    if (char === '.') {
      tokens.push({
        type: 'dot',
        value: '.',
        position: i,
        length: 1,
        description: 'any character (except newline)',
      })
      i++
      continue
    }

    // Literal character
    tokens.push({
      type: 'literal',
      value: char,
      position: i,
      length: 1,
      description: `literal "${char}"`,
    })
    i++
  }

  return tokens
}

/**
 * Generate debug steps for a regex pattern matching against text.
 * This simulates the matching process for educational purposes.
 */
export function generateDebugSteps(
  pattern: string,
  flags: RegexFlags,
  text: string,
): DebugSession {
  const steps: DebugStep[] = []

  if (!pattern || !text) {
    return {
      steps: [],
      currentStepIndex: -1,
      isPlaying: false,
      playSpeed: 500,
      finalResult: 'pending',
    }
  }

  try {
    const flagString = flagsToString(flags)
    const regex = new RegExp(pattern, flagString)
    const tokens = tokenizePattern(pattern)

    // Initial step
    steps.push({
      stepNumber: 0,
      patternPosition: 0,
      textPosition: 0,
      action: 'start',
      description: 'Starting regex match',
      patternElement: pattern,
      isBacktrack: false,
    })

    // Try to match at each position in the text
    let textPos = 0
    let matchFound = false
    let matchStart = -1
    let matchEnd = -1

    while (textPos <= text.length && !matchFound) {
      // Try matching from current position
      regex.lastIndex = textPos
      const match = regex.exec(text)

      if (match && match.index === textPos) {
        // Found a match starting at this position
        matchFound = true
        matchStart = match.index
        matchEnd = match.index + match[0].length

        // Generate steps for successful match
        let currentTextPos = textPos

        for (const token of tokens) {
          // Skip quantifiers as they modify previous token
          if (token.type === 'quantifier') {
            steps.push({
              stepNumber: steps.length,
              patternPosition: token.position,
              textPosition: currentTextPos,
              action: 'match',
              description: `Applying quantifier: ${token.description}`,
              patternElement: token.value,
              isBacktrack: false,
            })
            continue
          }

          // Handle anchors
          if (token.type === 'anchor') {
            const anchorSuccess = token.value === '^'
              ? (currentTextPos === 0 || (flags.multiline && text[currentTextPos - 1] === '\n'))
              : (currentTextPos === text.length || (flags.multiline && text[currentTextPos] === '\n'))

            steps.push({
              stepNumber: steps.length,
              patternPosition: token.position,
              textPosition: currentTextPos,
              action: anchorSuccess ? 'match' : 'fail',
              description: `Checking ${token.description}`,
              patternElement: token.value,
              isBacktrack: false,
            })
            continue
          }

          // For other tokens, simulate matching
          if (currentTextPos < matchEnd) {
            const matchedChar = text[currentTextPos]
            steps.push({
              stepNumber: steps.length,
              patternPosition: token.position,
              textPosition: currentTextPos,
              action: 'match',
              description: `Matching ${token.description} against "${matchedChar}"`,
              patternElement: token.value,
              matchedText: matchedChar,
              isBacktrack: false,
            })
            currentTextPos++
          }
        }

        // Final success step
        steps.push({
          stepNumber: steps.length,
          patternPosition: pattern.length,
          textPosition: matchEnd,
          action: 'success',
          description: `Match found: "${match[0]}" at position ${matchStart}-${matchEnd}`,
          patternElement: '',
          matchedText: match[0],
          isBacktrack: false,
        })
      } else if (match && match.index > textPos) {
        // No match at current position, advance
        steps.push({
          stepNumber: steps.length,
          patternPosition: 0,
          textPosition: textPos,
          action: 'advance',
          description: `No match at position ${textPos}, advancing to next position`,
          patternElement: pattern,
          isBacktrack: false,
        })
        textPos++
      } else {
        // No match found at all from this position
        if (textPos < text.length) {
          steps.push({
            stepNumber: steps.length,
            patternPosition: 0,
            textPosition: textPos,
            action: 'advance',
            description: `No match at position ${textPos}, trying next position`,
            patternElement: pattern,
            isBacktrack: false,
          })
        }
        textPos++
      }
    }

    // If no match was found
    if (!matchFound) {
      steps.push({
        stepNumber: steps.length,
        patternPosition: 0,
        textPosition: text.length,
        action: 'fail',
        description: 'No match found in the entire text',
        patternElement: pattern,
        isBacktrack: false,
      })
    }

    return {
      steps,
      currentStepIndex: 0,
      isPlaying: false,
      playSpeed: 500,
      finalResult: matchFound ? 'success' : 'failure',
      matchStart: matchFound ? matchStart : undefined,
      matchEnd: matchFound ? matchEnd : undefined,
    }
  } catch {
    return {
      steps: [{
        stepNumber: 0,
        patternPosition: 0,
        textPosition: 0,
        action: 'fail',
        description: 'Invalid regex pattern',
        patternElement: pattern,
        isBacktrack: false,
      }],
      currentStepIndex: 0,
      isPlaying: false,
      playSpeed: 500,
      finalResult: 'failure',
    }
  }
}

/**
 * Get the action color for visualization
 */
export function getActionColor(action: DebugStep['action']): string {
  switch (action) {
    case 'match':
      return 'text-green-600 dark:text-green-400'
    case 'backtrack':
      return 'text-orange-600 dark:text-orange-400'
    case 'advance':
      return 'text-blue-600 dark:text-blue-400'
    case 'fail':
      return 'text-red-600 dark:text-red-400'
    case 'success':
      return 'text-green-600 dark:text-green-400'
    case 'start':
      return 'text-muted-foreground'
    default:
      return 'text-foreground'
  }
}

/**
 * Get the action icon for visualization
 */
export function getActionIcon(action: DebugStep['action']): `lucide:${string}` {
  switch (action) {
    case 'match':
      return 'lucide:check'
    case 'backtrack':
      return 'lucide:undo-2'
    case 'advance':
      return 'lucide:arrow-right'
    case 'fail':
      return 'lucide:x'
    case 'success':
      return 'lucide:check-circle'
    case 'start':
      return 'lucide:play'
    default:
      return 'lucide:circle'
  }
}

/**
 * Get background color for action type
 */
export function getActionBgColor(action: DebugStep['action']): string {
  switch (action) {
    case 'match':
      return 'bg-green-100 dark:bg-green-900/30'
    case 'backtrack':
      return 'bg-orange-100 dark:bg-orange-900/30'
    case 'advance':
      return 'bg-blue-100 dark:bg-blue-900/30'
    case 'fail':
      return 'bg-red-100 dark:bg-red-900/30'
    case 'success':
      return 'bg-green-100 dark:bg-green-900/30'
    case 'start':
      return 'bg-muted'
    default:
      return 'bg-muted'
  }
}
