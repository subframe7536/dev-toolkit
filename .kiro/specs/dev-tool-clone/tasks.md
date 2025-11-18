# Implementation Plan

## Overview

This implementation plan breaks down the development of the Developer Toolkit into discrete, manageable tasks. Each task builds incrementally on previous work, with utility functions separated from UI components for better testability. The plan focuses on implementing core functionality first, then enhancing existing tools.

**Important Pattern:** Each tool page must define metadata in the route's `info` property:
```typescript
export default createRoute({
  info: {
    title: 'Tool Name',
    description: 'Brief description',
    category: 'Category Name', // JSON, Encoding, Crypto, Text, Color, SQL
    icon: 'lucide:icon-name', // Optional
  },
  component: ToolComponent,
})
```

Both the **homepage** and **sidebar** automatically generate their content by iterating over `fileRoutes` and reading each route's `info` property. This eliminates the need to manually maintain separate tool lists in multiple places.

## Task List

- [x] 1. Update app layout and home page to use fileRoutes
  - Update `src/pages/_app.tsx` to generate sidebar navigation from `fileRoutes`
  - Filter routes to extract only tool pages (those with `info.title` and `info.category`)
  - Group tools by category in sidebar
  - Add sidebar menu items with icons and links
  - Update `src/pages/index.tsx` to generate tool cards from `fileRoutes`
  - Display total tool count on homepage
  - Render tool cards with title, description, and link from route info
  - Add `info` property to existing tool routes (UUID, Base64, JSON Formatter) with title, description, category, and icon
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Enhance existing JSON Formatter tool
  - Create utility functions in `src/utils/json/formatter.ts`
  - Implement format, minify, and sort key functions
  - Add error handling for invalid JSON with line/column information
  - Update `src/pages/json/formatter.tsx` to use utility functions
  - Add `info` property to route with title: "JSON Formatter", description, and category: "JSON"
  - Add copy and download functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.1 Write unit tests for JSON formatter utilities
  - Test format function with various JSON structures
  - Test minify function removes whitespace correctly
  - Test sort keys function alphabetically orders keys
  - Test error handling for invalid JSON
  - Test round-trip: format then minify returns valid JSON
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3. Implement JSON Import/Export tool
  - Create utility functions in `src/utils/json/converter.ts`
  - Implement JSON to CSV conversion
  - Implement CSV to JSON conversion (with header detection)
  - Implement JSON to YAML conversion
  - Implement YAML to JSON conversion
  - Implement JSON to query parameters conversion
  - Implement query parameters to JSON conversion
  - Create page component at `src/pages/json/converter.tsx`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 3.1 Write unit tests for JSON converter utilities
  - Test JSON to CSV with various data structures
  - Test CSV to JSON with and without headers
  - Test YAML conversions
  - Test query parameter conversions
  - Test round-trip conversions preserve data
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Implement JSON Key Style Converter
  - Create utility functions in `src/utils/json/key-converter.ts`
  - Implement camelCase conversion
  - Implement snake_case conversion
  - Implement kebab-case conversion
  - Implement PascalCase conversion
  - Implement CONSTANT_CASE conversion
  - Handle recursive conversion for nested objects/arrays
  - Create page component at `src/pages/json/key-converter.tsx`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 4.1 Write unit tests for key style converter
  - Test each case conversion type
  - Test recursive conversion on nested structures
  - Test special character handling
  - Test value preservation during key transformation
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5. Implement JSON Schema Validator and Generator
  - Install `ajv` library for JSON Schema validation
  - Create utility functions in `src/utils/json/schema.ts`
  - Implement schema validation with detailed error messages
  - Implement schema generation from sample JSON
  - Create page component at `src/pages/json/schema.tsx`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 5.1 Write unit tests for JSON schema utilities
  - Test validation with valid and invalid JSON
  - Test error message generation
  - Test schema generation from various JSON structures
  - Test type inference and required field detection
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Implement JSON Path and Repair tool
  - Install `jsonpath-plus` library for JSONPath queries
  - Create utility functions in `src/utils/json/path-repair.ts`
  - Implement JSONPath evaluation
  - Implement JSON repair for common malformations
  - Create page component at `src/pages/json/path.tsx`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 6.1 Write unit tests for JSON path and repair
  - Test JSONPath queries on various JSON structures
  - Test invalid JSONPath error handling
  - Test JSON repair for common issues (missing quotes, trailing commas)
  - Test change highlighting in repaired JSON
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Checkpoint - Ensure all JSON tools are working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Text Compare tool
  - Install `diff` library for text comparison
  - Create utility functions in `src/utils/text/compare.ts`
  - Implement side-by-side diff generation
  - Implement unified diff generation
  - Implement line number calculation
  - Create page component at `src/pages/text/compare.tsx`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.1 Write unit tests for text compare utilities
  - Test diff generation for various text pairs
  - Test identical text detection
  - Test line number calculation
  - Test mode switching preserves input
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Enhance existing Base64 Encoder/Decoder
  - Create utility functions in `src/utils/encode/base64.ts`
  - Implement encode function using btoa or Buffer
  - Implement decode function using atob or Buffer
  - Add error handling for invalid Base64
  - Update `src/pages/encode/base64.tsx` to use utility functions
  - Add mode switching and result clearing
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 9.1 Write unit tests for Base64 utilities
  - Test encode function with various inputs
  - Test decode function with valid Base64
  - Test round-trip: encode then decode returns original
  - Test error handling for invalid Base64
  - Test empty string handling
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 10. Implement Hex Encoder/Decoder
  - Create utility functions in `src/utils/encode/hex.ts`
  - Implement hex encoding
  - Implement hex decoding with validation
  - Add formatting options (spacing, uppercase/lowercase)
  - Create page component at `src/pages/encode/hex.tsx`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 10.1 Write unit tests for Hex utilities
  - Test hex encoding
  - Test hex decoding
  - Test round-trip conversion
  - Test invalid hex error handling
  - Test formatting options
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 11. Implement URL Encoder/Decoder
  - Create utility functions in `src/utils/encode/url.ts`
  - Implement URL encoding using encodeURIComponent
  - Implement URL decoding using decodeURIComponent
  - Handle Unicode and special characters
  - Create page component at `src/pages/encode/url.tsx`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 11.1 Write unit tests for URL utilities
  - Test URL encoding with special characters
  - Test URL decoding
  - Test round-trip conversion
  - Test Unicode handling
  - Test space encoding
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 12. Implement Unicode Encoder/Decoder
  - Create utility functions in `src/utils/encode/unicode.ts`
  - Implement Unicode escape sequence encoding
  - Implement Unicode escape sequence decoding
  - Support both \\uXXXX and \\u{XXXXXX} formats
  - Create page component at `src/pages/encode/unicode.tsx`
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 12.1 Write unit tests for Unicode utilities
  - Test Unicode encoding
  - Test Unicode decoding for both formats
  - Test round-trip conversion
  - Test invalid escape sequence handling
  - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [ ] 13. Implement HTML Entity Encoder/Decoder
  - Create utility functions in `src/utils/encode/html.ts`
  - Implement HTML entity encoding
  - Implement HTML entity decoding
  - Handle common entities (&lt;, &gt;, &amp;, &quot;, etc.)
  - Create page component at `src/pages/encode/html.tsx`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 13.1 Write unit tests for HTML entity utilities
  - Test HTML encoding with special characters
  - Test HTML decoding
  - Test round-trip conversion
  - Test all common HTML entities
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 14. Checkpoint - Ensure all encoding tools are working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement AES/DES Encryption/Decryption
  - Install `crypto-js` library for encryption
  - Create utility functions in `src/utils/crypto/symmetric.ts`
  - Implement AES-128, AES-192, AES-256 encryption
  - Implement DES encryption
  - Implement decryption for all algorithms
  - Add error handling for incorrect keys
  - Create page component at `src/pages/crypto/aes.tsx`
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 15.1 Write unit tests for AES/DES utilities
  - Test encryption for each algorithm
  - Test decryption with correct key
  - Test round-trip: encrypt then decrypt returns original
  - Test error handling for incorrect key
  - Test output format (Base64/hex)
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 16. Implement RSA Encryption/Decryption
  - Use Web Crypto API for RSA operations
  - Create utility functions in `src/utils/crypto/rsa.ts`
  - Implement RSA key pair generation (1024, 2048, 4096 bits)
  - Implement RSA encryption with public key
  - Implement RSA decryption with private key
  - Implement PEM format export
  - Create page component at `src/pages/crypto/rsa.tsx`
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ]* 16.1 Write unit tests for RSA utilities
  - Test key pair generation for each key size
  - Test encryption with public key
  - Test decryption with private key
  - Test round-trip: encrypt then decrypt returns original
  - Test PEM format export
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 17. Implement MD5 Hash Generator
  - Install `crypto-js` library (if not already installed)
  - Create utility functions in `src/utils/crypto/hash.ts`
  - Implement MD5 hash generation
  - Add support for SHA-1, SHA-256, SHA-512 as well
  - Create page component at `src/pages/crypto/md5.tsx`
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]* 17.1 Write unit tests for hash utilities
  - Test MD5 hash generation
  - Test SHA hash generation
  - Test empty string hashing
  - Test hash format (hexadecimal)
  - Test known hash values for validation
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 18. Checkpoint - Ensure all crypto tools are working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Implement Regular Expression Tester
  - Create utility functions in `src/utils/text/regex.ts`
  - Implement regex validation
  - Implement match finding and highlighting
  - Implement capture group extraction
  - Handle regex flags (g, i, m, s, u, y)
  - Create page component at `src/pages/text/regexp.tsx`
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ]* 19.1 Write unit tests for regex utilities
  - Test regex validation
  - Test match finding
  - Test capture group extraction
  - Test flag handling
  - Test invalid regex error handling
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 20. Implement Color Converter and Picker
  - Install `tinycolor2` library for color manipulation
  - Create utility functions in `src/utils/color/converter.ts`
  - Implement conversions between RGB, HEX, HSL, HWB, OKLCH
  - Implement color validation
  - Create page component at `src/pages/color/converter.tsx`
  - Add color picker UI component
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ]* 20.1 Write unit tests for color utilities
  - Test color format conversions
  - Test color validation
  - Test invalid color error handling
  - Test conversion accuracy
  - _Requirements: 17.1, 17.2, 17.4_

