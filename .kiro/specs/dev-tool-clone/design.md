# Design Document: Developer Toolkit

## Overview

The Developer Toolkit is a comprehensive web-based application providing 22+ essential utilities for developers. Built with SolidJS and leveraging client-side processing for privacy, the toolkit offers tools for JSON manipulation, text processing, encoding/decoding, code generation, cryptography, and various developer utilities. All processing happens in the browser without server transmission, ensuring user privacy and enabling offline functionality.

## Architecture

### High-Level Architecture

The application follows a component-based architecture with file-based routing:

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │           SolidJS Application Layer                │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │         Routing Layer (solid-file-router)   │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │              Page Components                 │  │  │
│  │  │  (Home, Tool Pages, Layouts)                │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │           Tool Logic Layer                   │  │  │
│  │  │  (Utilities, Processors, Generators)        │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │          UI Component Library                │  │  │
│  │  │  (Buttons, Inputs, Cards, etc.)             │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Browser APIs & Local Storage              │  │
│  │  (Clipboard, Crypto, Canvas, LocalStorage)       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: SolidJS 1.9.10 (reactive UI framework)
- **Router**: solid-file-router (type-safe file-based routing)
- **Build Tool**: Vite 7.2.2
- **Package Manager**: Bun
- **Styling**: UnoCSS with Tailwind-compatible utilities
- **UI Components**: Kobalte Core (accessible component primitives)
- **TypeScript**: 5.9.3

### Key Architectural Decisions

1. **Client-Side Only Processing**: All data transformations occur in the browser using Web APIs and JavaScript libraries. No server-side processing ensures privacy and enables offline use.

2. **File-Based Routing**: Using solid-file-router for automatic route generation from file structure, providing type safety and reducing boilerplate.

3. **Reactive State Management**: Leveraging SolidJS signals for fine-grained reactivity without virtual DOM overhead.

4. **Modular Tool Architecture**: Each tool is self-contained with its own page component and utility functions, enabling independent development and testing.

5. **Shared UI Components**: Reusable UI components from Kobalte ensure consistency and accessibility across all tools.

## Components and Interfaces

### Page Components

Each tool page follows this structure and naming convention. **Note: File naming conventions (kebab-case) apply only to files in `src/pages/`.**

Tool metadata (title, description, category) should be defined in the route's `info` property. This metadata is used by the homepage to automatically generate tool cards from the `fileRoutes` variable.

```typescript
// src/pages/[category]/[tool-name].tsx
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'

export default createRoute({
  info: {
    title: 'Tool Name',
    description: 'Brief description of what this tool does',
    category: 'Category Name', // e.g., 'JSON', 'Encoding', 'Crypto'
    icon: 'lucide:icon-name', // Optional: Iconify icon name
  },
  component: ToolComponent,
})

function ToolComponent() {
  // State management with signals
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  
  // Tool-specific logic
  const processInput = () => {
    const result = toolUtility(input())
    setOutput(result)
  }
  
  return (
    // JSX template
  )
}
```

### Utility Modules

All computation logic is separated from components and maintained in utility modules under `src/utils/`. This separation enables:
- Pure function testing without UI dependencies
- Reusability across different components
- Easier maintenance and debugging

```typescript
// src/utils/[tool-category]/[tool-name].ts

export interface ToolOptions {
  // Configuration options
}

export function processData(input: string, options?: ToolOptions): string {
  // Pure function for data transformation
}

export function validateInput(input: string): boolean {
  // Input validation
}
```

Components in `src/pages/` should be thin wrappers that:
- Manage UI state with SolidJS signals
- Handle user interactions
- Call utility functions for all computation
- Render results

### Tool-Specific Utility Interfaces

**JSON Utilities (`src/utils/json/`):**

```typescript
// formatter.ts
export function formatJSON(input: string, indent?: number): string
export function minifyJSON(input: string): string
export function sortJSONKeys(input: string): string

// converter.ts
export function jsonToCSV(json: string): string
export function csvToJSON(csv: string): string
export function jsonToYAML(json: string): string
export function yamlToJSON(yaml: string): string
export function jsonToQueryParams(json: string): string
export function queryParamsToJSON(params: string): string

// key-converter.ts
export type CaseStyle = 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase' | 'CONSTANT_CASE'
export function convertKeys(json: string, targetCase: CaseStyle): string

// schema.ts
export function validateJSON(json: string, schema: string): ValidationResult
export function generateSchema(json: string): string
export interface ValidationResult {
  valid: boolean
  errors?: Array<{ path: string; message: string }>
}

// path-repair.ts
export function evaluateJSONPath(json: string, path: string): any[]
export function repairJSON(malformed: string): { repaired: string; changes: string[] }
```

**Encoding Utilities (`src/utils/encode/`):**

