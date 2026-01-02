import type { PatternCategory, PatternDefinition, RegexFlags } from './types'

const DEFAULT_FLAGS: RegexFlags = {
  global: true,
  ignoreCase: false,
  multiline: true,
  dotAll: false,
  unicode: false,
  sticky: false,
}

// Pattern library organized by categories
// Requirements: 6.1, 6.2, 6.5 - Categorized common patterns with descriptions

export const PATTERN_LIBRARY: PatternCategory[] = [
  {
    id: 'validation',
    name: 'Validation',
    description: 'Common input validation patterns',
    patterns: [
      {
        id: 'email',
        name: 'Email Address',
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        flags: DEFAULT_FLAGS,
        description: 'Validates standard email address format with domain extension',
        examples: [
          { input: 'user@example.com', shouldMatch: true, description: 'Standard email' },
          { input: 'test.name+tag@domain.co.uk', shouldMatch: true, description: 'Email with dots and plus' },
          { input: 'invalid-email', shouldMatch: false, description: 'Missing @ symbol' },
        ],
        tags: ['email', 'validation', 'form'],
      },
      {
        id: 'url',
        name: 'URL',
        pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)',
        flags: DEFAULT_FLAGS,
        description: 'Matches HTTP and HTTPS URLs with optional www prefix',
        examples: [
          { input: 'https://example.com', shouldMatch: true, description: 'Simple HTTPS URL' },
          { input: 'http://www.test.org/path?query=1', shouldMatch: true, description: 'URL with path and query' },
          { input: 'ftp://invalid.com', shouldMatch: false, description: 'Non-HTTP protocol' },
        ],
        tags: ['url', 'web', 'validation'],
      },
      {
        id: 'ipv4',
        name: 'IPv4 Address',
        pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
        flags: DEFAULT_FLAGS,
        description: 'Validates IPv4 addresses with proper octet ranges (0-255)',
        examples: [
          { input: '192.168.1.1', shouldMatch: true, description: 'Private IP address' },
          { input: '255.255.255.0', shouldMatch: true, description: 'Subnet mask' },
          { input: '256.1.1.1', shouldMatch: false, description: 'Invalid octet (>255)' },
        ],
        tags: ['ip', 'network', 'validation'],
      },
    ],
  },
  {
    id: 'phone',
    name: 'Phone Numbers',
    description: 'Phone number formats for various regions',
    patterns: [
      {
        id: 'phone-us',
        name: 'US Phone Number',
        pattern: '^(?:\\+1[-.]?)?\\(?[0-9]{3}\\)?[-.]?[0-9]{3}[-.]?[0-9]{4}$',
        flags: DEFAULT_FLAGS,
        description: 'Matches US phone numbers with optional country code and various separators',
        examples: [
          { input: '(555) 123-4567', shouldMatch: true, description: 'Standard format with parentheses' },
          { input: '+1-555-123-4567', shouldMatch: true, description: 'With country code' },
          { input: '5551234567', shouldMatch: true, description: 'No separators' },
        ],
        tags: ['phone', 'us', 'validation'],
      },
      {
        id: 'phone-intl',
        name: 'International Phone',
        pattern: '^\\+[1-9]\\d{1,14}$',
        flags: DEFAULT_FLAGS,
        description: 'Matches E.164 international phone number format',
        examples: [
          { input: '+14155551234', shouldMatch: true, description: 'US number in E.164' },
          { input: '+442071234567', shouldMatch: true, description: 'UK number in E.164' },
          { input: '14155551234', shouldMatch: false, description: 'Missing plus sign' },
        ],
        tags: ['phone', 'international', 'validation'],
      },
    ],
  },

  {
    id: 'dates',
    name: 'Dates & Times',
    description: 'Date and time format patterns',
    patterns: [
      {
        id: 'date-iso',
        name: 'ISO 8601 Date',
        pattern: '^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$',
        flags: DEFAULT_FLAGS,
        description: 'Matches ISO 8601 date format (YYYY-MM-DD)',
        examples: [
          { input: '2024-01-15', shouldMatch: true, description: 'Valid ISO date' },
          { input: '2024-12-31', shouldMatch: true, description: 'End of year' },
          { input: '2024-13-01', shouldMatch: false, description: 'Invalid month' },
        ],
        tags: ['date', 'iso', 'validation'],
      },
      {
        id: 'date-us',
        name: 'US Date Format',
        pattern: '^(?:0[1-9]|1[0-2])\\/(?:0[1-9]|[12]\\d|3[01])\\/\\d{4}$',
        flags: DEFAULT_FLAGS,
        description: 'Matches US date format (MM/DD/YYYY)',
        examples: [
          { input: '01/15/2024', shouldMatch: true, description: 'Valid US date' },
          { input: '12/31/2024', shouldMatch: true, description: 'End of year' },
          { input: '13/01/2024', shouldMatch: false, description: 'Invalid month' },
        ],
        tags: ['date', 'us', 'validation'],
      },
      {
        id: 'time-24h',
        name: '24-Hour Time',
        pattern: '^(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?$',
        flags: DEFAULT_FLAGS,
        description: 'Matches 24-hour time format (HH:MM or HH:MM:SS)',
        examples: [
          { input: '14:30', shouldMatch: true, description: 'Afternoon time' },
          { input: '23:59:59', shouldMatch: true, description: 'With seconds' },
          { input: '25:00', shouldMatch: false, description: 'Invalid hour' },
        ],
        tags: ['time', 'validation'],
      },
    ],
  },
  {
    id: 'identifiers',
    name: 'Identifiers & Codes',
    description: 'Common identifier and code patterns',
    patterns: [
      {
        id: 'uuid',
        name: 'UUID v4',
        pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        flags: DEFAULT_FLAGS,
        description: 'Matches UUID version 4 format',
        examples: [
          { input: '550e8400-e29b-41d4-a716-446655440000', shouldMatch: true, description: 'Valid UUID v4' },
          { input: 'not-a-uuid', shouldMatch: false, description: 'Invalid format' },
        ],
        tags: ['uuid', 'identifier', 'validation'],
      },
      {
        id: 'hex-color',
        name: 'Hex Color Code',
        pattern: '^#(?:[0-9a-fA-F]{3}){1,2}$',
        flags: DEFAULT_FLAGS,
        description: 'Matches 3 or 6 digit hex color codes with # prefix',
        examples: [
          { input: '#fff', shouldMatch: true, description: 'Short format' },
          { input: '#FF5733', shouldMatch: true, description: 'Full format' },
          { input: 'FF5733', shouldMatch: false, description: 'Missing hash' },
        ],
        tags: ['color', 'hex', 'css'],
      },
      {
        id: 'credit-card',
        name: 'Credit Card Number',
        pattern: '^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$',
        flags: DEFAULT_FLAGS,
        description: 'Matches Visa, MasterCard, Amex, and Discover card numbers',
        examples: [
          { input: '4111111111111111', shouldMatch: true, description: 'Visa test number' },
          { input: '5500000000000004', shouldMatch: true, description: 'MasterCard test' },
          { input: '1234567890123456', shouldMatch: false, description: 'Invalid prefix' },
        ],
        tags: ['credit-card', 'payment', 'validation'],
      },
    ],
  },

  {
    id: 'text',
    name: 'Text Patterns',
    description: 'Common text matching and extraction patterns',
    patterns: [
      {
        id: 'username',
        name: 'Username',
        pattern: '^[a-zA-Z][a-zA-Z0-9_-]{2,15}$',
        flags: DEFAULT_FLAGS,
        description: 'Alphanumeric username starting with letter, 3-16 characters',
        examples: [
          { input: 'john_doe', shouldMatch: true, description: 'Valid username' },
          { input: 'user123', shouldMatch: true, description: 'With numbers' },
          { input: '123user', shouldMatch: false, description: 'Starts with number' },
        ],
        tags: ['username', 'validation', 'form'],
      },
      {
        id: 'password-strong',
        name: 'Strong Password',
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
        flags: DEFAULT_FLAGS,
        description: 'At least 8 chars with uppercase, lowercase, number, and special char',
        examples: [
          { input: 'Passw0rd!', shouldMatch: true, description: 'Strong password' },
          { input: 'password', shouldMatch: false, description: 'Too weak' },
        ],
        tags: ['password', 'security', 'validation'],
      },
      {
        id: 'slug',
        name: 'URL Slug',
        pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        flags: DEFAULT_FLAGS,
        description: 'URL-friendly slug with lowercase letters, numbers, and hyphens',
        examples: [
          { input: 'my-blog-post', shouldMatch: true, description: 'Valid slug' },
          { input: 'post-123', shouldMatch: true, description: 'With numbers' },
          { input: 'Invalid_Slug', shouldMatch: false, description: 'Contains uppercase and underscore' },
        ],
        tags: ['slug', 'url', 'seo'],
      },
    ],
  },
  {
    id: 'programming',
    name: 'Programming',
    description: 'Patterns useful for code analysis and parsing',
    patterns: [
      {
        id: 'html-tag',
        name: 'HTML Tag',
        pattern: '<([a-z][a-z0-9]*)\\b[^>]*>.*?<\\/\\1>',
        flags: DEFAULT_FLAGS,
        description: 'Matches paired HTML tags with content',
        examples: [
          { input: '<div>content</div>', shouldMatch: true, description: 'Simple div' },
          { input: '<span class="test">text</span>', shouldMatch: true, description: 'With attributes' },
          { input: '<br/>', shouldMatch: false, description: 'Self-closing tag' },
        ],
        tags: ['html', 'parsing', 'web'],
      },
      {
        id: 'js-variable',
        name: 'JavaScript Variable',
        pattern: '^[a-zA-Z_$][a-zA-Z0-9_$]*$',
        flags: DEFAULT_FLAGS,
        description: 'Valid JavaScript variable name',
        examples: [
          { input: 'myVariable', shouldMatch: true, description: 'Camel case' },
          { input: '_privateVar', shouldMatch: true, description: 'Private convention' },
          { input: '123invalid', shouldMatch: false, description: 'Starts with number' },
        ],
        tags: ['javascript', 'variable', 'identifier'],
      },
      {
        id: 'semver',
        name: 'Semantic Version',
        pattern: '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$',
        flags: DEFAULT_FLAGS,
        description: 'Matches semantic versioning format (major.minor.patch)',
        examples: [
          { input: '1.0.0', shouldMatch: true, description: 'Simple version' },
          { input: '2.1.3-beta.1', shouldMatch: true, description: 'With prerelease' },
          { input: 'v1.0.0', shouldMatch: false, description: 'With v prefix' },
        ],
        tags: ['version', 'semver', 'npm'],
      },
    ],
  },
]