- [ ] 21. Implement QR Code Generator
  - Install `qrcode` library
  - Create utility functions in `src/utils/qr/generator.ts`
  - Implement QR code generation
  - Add size and error correction options
  - Implement PNG export
  - Create page component at `src/pages/utils/qrcode.tsx`
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ]* 21.1 Write unit tests for QR code utilities
  - Test QR code generation
  - Test size adjustment
  - Test error correction levels
  - Test PNG export format
  - Test empty input handling
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 22. Enhance existing UUID Generator
  - Create utility functions in `src/utils/uuid/generator.ts`
  - Move UUID generation logic to utility function
  - Add UUID v4 format validation
  - Add uniqueness checking for bulk generation
  - Update `src/pages/utils/uuid.tsx` to use utility functions
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ]* 22.1 Write unit tests for UUID utilities
  - Test UUID v4 format validation
  - Test bulk generation count
  - Test uniqueness in bulk generation
  - Test UUID format pattern matching
  - _Requirements: 19.1, 19.4, 19.5_

- [ ] 23. Implement SQL Utilities
  - Install `papaparse` for CSV parsing
  - Create utility functions in `src/utils/sql/converter.ts`
  - Implement MyBatis parameter substitution
  - Implement JSON to SQL INSERT conversion
  - Implement CSV to SQL INSERT conversion
  - Implement SQL to entity class generation (Java/TypeScript)
  - Create page component at `src/pages/sql/converter.tsx`
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ]* 23.1 Write unit tests for SQL utilities
  - Test MyBatis parameter parsing
  - Test JSON to SQL conversion
  - Test CSV to SQL conversion
  - Test entity class generation
  - Test type mapping accuracy
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 24. Checkpoint - Ensure all remaining tools are working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Implement shared clipboard utility
  - Create utility function in `src/utils/clipboard.ts`
  - Implement clipboard write with fallback
  - Add error handling for clipboard access denied
  - Add success/error notifications
  - _Requirements: Multiple tools use clipboard_

