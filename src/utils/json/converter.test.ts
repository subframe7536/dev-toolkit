import { describe, expect, test } from 'bun:test'
import {
  jsObjectToJSON,
  jsonToJavaClass,
  jsonToJSObject,
  jsonToQueryParams,
  jsonToTSInterface,
  jsonToYAML,
  queryParamsToJSON,
  yamlToJSON,
} from './converter'

describe('JSON Converter', () => {
  const sampleJSON = '{"name":"John","age":30,"active":true}'
  const sampleObject = { name: 'John', age: 30, active: true }

  describe('jsonToYAML', () => {
    test('converts JSON to YAML', () => {
      const result = jsonToYAML(sampleJSON)
      expect(result.success).toBe(true)
      expect(result.output).toContain('name: John')
      expect(result.output).toContain('age: 30')
    })

    test('handles invalid JSON', () => {
      const result = jsonToYAML('invalid json')
      expect(result.success).toBe(false)
      expect(result.error?.message).toBeTruthy()
    })
  })

  describe('yamlToJSON', () => {
    test('converts YAML to JSON', () => {
      const yaml = 'name: John\nage: 30\nactive: true'
      const result = yamlToJSON(yaml)
      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.output!)
      expect(parsed.name).toBe('John')
      expect(parsed.age).toBe(30)
    })
  })

  describe('jsonToQueryParams', () => {
    test('converts JSON to query parameters', () => {
      const result = jsonToQueryParams(sampleJSON)
      expect(result.success).toBe(true)
      expect(result.output).toContain('name=John')
      expect(result.output).toContain('age=30')
      expect(result.output).toContain('active=true')
    })

    test('handles arrays', () => {
      const result = jsonToQueryParams('[]')
      expect(result.success).toBe(false)
    })
  })

  describe('queryParamsToJSON', () => {
    test('converts query parameters to JSON', () => {
      const result = queryParamsToJSON('name=John&age=30&active=true')
      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.output!)
      expect(parsed.name).toBe('John')
      expect(parsed.age).toBe(30)
      expect(parsed.active).toBe(true)
    })

    test('handles leading question mark', () => {
      const result = queryParamsToJSON('?name=John&age=30')
      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.output!)
      expect(parsed.name).toBe('John')
    })
  })

  describe('jsonToJSObject', () => {
    test('converts JSON to JS object literal', () => {
      const result = jsonToJSObject(sampleJSON)
      expect(result.success).toBe(true)
      expect(result.output).toContain('name:')
      expect(result.output).toContain("'John'")
      expect(result.output).not.toContain('"name"')
    })
  })

  describe('jsObjectToJSON', () => {
    test('converts JS object to JSON', () => {
      const jsObj = "{ name: 'John', age: 30, active: true }"
      const result = jsObjectToJSON(jsObj)
      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.output!)
      expect(parsed.name).toBe('John')
      expect(parsed.age).toBe(30)
    })

    test('handles invalid JS object', () => {
      const result = jsObjectToJSON('invalid object')
      expect(result.success).toBe(false)
    })
  })

  describe('jsonToTSInterface', () => {
    test('generates TypeScript interface', () => {
      const result = jsonToTSInterface(sampleJSON)
      expect(result.success).toBe(true)
      expect(result.output).toContain('export interface Root')
      expect(result.output).toContain('name: string')
      expect(result.output).toContain('age: number')
      expect(result.output).toContain('active: boolean')
    })

    test('handles arrays', () => {
      const result = jsonToTSInterface('[1, 2, 3]')
      expect(result.success).toBe(true)
      expect(result.output).toContain('number[]')
    })
  })

  describe('jsonToJavaClass', () => {
    test('generates Java class', () => {
      const result = jsonToJavaClass(sampleJSON)
      expect(result.success).toBe(true)
      expect(result.output).toContain('public class Root')
      expect(result.output).toContain('private String name')
      expect(result.output).toContain('private Integer age')
      expect(result.output).toContain('private Boolean active')
      expect(result.output).toContain('getName()')
      expect(result.output).toContain('setName(')
    })
  })
})
