import { describe, expect, it } from 'bun:test'

import { inferDataType } from './type-inference'

describe('inferDataType', () => {
  it('should infer integer type for integer values', () => {
    expect(inferDataType([1, 2, 3, 4, 5])).toBe('integer')
    expect(inferDataType(['1', '2', '3'])).toBe('integer')
    expect(inferDataType(['-5', '0', '100'])).toBe('integer')
  })

  it('should infer decimal type for decimal values', () => {
    expect(inferDataType([1.5, 2.7, 3.14])).toBe('decimal')
    expect(inferDataType(['1.5', '2.7', '3.14'])).toBe('decimal')
    expect(inferDataType([1, 2.5, 3])).toBe('decimal') // Mixed integers and decimals
  })

  it('should infer boolean type for boolean values', () => {
    expect(inferDataType([true, false, true])).toBe('boolean')
    expect(inferDataType(['true', 'false', 'true'])).toBe('boolean')
    // Note: '1' and '0' are inferred as integers, not booleans (integers take precedence)
    expect(inferDataType(['1', '0', '1'])).toBe('integer')
    expect(inferDataType([1, 0, 1])).toBe('integer')
  })

  it('should infer date type for date values', () => {
    expect(inferDataType(['2024-01-15', '2024-02-20', '2024-03-25'])).toBe('date')
    expect(inferDataType(['01/15/2024', '02/20/2024'])).toBe('date')
  })

  it('should infer datetime type for datetime values', () => {
    expect(inferDataType(['2024-01-15 10:30:00', '2024-02-20 14:45:00'])).toBe('datetime')
    expect(inferDataType(['2024-01-15T10:30:00', '2024-02-20T14:45:00'])).toBe('datetime')
  })

  it('should default to string type for mixed or string values', () => {
    expect(inferDataType(['hello', 'world'])).toBe('string')
    expect(inferDataType([1, 'two', 3])).toBe('string')
    expect(inferDataType([])).toBe('string')
    expect(inferDataType([null, null])).toBe('string')
  })

  // Example tests for Requirements 12.4 and 12.5
  describe('Requirement 12.4: Integer detection', () => {
    it('should detect positive integers', () => {
      expect(inferDataType([1, 2, 3, 100, 999])).toBe('integer')
    })

    it('should detect negative integers', () => {
      expect(inferDataType([-1, -5, -100])).toBe('integer')
    })

    it('should detect zero as integer', () => {
      expect(inferDataType([0, 0, 0])).toBe('integer')
    })

    it('should detect integers from string representations', () => {
      expect(inferDataType(['42', '100', '999'])).toBe('integer')
    })

    it('should detect mixed positive and negative integers', () => {
      expect(inferDataType([-10, 0, 10, -5, 25])).toBe('integer')
    })

    it('should detect integers with leading/trailing whitespace', () => {
      expect(inferDataType([' 42 ', '  100', '999  '])).toBe('integer')
    })

    it('should detect large integers', () => {
      expect(inferDataType([1000000, 9999999, -8888888])).toBe('integer')
    })

    it('should detect integers with null values present', () => {
      expect(inferDataType([1, 2, null, 3, null, 4])).toBe('integer')
    })
  })

  describe('Requirement 12.5: String detection', () => {
    it('should detect alphabetic strings', () => {
      expect(inferDataType(['hello', 'world', 'test'])).toBe('string')
    })

    it('should detect alphanumeric strings', () => {
      expect(inferDataType(['user123', 'item456', 'code789'])).toBe('string')
    })

    it('should detect strings with special characters', () => {
      expect(inferDataType(['hello@world.com', 'user#123', 'test$value'])).toBe('string')
    })

    it('should detect strings with spaces', () => {
      expect(inferDataType(['hello world', 'test string', 'multiple words here'])).toBe('string')
    })

    it('should detect empty strings as string type', () => {
      expect(inferDataType(['', '', ''])).toBe('string')
    })

    it('should detect mixed content as string type', () => {
      expect(inferDataType([1, 'two', 3, 'four'])).toBe('string')
    })

    it('should detect strings that look like numbers but have extra characters', () => {
      expect(inferDataType(['123abc', '456def', '789xyz'])).toBe('string')
    })

    it('should detect strings with punctuation', () => {
      expect(inferDataType(['Hello, World!', 'Test: Value', 'Item (1)'])).toBe('string')
    })

    it('should detect strings with null values present', () => {
      expect(inferDataType(['hello', null, 'world', null, 'test'])).toBe('string')
    })

    it('should detect long text strings', () => {
      expect(inferDataType([
        'This is a long text string with multiple words',
        'Another long string for testing purposes',
        'Yet another string to verify string detection',
      ])).toBe('string')
    })
  })
})