```typescript
// base64.ts
export function encodeBase64(text: string): string
export function decodeBase64(encoded: string): string

// hex.ts
export function encodeHex(text: string): string
export function decodeHex(hex: string): string
export function formatHex(hex: string, spacing?: boolean, uppercase?: boolean): string

// url.ts
export function encodeURL(text: string): string
export function decodeURL(encoded: string): string

// unicode.ts
export function encodeUnicode(text: string): string
export function decodeUnicode(escaped: string): string

// html.ts
export function encodeHTMLEntities(text: string): string
export function decodeHTMLEntities(encoded: string): string
```

**Cryptography Utilities (`src/utils/crypto/`):**

```typescript
// symmetric.ts
export type SymmetricAlgorithm = 'AES-128' | 'AES-192' | 'AES-256' | 'DES'
export function encrypt(plaintext: string, key: string, algorithm: SymmetricAlgorithm): string
export function decrypt(ciphertext: string, key: string, algorithm: SymmetricAlgorithm): string

// rsa.ts
export type KeySize = 1024 | 2048 | 4096
export interface RSAKeyPair {
  publicKey: string  // PEM format
  privateKey: string // PEM format
}
export function generateRSAKeyPair(keySize: KeySize): Promise<RSAKeyPair>
export function encryptRSA(plaintext: string, publicKey: string): Promise<string>
export function decryptRSA(ciphertext: string, privateKey: string): Promise<string>

// hash.ts
export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512'
export function computeHash(text: string, algorithm: HashAlgorithm): string
export function computeAllHashes(text: string): Record<HashAlgorithm, string>
```

**Text Utilities (`src/utils/text/`):**

```typescript
// compare.ts
export type DiffMode = 'side-by-side' | 'unified'
export interface DiffResult {
  mode: DiffMode
  changes: Array<{
    type: 'add' | 'delete' | 'unchanged'
    lineNumber: number
    content: string
  }>
}
export function generateDiff(text1: string, text2: string, mode: DiffMode): DiffResult

// regex.ts
export interface RegexMatch {
  fullMatch: string
  groups: string[]
  index: number
}
export function validateRegex(pattern: string): { valid: boolean; error?: string }
export function findMatches(pattern: string, text: string, flags: string): RegexMatch[]
```

**Color Utilities (`src/utils/color/`):**

```typescript
// converter.ts
export interface ColorFormats {
  rgb: string
  hex: string
  hsl: string
  hwb: string
  oklch: string
}
export function convertColor(input: string): ColorFormats
export function validateColor(input: string): boolean
```

**SQL Utilities (`src/utils/sql/`):**

```typescript
// converter.ts
export function parseMyBatisSQL(sql: string, params: Record<string, any>): string
export function jsonToSQL(json: string, tableName: string): string[]
export function csvToSQL(csv: string, tableName: string): string[]
export function sqlToEntity(sql: string, language: 'java' | 'typescript'): string
```

**QR Code Utilities (`src/utils/qr/`):**

```typescript
// generator.ts
export interface QROptions {
  size: number
  errorCorrection: 'L' | 'M' | 'Q' | 'H'
}
export function generateQRCode(text: string, options: QROptions): Promise<string> // Returns data URL
```

**UUID Utilities (`src/utils/uuid/`):**

```typescript
// generator.ts
export function generateUUID(): string
export function generateBulkUUIDs(count: number): string[]
export function validateUUIDv4(uuid: string): boolean
```

### App Layout and Sidebar

The app layout (`src/pages/_app.tsx`) includes a sidebar that automatically generates navigation items from `fileRoutes`. The sidebar groups tools by category and provides quick navigation:

```typescript
// src/pages/_app.tsx
import { fileRoutes } from 'virtual:routes'
import { Sidebar, SidebarContent } from '#/components/ui/sidebar'

function App(props: ParentProps) {
  // Extract tool routes and group by category
  const toolRoutes = fileRoutes.filter(route => 
    route.info?.title && route.info?.category
  )
  const categories = groupByCategory(toolRoutes)
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>Developer Toolkit</SidebarHeader>
        <SidebarContent>
          <For each={categories}>
            {category => (
              <SidebarGroup>
                <SidebarGroupLabel>{category.name}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <For each={category.tools}>
                    {tool => (
                      <SidebarMenuItem href={tool.path}>
                        {tool.info.icon && <Icon name={tool.info.icon} />}
                        {tool.info.title}
                      </SidebarMenuItem>
                    )}
                  </For>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </For>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>{props.children}</SidebarInset>
    </SidebarProvider>
  )
}
```

### Home Page Component

The home page automatically generates tool cards by iterating over the `fileRoutes` variable. Each route's `info` property contains the tool metadata:

```typescript
// src/pages/index.tsx
import { createRoute } from 'solid-file-router'
import { fileRoutes } from 'virtual:routes'
import { For } from 'solid-js'

export default createRoute({
  component: HomePage,
})

function HomePage() {
  // Extract tool routes (exclude index, _app, 404, etc.)
  const toolRoutes = fileRoutes.filter(route => 
    route.info?.title && route.info?.category
  )
  
  // Group tools by category
  const categories = groupByCategory(toolRoutes)
  
  return (
    <div>
      <h1>Developer Toolkit</h1>
      <p>{toolRoutes.length} Tools</p>
      
      <For each={categories}>
        {category => (
          <div>
            <h2>{category.name}</h2>
            <For each={category.tools}>
              {tool => (
                <ToolCard 
                  title={tool.info.title}
                  description={tool.info.description}
                  href={tool.path}
                  icon={tool.info.icon}
                />
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  )
}
```

**Route Info Interface:**

```typescript
interface RouteInfo {
  title: string          // Tool name displayed on card
  description: string    // Brief description of the tool
  category: string       // Category for grouping (JSON, Encoding, Crypto, etc.)
  icon?: string          // Optional Iconify icon name
}
```

### Common UI Patterns

All tool pages share common patterns:

1. **Header Section**: Title and description
2. **Input Area**: Text area, file upload, or form inputs
3. **Action Buttons**: Process, Clear, Copy, Download
4. **Output Area**: Results display with formatting
5. **Options Panel**: Tool-specific configuration (optional)

## Data Models

### Tool Metadata

```typescript
interface ToolMetadata {
  id: string
  name: string
  description: string
  category: string
  route: string
  icon?: string
  tags: string[]
}
```

### Tool State

Each tool manages its own state using SolidJS signals:

```typescript
interface ToolState<TInput, TOutput> {
  input: TInput
  output: TOutput
  error: string | null
  isProcessing: boolean
  options: Record<string, any>
}
```

### Conversion Results

For tools that perform conversions:

```typescript
interface ConversionResult {
  success: boolean
  output: string
  error?: string
  metadata?: {
    inputSize: number
    outputSize: number
    processingTime: number
  }
}
```

## Key Design Decisions

### JSON Tools Architecture

**Decision**: Separate JSON tools into distinct pages rather than a single multi-tab tool.

**Rationale**: 
- Each tool has a specific use case and can be optimized independently
- Simpler routing and URL sharing (e.g., `/json/formatter` vs `/json?tab=formatter`)
- Better code splitting - only load libraries needed for each tool
- Easier to test and maintain individual tools

### Encoding/Decoding Pattern

**Decision**: Use a consistent encode/decode toggle pattern across all encoding tools.

**Rationale**:
- Familiar UX - users expect encode/decode to be mirror operations
- Reduces UI complexity - single input/output area with mode toggle
- Enables round-trip testing - encode then decode should return original
- Clear error handling - decode errors are distinct from encode errors

### Cryptography Implementation

**Decision**: Use Web Crypto API for modern algorithms (AES, RSA, SHA) and crypto-js for legacy (MD5, DES).

**Rationale**:
- Web Crypto API is native, faster, and more secure
- crypto-js provides compatibility for algorithms not in Web Crypto
- Async operations (Web Crypto) provide better UX for large inputs
- PEM format support for RSA keys enables interoperability

### Client-Side Processing Guarantee

**Decision**: All processing happens in the browser with no server communication.

**Rationale**:
- Privacy - sensitive data never leaves the user's device
- Offline capability - tools work without internet after initial load
- Performance - no network latency for operations
- Cost - no server infrastructure needed
- Trust - users can verify no data transmission via browser dev tools

### Schema Validation Library Choice

**Decision**: Use `ajv` for JSON Schema validation instead of custom implementation.

**Rationale**:
- Industry standard with comprehensive JSON Schema support
- Excellent error messages with detailed validation failures
- High performance with schema compilation
- Supports all JSON Schema drafts
- Well-maintained with active community

### SQL Utilities Scope

**Decision**: Focus on data conversion and code generation, not SQL execution.

**Rationale**:
- Client-side SQL execution requires embedding a database (SQLite WASM)
- Primary use case is converting data formats and generating boilerplate
- MyBatis parameter substitution is string manipulation, not execution
- Entity generation provides high value with low complexity
- Keeps bundle size reasonable

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. These properties will be validated through unit tests with specific examples and edge cases.*

### Testing Consolidation

After analyzing all acceptance criteria, several testing patterns can be consolidated:

**Round-Trip Testing:**
- Base64 encoding/decoding (7.1 + 7.2) → Test encode then decode returns original
- CSV/JSON conversion (12.1 + 12.2) → Test CSV→JSON→CSV preserves data
- Timestamp conversion (18.1 + 18.2) → Test timestamp→date→timestamp preserves value
- URL encoding/decoding (20.1 + 20.2) → Test encode then decode returns original