// Helper functions for pattern library access

/**
 * Get all pattern categories
 */
export function getAllCategories(): PatternCategory[] {
  return PATTERN_LIBRARY
}

/**
 * Get a specific category by ID
 */
export function getCategoryById(categoryId: string): PatternCategory | undefined {
  return PATTERN_LIBRARY.find(cat => cat.id === categoryId)
}

/**
 * Get a specific pattern by ID (searches all categories)
 */
export function getPatternById(patternId: string): PatternDefinition | undefined {
  for (const category of PATTERN_LIBRARY) {
    const pattern = category.patterns.find(p => p.id === patternId)
    if (pattern) {
      return pattern
    }
  }
  return undefined
}

/**
 * Search patterns by name, description, or tags
 */
export function searchPatterns(query: string): PatternDefinition[] {
  const lowerQuery = query.toLowerCase()
  const results: PatternDefinition[] = []

  for (const category of PATTERN_LIBRARY) {
    for (const pattern of category.patterns) {
      const matchesName = pattern.name.toLowerCase().includes(lowerQuery)
      const matchesDescription = pattern.description.toLowerCase().includes(lowerQuery)
      const matchesTags = pattern.tags.some(tag => tag.toLowerCase().includes(lowerQuery))

      if (matchesName || matchesDescription || matchesTags) {
        results.push(pattern)
      }
    }
  }

  return results
}

/**
 * Get total count of patterns in the library
 */
export function getPatternCount(): number {
  return PATTERN_LIBRARY.reduce((count, category) => count + category.patterns.length, 0)
}