- [ ]* 25.1 Write unit tests for clipboard utility
  - Test clipboard write functionality
  - Test error handling
  - Mock clipboard API for testing
  - _Requirements: Multiple tools_

- [ ] 26. Implement shared error display component
  - Create error display component (if not exists)
  - Ensure consistent error styling across all tools
  - Add error type handling (validation, processing, system)
  - _Requirements: Multiple tools use error display_

- [ ] 27. Add privacy and accessibility features
  - Add privacy policy page
  - Verify no network requests during tool operations
  - Add ARIA labels to all interactive elements
  - Test keyboard navigation across all tools
  - Verify responsive design on mobile viewports
  - Add focus indicators to all interactive elements
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ]* 27.1 Run accessibility audit
  - Use axe-core for automated testing
  - Test keyboard navigation manually
  - Verify ARIA labels
  - Check color contrast ratios
  - _Requirements: 22.2, 22.3, 22.5_

- [ ] 28. Final polish and optimization
  - Add loading states for heavy operations
  - Implement debouncing for real-time updates
  - Add PWA service worker for offline support
  - Optimize bundle size with code splitting
  - Add meta tags and SEO optimization
  - _Requirements: All_

- [ ] 29. Final checkpoint - Complete testing
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all tools work as expected
  - Test on multiple browsers and devices
  - Verify offline functionality

## Notes

- All utility functions should be in `src/utils/` organized by category
- All page components should be in `src/pages/` following kebab-case naming
- **Every tool page MUST include an `info` property in `createRoute()` with title, description, category, and optional icon**
- Both the sidebar and homepage use `fileRoutes` to automatically generate navigation and tool cards
- Tests should be in `__test__/` directories alongside the code
- UI components in `src/components/ui/` do not require tests
- Focus on implementing core functionality before adding optional features
- Each tool should handle errors gracefully and provide clear user feedback