**Shared Utilities:**
- Clipboard functionality → Shared clipboard utility tested once
- Real-time updates → Shared reactivity pattern tested once
- Client-side processing → Verified through network monitoring

**UI Patterns:**
- Error display → Shared error component tested once
- Copy buttons → Shared button component tested once
- Input/output areas → Shared layout patterns tested once

The following properties represent the key behaviors that will be validated through unit tests.

### Core Properties

**Property 1: Tool card navigation**
Clicking a tool card should navigate to the correct tool route matching the card's href attribute.
**Validates: Requirements 1.3**

**Property 2: Tool card content display**
Rendered tool cards should contain both the tool name and description text.
**Validates: Requirements 1.2**

### JSON Formatter Properties

**Property 3: JSON parsing and formatting**
Valid JSON strings should be parsed and formatted correctly, producing output that can be parsed back to an equivalent structure.
**Validates: Requirements 2.1**

**Property 4: JSON parsing error handling**
Invalid JSON strings should result in clear error messages being displayed.
**Validates: Requirements 2.2**

**Property 5: JSON minify preserves structure**
*For any* valid JSON, minifying and then parsing should produce an equivalent data structure to the original.
**Validates: Requirements 2.2**

**Property 6: JSON key sorting**
*For any* JSON object, sorting keys alphabetically should preserve all values and nested structures.
**Validates: Requirements 2.3**

### JSON Import/Export Properties

**Property 7: JSON to CSV conversion**
*For any* JSON array of objects with consistent keys, conversion to CSV should produce a valid CSV with headers.
**Validates: Requirements 3.1**

**Property 8: CSV to JSON round-trip**
*For any* CSV with headers, converting to JSON and back to CSV should preserve the data structure.
**Validates: Requirements 3.2**

**Property 9: YAML to JSON conversion**
*For any* valid YAML, conversion to JSON should produce parseable JSON that represents the same data structure.
**Validates: Requirements 3.3**

**Property 10: Query parameters to JSON**
*For any* valid URL query string, conversion to JSON should correctly parse all key-value pairs.
**Validates: Requirements 3.4**

### JSON Key Style Converter Properties

**Property 11: Key style conversion completeness**
*For any* JSON object and target case style (camelCase, snake_case, kebab-case, PascalCase, CONSTANT_CASE), all keys should be converted to that style.
**Validates: Requirements 4.1**

**Property 12: Recursive key conversion**
*For any* JSON with nested objects and arrays, key conversion should recursively process all nested structures.
**Validates: Requirements 4.2**

**Property 13: Value preservation during key conversion**
*For any* JSON object and key style conversion, all values should remain unchanged.
**Validates: Requirements 4.3**

### JSON Schema Properties

**Property 14: Schema validation**
*For any* valid JSON and valid JSON Schema, validation should correctly identify whether the JSON conforms to the schema.
**Validates: Requirements 5.1**

**Property 15: Validation error details**
*For any* JSON that fails schema validation, the tool should provide specific error messages indicating which fields failed.
**Validates: Requirements 5.2**

**Property 16: Schema generation from JSON**
*For any* valid JSON object, the tool should generate a valid JSON Schema that validates the input.
**Validates: Requirements 5.3**

### JSON Path and Repair Properties

**Property 17: JSONPath evaluation**
*For any* valid JSON and valid JSONPath expression, the tool should return all matching elements.
**Validates: Requirements 6.1**

**Property 18: JSONPath error handling**
*For any* invalid JSONPath expression, the tool should display a clear error message.
**Validates: Requirements 6.2**

**Property 19: JSON repair**
*For any* malformed JSON with common issues (missing quotes, trailing commas), the repair function should attempt to fix it and produce valid JSON.
**Validates: Requirements 6.3**

### Text Compare Properties

**Property 20: Diff generation**
*For any* two text inputs, the diff algorithm should produce a comparison result showing additions, deletions, and unchanged sections.
**Validates: Requirements 7.1**

**Property 21: Diff highlighting**
*For any* two different texts, the diff output should highlight additions and deletions with distinct visual markers.
**Validates: Requirements 7.2**

**Property 22: Line number display**
*For any* text comparison, the output should include line numbers for both input texts.
**Validates: Requirements 7.4**

**Property 23: Diff mode invariant**
*For any* text inputs and diff mode, switching between diff modes should preserve the original input text content unchanged.
**Validates: Requirements 7.5**

### Base64 Encoder/Decoder Properties

**Property 24: Base64 round-trip**
*For any* text string, encoding to Base64 and then decoding should produce the original text.
**Validates: Requirements 8.1, 8.2**

**Property 25: Base64 decode error handling**
*For any* invalid Base64 string, attempting to decode should result in a clear error message.
**Validates: Requirements 8.3**

**Property 26: Base64 mode switching**
*For any* previous results, switching between encode and decode modes should clear the output area.
**Validates: Requirements 8.4**

### Hex Encoder/Decoder Properties

