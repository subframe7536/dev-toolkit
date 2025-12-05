import { describe, expect, test } from 'bun:test'

import { jsonToJavaClass, jsonToJSObject, jsonToTSDefinition } from './converter'

describe('jsonToJSObject', () => {
  test('converts simple JSON to JS object', () => {
    const input = '{"name": "John", "age": 30}'
    const result = jsonToJSObject(input)

    expect(result.success).toBe(true)
    expect(result.output).toContain('name: \'John\'')
    expect(result.output).toContain('age: 30')
  })

  test('handles nested objects', () => {
    const input = '{"user": {"name": "John", "age": 30}}'
    const result = jsonToJSObject(input)

    expect(result.success).toBe(true)
    expect(result.output).toContain('user: {')
    expect(result.output).toContain('name: \'John\'')
  })

  test('handles arrays', () => {
    const input = '{"items": [1, 2, 3]}'
    const result = jsonToJSObject(input)

    expect(result.success).toBe(true)
    expect(result.output).toContain('items: [')
  })

  test('repairs malformed JSON when useRepair is true', () => {
    const input = '{name: "John", age: 30}'
    const result = jsonToJSObject(input, true)

    expect(result.success).toBe(true)
  })
})

describe('jsonToTSDefinition', () => {
  test('generates TypeScript type definition', () => {
    const input = '{"name": "John", "age": 30, "active": true}'
    const result = jsonToTSDefinition(input)

    expect(result.success).toBe(true)
    expect(result.output).toContain('type Root')
    expect(result.output).toContain('name: string')
    expect(result.output).toContain('age: number')
    expect(result.output).toContain('active: boolean')
  })

  test('handles arrays', () => {
    const input = '{"items": [1, 2, 3]}'
    const result = jsonToTSDefinition(input)

    expect(result.success).toBe(true)
    expect(result.output).toContain('items: number[]')
  })
})

describe('jsonToJavaClass', () => {
  test('generates Java class', () => {
    const input = '{"name": "John", "age": 30}'
    const result = jsonToJavaClass(input)

    expect(result.success).toBe(true)
    expect(result.output).toContain('public class Root')
    expect(result.output).toContain('private String name')
    expect(result.output).toContain('private int age')
    expect(result.output).toContain('public String getName()')
    expect(result.output).toContain('public void setName(String name)')
  })

  test('handles non-object input', () => {
    const input = '[1, 2, 3]'
    const result = jsonToJavaClass(input)

    expect(result.success).toBe(true)
    expect(result.output).toContain('// JSON must be an object')
  })
})
