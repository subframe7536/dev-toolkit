/**
 * Text Case Converter Utilities
 * Provides functions for converting text between different case styles
 */

export type TextCaseStyle =
  | 'camelCase'
  | 'snake_case'
  | 'kebab-case'
  | 'PascalCase'
  | 'CONSTANT_CASE'
  | 'lowercase'
  | 'UPPERCASE'
  | 'Title Case'
  | 'Sentence case'
  | 'dot.case'
  | 'path/case'
  | 'aLtErNaTiNg CaSe'

/**
 * Convert text to the specified case style
 * @param text - Text to convert
 * @param targetCase - Target case style
 * @returns Converted text
 */
export function convertTextCase(text: string, targetCase: TextCaseStyle): string {
  if (!text) {
    return text
  }

  const words = splitIntoWords(text)

  switch (targetCase) {
    case 'camelCase':
      return words
        .map((word, index) =>
          index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join('')

    case 'snake_case':
      return words.map(word => word.toLowerCase()).join('_')

    case 'kebab-case':
      return words.map(word => word.toLowerCase()).join('-')

    case 'PascalCase':
      return words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')

    case 'CONSTANT_CASE':
      return words.map(word => word.toUpperCase()).join('_')

    case 'lowercase':
      return words.map(word => word.toLowerCase()).join('')

    case 'UPPERCASE':
      return words.map(word => word.toUpperCase()).join('')

    case 'Title Case':
      return words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

    case 'Sentence case': {
      const sentence = words.map(word => word.toLowerCase()).join(' ')
      return sentence.charAt(0).toUpperCase() + sentence.slice(1)
    }

    case 'dot.case':
      return words.map(word => word.toLowerCase()).join('.')

    case 'path/case':
      return words.map(word => word.toLowerCase()).join('/')

    case 'aLtErNaTiNg CaSe':
      return text
        .split('')
        .map((char, index) =>
          index % 2 === 0 ? char.toLowerCase() : char.toUpperCase(),
        )
        .join('')

    default:
      return text
  }
}

/**
 * Split a string into words using Intl.Segmenter for proper word boundaries
 * @param str - String to split
 * @returns Array of words
 */
function splitIntoWords(str: string): string[] {
  if (!str) {
    return []
  }

  // First normalize delimiters and camelCase
  let normalized = str
    .replace(/[-_./]/g, ' ') // Replace common delimiters with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters in camelCase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // Handle acronyms like "XMLParser" -> "XML Parser"

  // Use Intl.Segmenter for proper word boundary detection
  const segmenter = new Intl.Segmenter('en', { granularity: 'word' })
  const segments = segmenter.segment(normalized)

  const words: string[] = []
  for (const segment of segments) {
    // Only include word segments (not spaces or punctuation)
    if (segment.isWordLike) {
      words.push(segment.segment)
    }
  }

  return words
}