**Property 27: Hex round-trip**
*For any* text string, encoding to hexadecimal and then decoding should produce the original text.
**Validates: Requirements 9.1, 9.2**

**Property 28: Hex decode error handling**
*For any* invalid hexadecimal string, attempting to decode should result in a clear error message.
**Validates: Requirements 9.3**

**Property 29: Hex formatting**
*For any* encoded hex output, the tool should display it in a readable format with optional spacing.
**Validates: Requirements 9.4**

### URL Encoder/Decoder Properties

**Property 30: URL encoding round-trip**
*For any* text string, URL encoding and then decoding should produce the original text.
**Validates: Requirements 10.1, 10.2**

**Property 31: URL special character handling**
*For any* text with special characters and Unicode, URL encoding should correctly encode all characters.
**Validates: Requirements 10.3**

**Property 32: URL encoder mode switching**
*For any* previous results, switching between encode and decode modes should clear the output area.
**Validates: Requirements 10.4**

### Unicode Encoder/Decoder Properties

**Property 33: Unicode encoding**
*For any* text with Unicode characters, encoding should convert them to Unicode escape sequences.
**Validates: Requirements 11.1**

**Property 34: Unicode decoding**
*For any* valid Unicode escape sequences (both \\uXXXX and \\u{XXXXXX} formats), decoding should produce the original characters.
**Validates: Requirements 11.2, 11.3**

**Property 35: Unicode decode error handling**
*For any* invalid Unicode escape sequences, attempting to decode should result in a clear error message.
**Validates: Requirements 11.5**

### HTML Entity Encoder/Decoder Properties

**Property 36: HTML entity encoding**
*For any* text with special HTML characters (&lt;, &gt;, &amp;, &quot;, etc.), encoding should convert them to HTML entities.
**Validates: Requirements 12.1**

**Property 37: HTML entity decoding**
*For any* text with HTML entities, decoding should convert them to readable characters.
**Validates: Requirements 12.2**

**Property 38: HTML entity round-trip**
*For any* text with special HTML characters, encoding and then decoding should produce the original text.
**Validates: Requirements 12.3**

### AES/DES Encryption Properties

**Property 39: AES encryption round-trip**
*For any* plaintext and encryption key, encrypting with AES and then decrypting with the same key should produce the original plaintext.
**Validates: Requirements 13.1, 13.2**

**Property 40: AES output format**
*For any* encrypted data, the output should be in Base64 or hexadecimal format.
**Validates: Requirements 13.3**

**Property 41: AES incorrect key error**
*For any* ciphertext and incorrect decryption key, attempting to decrypt should result in an error message.
**Validates: Requirements 13.4**

**Property 42: Algorithm selection**
*For any* encryption operation, the tool should support AES-128, AES-192, AES-256, and DES algorithms.
**Validates: Requirements 13.5**

### RSA Encryption Properties

**Property 43: RSA key pair generation**
*For any* requested key size (1024, 2048, 4096 bits), the tool should generate a valid RSA public/private key pair.
**Validates: Requirements 14.1, 14.4**

**Property 44: RSA encryption round-trip**
*For any* plaintext, RSA public key, and corresponding private key, encrypting with the public key and decrypting with the private key should produce the original plaintext.
**Validates: Requirements 14.2, 14.3**

**Property 45: RSA key export format**
*For any* generated key pair, exporting should provide keys in PEM format.
**Validates: Requirements 14.5**

### MD5 Hash Generator Properties

**Property 46: MD5 hash generation**
*For any* text input, the tool should compute and display the MD5 hash in hexadecimal format.
**Validates: Requirements 15.1, 15.5**

**Property 47: MD5 real-time updates**
*For any* input change, the MD5 hash should recalculate in real-time.
**Validates: Requirements 15.2**

**Property 48: MD5 empty string**
*For any* empty input, the tool should display the MD5 hash of an empty string.
**Validates: Requirements 15.4**

### Regular Expression Tester Properties

**Property 49: Regex pattern validation**
*For any* regex pattern input, the tool should validate the syntax and report whether it's valid or invalid.
**Validates: Requirements 16.1**

**Property 50: Regex match highlighting**
*For any* valid regex pattern and test text, all matches should be highlighted in the text.
**Validates: Requirements 16.2**

**Property 51: Regex group display**
*For any* regex with capture groups and matching text, the tool should display both full matches and individual capture groups.
**Validates: Requirements 16.3**

**Property 52: Regex flag reactivity**
*For any* regex pattern and test text, changing flags should trigger re-evaluation and update the matches.
**Validates: Requirements 16.4**

**Property 53: Regex error handling**
*For any* invalid regex pattern, the tool should display a detailed error message.
**Validates: Requirements 16.5**

### Color Converter Properties

