import { describe, expect, it, vi } from 'vitest'

import { searchTools } from './routes'
import type { ToolRoute } from './routes'

vi.mock('virtual:routes', () => ({ fileRoutes: [] }))

function tool(title: string, overrides: Partial<ToolRoute['info']> = {}): ToolRoute {
  return {
    path: '/uuid',
    info: {
      title,
      description: 'Generate values',
      category: 'Utilities',
      icon: 'i-lucide-code',
      tags: [],
      ...overrides,
    },
  }
}

const tools = [
  tool('JSON Formatter', {
    category: 'JSON',
    tags: ['beautify'],
    description: 'Format and repair data',
  }),
  tool('UUID Generator', { tags: ['identifier'] }),
]

describe('tool search', () => {
  it.each([
    ['JSON Formatter', 'JSON Formatter'],
    ['  jSoN  ', 'JSON Formatter'],
    ['beautify', 'JSON Formatter'],
    ['repair', 'JSON Formatter'],
    ['utilities', 'UUID Generator'],
  ])('matches metadata for %s', (query, title) => {
    expect(searchTools(tools, query).map((item) => item.info.title)).toEqual([title])
  })

  it('returns the directory order for empty queries and no matches for unknown tasks', () => {
    expect(searchTools(tools, '  ')).toEqual(tools)
    expect(searchTools(tools, 'missing')).toEqual([])
  })

  it('ranks exact, prefix, title, tags, category and description matches deterministically', () => {
    const ranked = [
      tool('Description', { description: 'JSON data' }),
      tool('Category', { category: 'JSON' }),
      tool('Tag', { tags: ['json'] }),
      tool('Convert JSON'),
      tool('JSON Formatter'),
      tool('JSON'),
      tool('JSON Converter'),
    ]
    const expected = [
      'JSON',
      'JSON Formatter',
      'JSON Converter',
      'Convert JSON',
      'Tag',
      'Category',
      'Description',
    ]
    expect(searchTools(ranked, 'json').map((item) => item.info.title)).toEqual(expected)
    expect(searchTools(ranked, 'json').map((item) => item.info.title)).toEqual(expected)
    expect(ranked[0].info.title).toBe('Description')
  })
})
