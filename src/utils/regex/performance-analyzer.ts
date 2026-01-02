import type { MatchResult, PerformanceResult, PerformanceWarning, RegexFlags } from './types'

import { flagsToString } from './match-engine'

// Timeout threshold in milliseconds
const EXECUTION_TIMEOUT_MS = 5000
const WARNING_THRESHOLD_MS = 100

// Patterns known to cause catastrophic backtracking
const CATASTROPHIC_PATTERNS = [
  // Nested quantifiers with overlapping character classes
  /\([^)]*[+*]\)[+*]/,
  // Repeated groups with alternation
  /\([^)|]*\|[^)]*\)[+*]/,
  // Multiple adjacent quantifiers on similar patterns
  /\.\*.*\.\*/,
  /\.\+.*\.\+/,
  // Exponential backtracking patterns
  /\([^)]*\+\)[^)]*\+/,
]

// Patterns that may cause performance issues
const RISKY_PATTERNS = [
  // Greedy quantifiers followed by similar patterns
  { pattern: /\.\*[^$]/, message: 'Greedy .* followed by more content may cause excessive backtracking' },
  { pattern: /\.\+[^$]/, message: 'Greedy .+ followed by more content may cause excessive backtracking' },
  // Nested groups with quantifiers
  { pattern: /\([^()]*\([^)]*[+*]/, message: 'Nested groups with quantifiers can be slow' },
  // Multiple alternations
  { pattern: /\|.*\|.*\|.*\|/, message: 'Multiple alternations may impact performance' },
  // Unbounded repetition
  { pattern: /\{\d+,\}/, message: 'Unbounded repetition may be slow on large inputs' },
]

/**
 * Detect potentially catastrophic backtracking patterns
 */
export function detectBacktrackingRisk(pattern: string): PerformanceWarning[] {
  const warnings: PerformanceWarning[] = []

  // Check for catastrophic patterns
  for (const catastrophicPattern of CATASTROPHIC_PATTERNS) {
    if (catastrophicPattern.test(pattern)) {
      warnings.push({
        type: 'backtracking',
        message: 'Pattern may cause catastrophic backtracking',
        suggestion: 'Consider using atomic groups, possessive quantifiers, or restructuring the pattern',
      })
      break
    }
  }

  // Check for risky patterns
  for (const { pattern: riskyPattern, message } of RISKY_PATTERNS) {
    if (riskyPattern.test(pattern)) {
      warnings.push({
        type: 'complexity',
        message,
        suggestion: 'Consider using non-greedy quantifiers (*?, +?) or more specific character classes',
      })
    }
  }

  return warnings
}

/**
 * Analyze pattern complexity
 */
export function analyzePatternComplexity(pattern: string): { score: number, factors: string[] } {
  const factors: string[] = []
  let score = 0

  // Count quantifiers
  const quantifierCount = (pattern.match(/[+*?]|\{\d+(?:,\d*)?\}/g) || []).length
  if (quantifierCount > 5) {
    score += quantifierCount * 2
    factors.push(`${quantifierCount} quantifiers`)
  }

  // Count groups
  const groupCount = (pattern.match(/\(/g) || []).length
  if (groupCount > 3) {
    score += groupCount * 3
    factors.push(`${groupCount} groups`)
  }

  // Count alternations
  const alternationCount = (pattern.match(/\|/g) || []).length
  if (alternationCount > 2) {
    score += alternationCount * 4
    factors.push(`${alternationCount} alternations`)
  }

  // Check for lookahead/lookbehind
  const lookaroundCount = (pattern.match(/\(\?[=!<]/g) || []).length
  if (lookaroundCount > 0) {
    score += lookaroundCount * 5
    factors.push(`${lookaroundCount} lookaround assertions`)
  }

  // Check for backreferences
  const backreferenceCount = (pattern.match(/\\[1-9]/g) || []).length
  if (backreferenceCount > 0) {
    score += backreferenceCount * 6
    factors.push(`${backreferenceCount} backreferences`)
  }

  return { score, factors }
}

/**
 * Execute regex with timeout protection
 */
function executeWithTimeout<T>(
  fn: () => T,
  timeoutMs: number,
): { result: T | null, timedOut: boolean, executionTime: number } {
  const startTime = performance.now()

  try {
    const result = fn()
    const executionTime = performance.now() - startTime

    return {
      result,
      timedOut: executionTime > timeoutMs,
      executionTime,
    }
  } catch {
    return {
      result: null,
      timedOut: false,
      executionTime: performance.now() - startTime,
    }
  }
}

/**
 * Find matches with performance measurement
 */
export function findMatchesWithPerformance(
  pattern: string,
  flags: RegexFlags,
  text: string,
): { matches: MatchResult[], performance: PerformanceResult } {
  const warnings: PerformanceWarning[] = []

  // Pre-execution analysis
  const backtrackingWarnings = detectBacktrackingRisk(pattern)
  warnings.push(...backtrackingWarnings)

  const complexity = analyzePatternComplexity(pattern)
  if (complexity.score > 20) {
    warnings.push({
      type: 'complexity',
      message: `High pattern complexity (score: ${complexity.score})`,
      suggestion: `Complexity factors: ${complexity.factors.join(', ')}`,
    })
  }

  // Execute with timing
  const flagString = flagsToString(flags)
  let matches: MatchResult[] = []
  let steps = 0

  const { result, timedOut, executionTime } = executeWithTimeout(() => {
    const regex = new RegExp(pattern, flagString)
    const foundMatches: MatchResult[] = []

    if (flags.global) {
      let matchIndex = 0
      const maxIterations = 10000

      for (let i = 0; i < maxIterations; i++) {
        const match = regex.exec(text)
        if (match === null) {
          break
        }

        steps++
        foundMatches.push({
          index: matchIndex++,
          fullMatch: match[0],
          groups: extractGroups(match, text),
          start: match.index,
          end: match.index + match[0].length,
        })

        if (match[0].length === 0) {
          regex.lastIndex++
        }
      }
    } else {
      const match = regex.exec(text)
      if (match) {
        steps = 1
        foundMatches.push({
          index: 0,
          fullMatch: match[0],
          groups: extractGroups(match, text),
          start: match.index,
          end: match.index + match[0].length,
        })
      }
    }

    return foundMatches
  }, EXECUTION_TIMEOUT_MS)

  if (timedOut) {
    warnings.push({
      type: 'timeout',
      message: `Execution exceeded ${EXECUTION_TIMEOUT_MS}ms threshold`,
      suggestion: 'Consider simplifying the pattern or reducing input size',
    })
  }

  if (executionTime > WARNING_THRESHOLD_MS && !timedOut) {
    warnings.push({
      type: 'complexity',
      message: `Execution took ${executionTime.toFixed(2)}ms`,
      suggestion: 'Pattern may be slow on larger inputs',
    })
  }

  matches = result || []

  // Estimate backtracking based on execution time vs input size
  const expectedTime = text.length * 0.001 // ~1ms per 1000 chars baseline
  const backtrackingDetected = executionTime > expectedTime * 10 && executionTime > 10

  return {
    matches,
    performance: {
      executionTime,
      steps,
      backtrackingDetected,
      warnings,
    },
  }
}

/**
 * Extract capture groups from a match
 */
function extractGroups(match: RegExpExecArray, text: string): MatchResult['groups'] {
  const groups: MatchResult['groups'] = []

  for (let i = 1; i < match.length; i++) {
    const groupValue = match[i]
    if (groupValue === undefined) {
      continue
    }

    let groupStart = text.indexOf(groupValue, match.index)
    if (groupStart === -1 || groupStart >= match.index + match[0].length) {
      const relativePos = match[0].indexOf(groupValue)
      if (relativePos !== -1) {
        groupStart = match.index + relativePos
      } else {
        continue
      }
    }

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
      end: groupStart + groupValue.length,
    })
  }

  return groups
}