**Property 54: Color format conversion**
*For any* valid color in any format, the tool should convert it to RGB, HEX, HSL, HWB, and OKLCH formats.
**Validates: Requirements 17.1**

**Property 55: Color picker real-time updates**
*For any* color picker adjustment, all format representations should update in real-time.
**Validates: Requirements 17.2**

**Property 56: Color format copy**
*For any* displayed color format, clicking on it should copy that format value to the clipboard.
**Validates: Requirements 17.3**

**Property 57: Color validation error**
*For any* invalid color input, the tool should display a clear error message.
**Validates: Requirements 17.4**

### QR Code Generator Properties

**Property 58: QR code generation**
*For any* text or URL input, the generator should produce a valid QR code image that can be scanned.
**Validates: Requirements 18.1**

**Property 59: QR code sizing**
*For any* specified dimensions, the generated QR code should match those dimensions.
**Validates: Requirements 18.3**

**Property 60: QR code download format**
*For any* generated QR code, the download should provide a valid PNG image file.
**Validates: Requirements 18.4**

### UUID Generator Properties

**Property 61: UUID v4 format validation**
*For any* generated UUID, it should match the UUID v4 format specification (8-4-4-4-12 hexadecimal pattern with version and variant bits).
**Validates: Requirements 19.1**

**Property 62: Bulk UUID generation count**
*For any* specified quantity N, bulk generation should produce exactly N UUIDs.
**Validates: Requirements 19.4, 19.5**

**Property 63: UUID uniqueness**
*For any* bulk generation request, all generated UUIDs should be unique (no duplicates).
**Validates: Requirements 19.5**

### SQL Utilities Properties

**Property 64: MyBatis parameter substitution**
*For any* MyBatis SQL with parameters, the tool should parse and display the actual SQL with parameter values substituted.
**Validates: Requirements 20.1**

**Property 65: JSON to SQL conversion**
*For any* JSON array of objects, the tool should generate valid SQL INSERT statements.
**Validates: Requirements 20.2**

**Property 66: CSV to SQL conversion**
*For any* CSV data with headers, the tool should generate valid SQL INSERT statements.
**Validates: Requirements 20.3**

**Property 67: SQL to entity generation**
*For any* SQL CREATE TABLE or SELECT statement, the tool should generate corresponding Java or TypeScript entity classes with proper type annotations.
**Validates: Requirements 20.4, 20.5**

### Privacy Properties

**Property 68: Client-side processing**
*For any* tool operation, no network requests should be made to external servers (excluding initial page load and CDN resources).
**Validates: Requirements 21.1, 21.2**

**Property 69: Offline functionality**
*For any* tool, after initial page load, the tool should function without network connectivity.
**Validates: Requirements 21.5**

### Accessibility Properties

**Property 70: Responsive layout**
*For any* tool page and viewport size (mobile, tablet, desktop), the layout should be readable and usable.
**Validates: Requirements 22.1, 22.4**

**Property 71: Keyboard accessibility**
*For any* interactive element (buttons, inputs, links), it should be accessible via keyboard navigation.
**Validates: Requirements 22.2**

**Property 72: ARIA labels**
*For any* interactive element, appropriate ARIA labels and semantic HTML should be present.
**Validates: Requirements 22.3**

## Error Handling

### Error Handling Strategy

The toolkit implements a consistent error handling approach across all tools:

1. **Input Validation**: Validate user input before processing
2. **Graceful Degradation**: Display errors without breaking the UI
3. **Clear Error Messages**: Provide specific, actionable error messages
4. **Error Recovery**: Allow users to correct errors and retry

### Error Types

```typescript
interface ToolError {
  type: 'validation' | 'processing' | 'system'
  message: string
  details?: string
  recoverable: boolean
}
```

### Error Display Component

```typescript
function ErrorDisplay(props: { error: ToolError | null }) {
  return (
    <Show when={props.error}>
      <div class="error-banner" role="alert">
        <Icon name="lucide:alert-circle" />
        <div>
          <div class="error-message">{props.error?.message}</div>
          <Show when={props.error?.details}>
            <div class="error-details">{props.error?.details}</div>
          </Show>
        </div>
      </div>
    </Show>
  )
}
```

### Common Error Scenarios

1. **Invalid Input Format**: JSON parsing errors, invalid regex, malformed JWT
2. **Browser API Failures**: Clipboard access denied, localStorage full
3. **Processing Errors**: Image conversion failures, code execution errors
4. **Validation Errors**: Invalid Base64, invalid cron expression, invalid color format

## Testing Strategy

### Testing Approach

The toolkit will use unit testing focused on utility functions and UI components:

**Unit Tests** verify:
- Utility function correctness with specific examples
- Edge cases (empty input, very large input, special characters)
- Error conditions (invalid input, API failures)
- Round-trip conversions (encode/decode, format/parse)
- UI component rendering and interactions

### Test Organization

All tests are organized in `__test__/` directories alongside the code they test:

