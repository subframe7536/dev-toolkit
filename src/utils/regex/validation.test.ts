import { describe, expect, test } from 'bun:test'

import fc from 'fast-check'

/**
 * Property 3: Pattern validation matches JavaScript RegExp behavior
 * **Feature: regex-visualizer, Property 3: Pattern validation matches JavaScript RegExp behavior**
 * **Validates: Requirements 1.3, 2.1**
 */

// Helper function to validate regex pattern using JavaScript RegExp
function validateRegexPattern(pattern: string, flags: string = ''): { isValid: boolean, error?: string } {
  try {
    void new RegExp(pattern, flags)
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Generator for valid regex patterns
const validRegexPatterns = fc.oneof(
  fc.constant('hello'),
  fc.constant('\\d+'),
  fc.constant('[a-z]+'),
  fc.constant('(test|demo)'),
  fc.constant('\\w*'),
  fc.constant('^start'),
  fc.constant('end$'),
  fc.constant('a{2,5}'),
  fc.constant('\\s+'),
  fc.constant('.+'),
  fc.constant('a|b'),
  fc.constant('(?:group)'),
  fc.constant('\\b\\w+\\b'),
)

// Generator for invalid regex patterns
const invalidRegexPatterns = fc.oneof(
  fc.constant('[unclosed'),
  fc.constant('(unclosed'),
  fc.constant('*invalid'),
  fc.constant('+invalid'),
  fc.constant('?invalid'),
  fc.constant('{invalid'),
  fc.constant('\\'),
  fc.constant('['),
  fc.constant('('),
  fc.constant('{1,}invalid'),
)

// Generator for regex flags
const regexFlags = fc.oneof(
  fc.constant(''),
  fc.constant('g'),
  fc.constant('i'),
  fc.constant('m'),
  fc.constant('s'),
  fc.constant('u'),
  fc.constant('y'),
  fc.constant('gi'),
  fc.constant('gim'),
  fc.constant('gims'),
)

describe('Regex Pattern Validation', () => {
  test('Property 3: Valid patterns should be consistently validated', () => {
    fc.assert(
      fc.property(validRegexPatterns, regexFlags, (pattern, flags) => {
        const result = validateRegexPattern(pattern, flags)

        // Valid patterns should always be valid
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()

        // Should be able to create RegExp instance
        expect(() => new RegExp(pattern, flags)).not.toThrow()
      }),
      { numRuns: 100 },
    )
  })

  test('Property 3: Invalid patterns should be consistently rejected', () => {
    fc.assert(
      fc.property(invalidRegexPatterns, regexFlags, (pattern, flags) => {
        const result = validateRegexPattern(pattern, flags)

        // Invalid patterns should always be invalid
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
        expect(typeof result.error).toBe('string')

        // Should throw when creating RegExp instance
        expect(() => new RegExp(pattern, flags)).toThrow()
      }),
      { numRuns: 100 },
    )
  })

  test('Property 3: Validation behavior matches RegExp constructor', () => {
    fc.assert(
      fc.property(
        fc.oneof(validRegexPatterns, invalidRegexPatterns),
        regexFlags,
        (pattern, flags) => {
          const validationResult = validateRegexPattern(pattern, flags)

          let regexpThrows = false
          let regexpError = ''

          try {
            void new RegExp(pattern, flags)
          } catch (error) {
            regexpThrows = true
            regexpError = error instanceof Error ? error.message : 'Unknown error'
          }

          // Validation result should match RegExp constructor behavior
          expect(validationResult.isValid).toBe(!regexpThrows)

          if (regexpThrows) {
            expect(validationResult.error).toBeDefined()
            // Error messages should be consistent (both from same source)
            expect(validationResult.error).toBe(regexpError)
          } else {
            expect(validationResult.error).toBeUndefined()
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  test('Property 3: Empty pattern should be valid', () => {
    const result = validateRegexPattern('')
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  test('Property 3: Flag combinations should be handled consistently', () => {
    fc.assert(
      fc.property(
        fc.constant('test'),
        fc.subarray(['g', 'i', 'm', 's', 'u', 'y']),
        (pattern, flagArray) => {
          const flags = flagArray.join('')
          const result = validateRegexPattern(pattern, flags)

          // Simple pattern with any flag combination should be valid
          expect(result.isValid).toBe(true)
          expect(result.error).toBeUndefined()
          expect(() => new RegExp(pattern, flags)).not.toThrow()
        },
      ),
      { numRuns: 100 },
    )
  })
})
