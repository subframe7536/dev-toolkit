import { describe, expect, test } from 'bun:test'

import { convertTextCase } from './text-case'

describe('convertTextCase', () => {
  const testInput = 'hello world example'

  test('converts to camelCase', () => {
    expect(convertTextCase(testInput, 'camelCase')).toBe('helloWorldExample')
    expect(convertTextCase('HelloWorld', 'camelCase')).toBe('helloWorld')
    expect(convertTextCase('hello_world', 'camelCase')).toBe('helloWorld')
  })

  test('converts to PascalCase', () => {
    expect(convertTextCase(testInput, 'PascalCase')).toBe('HelloWorldExample')
    expect(convertTextCase('helloWorld', 'PascalCase')).toBe('HelloWorld')
    expect(convertTextCase('hello_world', 'PascalCase')).toBe('HelloWorld')
  })

  test('converts to snake_case', () => {
    expect(convertTextCase(testInput, 'snake_case')).toBe('hello_world_example')
    expect(convertTextCase('HelloWorld', 'snake_case')).toBe('hello_world')
    expect(convertTextCase('helloWorld', 'snake_case')).toBe('hello_world')
  })

  test('converts to kebab-case', () => {
    expect(convertTextCase(testInput, 'kebab-case')).toBe('hello-world-example')
    expect(convertTextCase('HelloWorld', 'kebab-case')).toBe('hello-world')
    expect(convertTextCase('helloWorld', 'kebab-case')).toBe('hello-world')
  })

  test('converts to CONSTANT_CASE', () => {
    expect(convertTextCase(testInput, 'CONSTANT_CASE')).toBe('HELLO_WORLD_EXAMPLE')
    expect(convertTextCase('HelloWorld', 'CONSTANT_CASE')).toBe('HELLO_WORLD')
    expect(convertTextCase('helloWorld', 'CONSTANT_CASE')).toBe('HELLO_WORLD')
  })

  test('converts to dot.case', () => {
    expect(convertTextCase(testInput, 'dot.case')).toBe('hello.world.example')
    expect(convertTextCase('HelloWorld', 'dot.case')).toBe('hello.world')
    expect(convertTextCase('helloWorld', 'dot.case')).toBe('hello.world')
  })

  test('converts to path/case', () => {
    expect(convertTextCase(testInput, 'path/case')).toBe('hello/world/example')
    expect(convertTextCase('HelloWorld', 'path/case')).toBe('hello/world')
    expect(convertTextCase('helloWorld', 'path/case')).toBe('hello/world')
  })

  test('converts to Title Case', () => {
    expect(convertTextCase(testInput, 'Title Case')).toBe('Hello World Example')
    expect(convertTextCase('helloWorld', 'Title Case')).toBe('Hello World')
    expect(convertTextCase('hello_world', 'Title Case')).toBe('Hello World')
  })

  test('converts to Sentence case', () => {
    expect(convertTextCase(testInput, 'Sentence case')).toBe('Hello world example')
    expect(convertTextCase('helloWorld', 'Sentence case')).toBe('Hello world')
    expect(convertTextCase('HELLO_WORLD', 'Sentence case')).toBe('Hello world')
  })

  test('converts to lowercase', () => {
    expect(convertTextCase(testInput, 'lowercase')).toBe('helloworldexample')
    expect(convertTextCase('HelloWorld', 'lowercase')).toBe('helloworld')
  })

  test('converts to UPPERCASE', () => {
    expect(convertTextCase(testInput, 'UPPERCASE')).toBe('HELLOWORLDEXAMPLE')
    expect(convertTextCase('helloWorld', 'UPPERCASE')).toBe('HELLOWORLD')
  })

  test('converts to aLtErNaTiNg CaSe', () => {
    expect(convertTextCase('hello', 'aLtErNaTiNg CaSe')).toBe('hElLo')
    expect(convertTextCase('test', 'aLtErNaTiNg CaSe')).toBe('tEsT')
  })

  test('handles empty string', () => {
    expect(convertTextCase('', 'camelCase')).toBe('')
    expect(convertTextCase('', 'Title Case')).toBe('')
  })

  test('handles mixed delimiters', () => {
    expect(convertTextCase('hello-world_example', 'camelCase')).toBe('helloWorldExample')
    expect(convertTextCase('hello.world/example', 'snake_case')).toBe('hello_world_example')
  })

  test('handles acronyms', () => {
    expect(convertTextCase('XMLParser', 'snake_case')).toBe('xml_parser')
    expect(convertTextCase('parseHTML', 'kebab-case')).toBe('parse-html')
  })
})