```
src/
  utils/
    [category]/
      [tool].ts
      __test__/
        [tool].test.ts      # Utility function tests
  pages/
    [category]/
      [tool].tsx
      __test__/
        [tool].test.tsx     # Page component tests
  components/
    ui/
      [component].tsx       # No tests required for UI components
```

**Note: Components in `src/components/ui/` do not require tests** as they are reusable UI primitives from Kobalte that are already tested.

### Testing Focus Areas

**Utility Functions:**
- Input validation
- Data transformation correctness
- Error handling
- Round-trip properties (encode/decode, serialize/deserialize)
- Edge cases and boundary conditions

**Page Components:**
- Component rendering
- User interactions (clicks, input changes)
- State management
- Error display
- Integration with utility functions

**UI Components in `src/components/ui/`:**
- No testing required (reusable primitives from Kobalte)

### Example Unit Test

```typescript
import { describe, it, expect } from 'vitest'
import { encodeBase64, decodeBase64 } from '../base64'

describe('Base64 Converter', () => {
  it('should encode text to base64', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=')
  })

  it('should decode base64 to text', () => {
    expect(decodeBase64('aGVsbG8=')).toBe('hello')
  })

  it('should round-trip encode and decode', () => {
    const original = 'Hello, World! 🌍'
    const encoded = encodeBase64(original)
    const decoded = decodeBase64(encoded)
    expect(decoded).toBe(original)
  })

  it('should handle empty string', () => {
    expect(encodeBase64('')).toBe('')
    expect(decodeBase64('')).toBe('')
  })

  it('should throw error for invalid base64', () => {
    expect(() => decodeBase64('invalid!!!')).toThrow()
  })
})
```

### Testing Tools

- **Test Runner**: Vitest (fast, Vite-native)
- **Component Testing**: @solidjs/testing-library
- **Assertions**: Vitest's built-in assertions
- **Coverage**: Vitest coverage with c8

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

1. Set up project structure and routing
2. Create shared UI components
3. Implement home page with tool cards
4. Set up testing infrastructure
5. Implement sidebar navigation from fileRoutes

### Phase 2: JSON Tools Suite

1. JSON Formatter (enhance existing - format, minify, sort)
2. JSON Import/Export (CSV, YAML, query params)
3. JSON Key Style Converter
4. JSON Schema Validator and Generator
5. JSON Path and Repair

### Phase 3: Text & Comparison Tools

1. Text Compare tool (side-by-side and unified diff)

### Phase 4: Encoding/Decoding Tools

1. Base64 Encoder/Decoder (enhance existing)
2. Hex Encoder/Decoder
3. URL Encoder/Decoder
4. Unicode Encoder/Decoder
5. HTML Entity Encoder/Decoder

### Phase 5: Cryptography Tools

1. AES/DES Encryption/Decryption
2. RSA Encryption/Decryption
3. MD5 Hash Generator (with SHA-1, SHA-256, SHA-512)

### Phase 6: Developer Utilities

1. Regular Expression Tester
2. Color Converter and Picker
3. QR Code Generator
4. UUID Generator (enhance existing)
5. SQL Utilities (MyBatis parser, converters, entity generator)

### Phase 7: Privacy & Accessibility

1. Verify client-side processing (no network requests)
2. Implement offline functionality
3. Add keyboard navigation
4. Add ARIA labels and semantic HTML
5. Test responsive design across devices

### Phase 8: Polish & Optimization

1. Shared clipboard utility
2. Consistent error handling
3. Loading states for heavy operations
4. PWA service worker
5. Bundle optimizationntax highlighting
2. JSON to TypeScript converter
3. Text Compare tool
4. Case Converter
5. SQL Formatter

### Phase 3: Encoding & Cryptography

1. Base64 Converter (enhance existing)
2. URL Encoder
3. Hash Generator (MD5, SHA-1, SHA-256, SHA-512)
4. JWT Decoder
5. Number Base Converter

### Phase 4: Code & Development Tools

1. Markdown Editor with live preview
2. Regex Generator and tester
3. Code Playground
4. Cron Calculator

### Phase 5: Generation & Utility Tools

1. UUID Generator (enhance existing)
2. Lorem Ipsum Generator
3. QR Code Generator
4. Token Counter
5. Timestamp Converter

### Phase 6: Visual & Media Tools

1. Color Palette Generator
2. Image Format Converter
3. CSV to JSON Converter

### Phase 7: Polish & Optimization

1. Responsive design refinements
2. Accessibility improvements
3. Performance optimization
4. PWA enhancements
5. Documentation

## Technology Choices

### Core Libraries

**JSON Processing:**
- Native `JSON.parse()` and `JSON.stringify()` for basic operations
- Custom formatter for syntax highlighting
- `ajv` for JSON Schema validation
- `jsonpath-plus` for JSONPath queries
- `js-yaml` for YAML conversion

