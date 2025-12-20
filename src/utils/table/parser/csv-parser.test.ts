import { describe, expect, test } from 'bun:test'

import { detectTSVFormat, parseCSVText, parseTSVText } from './csv-parser'

describe('parseTSVText', () => {
  test('should parse tab-separated values (Excel copy/paste format)', () => {
    const input = 'id\tname\tage\n1\tAlice\t30\n2\tBob\t25'

    const result = parseTSVText(input, true)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data?.columns).toHaveLength(3)
    expect(result.data?.columns[0].name).toBe('id')
    expect(result.data?.columns[1].name).toBe('name')
    expect(result.data?.columns[2].name).toBe('age')
    expect(result.data?.rows).toHaveLength(2)
  })

  test('should handle TSV with empty cells', () => {
    const input = 'id\tname\tage\n1\tAlice\t\n2\t\t25'

    const result = parseTSVText(input, true)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data?.rows).toHaveLength(2)

    const firstRow = result.data?.rows[0]
    const secondRow = result.data?.rows[1]

    expect(firstRow).toBeDefined()
    expect(secondRow).toBeDefined()

    // Check that empty cells are null
    const ageCol = result.data?.columns.find(c => c.name === 'age')
    const nameCol = result.data?.columns.find(c => c.name === 'name')

    expect(ageCol).toBeDefined()
    expect(nameCol).toBeDefined()

    if (firstRow && ageCol) {
      expect(firstRow.cells[ageCol.id]).toBeNull()
    }

    if (secondRow && nameCol) {
      expect(secondRow.cells[nameCol.id]).toBeNull()
    }
  })

  test('should handle empty TSV input', () => {
    const result = parseTSVText('', true)

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe('Please paste TSV text.')
  })

  test('should handle TSV with only headers', () => {
    const input = 'id\tname\tage'

    const result = parseTSVText(input, true)

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe('TSV contains only headers with no data rows.')
  })
})

describe('detectTSVFormat', () => {
  test('should detect tab-separated format', () => {
    const input = 'id\tname\tage\n1\tAlice\t30\n2\tBob\t25'

    expect(detectTSVFormat(input)).toBe(true)
  })

  test('should not detect CSV as TSV', () => {
    const input = 'id,name,age\n1,Alice,30\n2,Bob,25'

    expect(detectTSVFormat(input)).toBe(false)
  })

  test('should detect TSV even with some commas in values', () => {
    const input = 'id\tname\tage\n1\tAlice, Smith\t30\n2\tBob\t25'

    expect(detectTSVFormat(input)).toBe(true)
  })

  test('should handle empty input', () => {
    expect(detectTSVFormat('')).toBe(false)
  })

  test('should handle single line input', () => {
    const input = 'id\tname\tage'

    expect(detectTSVFormat(input)).toBe(false)
  })
})

describe('parseCSVText', () => {
  test('should still parse CSV correctly', () => {
    const input = 'id,name,age\n1,Alice,30\n2,Bob,25'

    const result = parseCSVText(input, true)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data?.columns).toHaveLength(3)
    expect(result.data?.rows).toHaveLength(2)
  })
})