**Text Comparison:**
- `diff` library for generating diffs
- Custom renderer for side-by-side and unified views

**Encoding/Decoding:**
- Native `btoa`/`atob` for Base64 (with Buffer fallback for Node.js compatibility)
- Native `encodeURIComponent`/`decodeURIComponent` for URL encoding
- Custom implementations for Hex, Unicode escape sequences, and HTML entities

**Cryptography:**
- Native Web Crypto API for AES, RSA, and SHA hashes
- `crypto-js` for MD5 and DES (not in Web Crypto API)
- PEM format handling for RSA key export

**Regex:**
- Native JavaScript RegExp
- Custom match highlighter with capture group extraction

**Color Theory:**
- `tinycolor2` for color manipulation and format conversion

**QR Codes:**
- `qrcode` library for generation with error correction

**UUID:**
- `uuid` library for v4 generation
- Custom validator for UUID format

**CSV:**
- `papaparse` for robust CSV parsing and generation

**SQL:**
- Custom parser for MyBatis parameter substitution
- Custom code generator for entity classes

### Why These Choices

1. **Native APIs First**: Use browser APIs when available (Web Crypto, Canvas, Clipboard)
2. **Small Bundle Size**: Prefer lightweight libraries
3. **Client-Side Only**: All libraries must work in the browser
4. **Well-Maintained**: Choose libraries with active maintenance
5. **TypeScript Support**: Prefer libraries with TypeScript definitions

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load tool-specific libraries only when needed
2. **Code Splitting**: Each tool page is a separate route chunk
3. **Debouncing**: Debounce real-time updates (e.g., token counter, hash generator)
4. **Web Workers**: Use workers for heavy processing (image conversion, large text diffs)
5. **Virtual Scrolling**: For large outputs (e.g., bulk UUID generation)
6. **Memoization**: Cache expensive computations

### Performance Targets

- Initial page load: < 2s
- Tool page navigation: < 500ms
- Processing operations: < 1s for typical inputs
- Real-time updates: < 100ms debounce

## Security Considerations

### Client-Side Security

1. **No Server Transmission**: All data stays in the browser
2. **Sandboxed Code Execution**: Use iframe sandbox for code playground
3. **Input Sanitization**: Sanitize user input before rendering
4. **CSP Headers**: Implement Content Security Policy
5. **No External Dependencies at Runtime**: All libraries bundled

### Privacy Guarantees

1. **No Analytics**: No tracking or analytics by default
2. **No Cookies**: No cookies for tracking
3. **LocalStorage Only**: Only use localStorage for user preferences (with consent)
4. **Offline Capable**: Works without network after initial load

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels and semantic HTML
3. **Color Contrast**: Minimum 4.5:1 contrast ratio for text
4. **Focus Indicators**: Clear focus indicators for all interactive elements
5. **Responsive Text**: Text scales with browser zoom
6. **Alternative Text**: Alt text for all images and icons

### Accessibility Testing

- Automated testing with axe-core
- Manual keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Color contrast verification

## Deployment

### Build Configuration

```bash
# Production build
bun run build

# Output: dist/
# - Minified JavaScript bundles
# - Optimized CSS
# - Service worker for PWA
# - Static assets
```

### Hosting

- Static hosting (Vercel, Netlify, GitHub Pages)
- CDN for global distribution
- HTTPS required for Web Crypto API and PWA

### PWA Configuration

- Service worker for offline support
- App manifest for install prompt
- Icons for various platforms
- Caching strategy for assets

## Future Enhancements

### Potential Additional Tools

1. **API Testing**: HTTP request builder
2. **WebSocket Tester**: WebSocket connection testing
3. **JSON Schema Validator**: Validate JSON against schemas
4. **YAML Converter**: YAML to JSON conversion
5. **XML Formatter**: XML formatting and validation
6. **HTML Formatter**: HTML beautification
7. **CSS Minifier**: CSS minification
8. **JavaScript Minifier**: JavaScript minification
9. **Image Optimizer**: Image compression
10. **PDF Tools**: PDF manipulation

### Feature Enhancements

1. **Tool History**: Save recent inputs/outputs
2. **Favorites**: Mark frequently used tools
3. **Themes**: Dark/light mode toggle
4. **Export/Import**: Export tool configurations
5. **Keyboard Shortcuts**: Global keyboard shortcuts
6. **Tool Chaining**: Pipe output from one tool to another
7. **Batch Processing**: Process multiple inputs at once
8. **Custom Presets**: Save tool configurations

## Conclusion

This design provides a comprehensive blueprint for building a privacy-first developer toolkit with 22+ essential utilities. The architecture emphasizes client-side processing, accessibility, and performance while maintaining a clean, modular codebase. The dual testing approach with both unit tests and property-based tests ensures correctness across all tools.
