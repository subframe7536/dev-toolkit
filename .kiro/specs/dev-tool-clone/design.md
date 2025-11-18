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

### JSON Viewer Properties

**Property 3: JSON parsing and formatting**
Valid JSON strings should be parsed and formatted correctly, producing output that can be parsed back to an equivalent structure.
**Validates: Requirements 2.1**

**Property 4: JSON parsing error handling**
Invalid JSON strings should result in clear error messages being displayed.
**Validates: Requirements 2.2**

**Property 5: JSON syntax highlighting**
Formatted JSON output should contain syntax highlighting markup for keys, values, and data types.
**Validates: Requirements 2.3**

**Property 6: JSON collapse/expand controls**
JSON with nested objects or arrays should include collapse/expand controls for each nested structure.
**Validates: Requirements 2.5**

### Text Compare Properties

**Property 7: Diff generation**
*For any* two text inputs, the diff algorithm should produce a comparison result showing additions, deletions, and unchanged sections.
**Validates: Requirements 3.1**

**Property 8: Diff highlighting**
*For any* two different texts, the diff output should highlight additions and deletions with distinct visual markers.
**Validates: Requirements 3.2**

**Property 9: Line number display**
*For any* text comparison, the output should include line numbers for both input texts.
**Validates: Requirements 3.4**

**Property 10: Diff mode invariant**
*For any* text inputs and diff mode, switching between diff modes should preserve the original input text content unchanged.
**Validates: Requirements 3.5**

### Case Converter Properties

**Property 11: Case conversion completeness**
*For any* text input, the case converter should provide all six conversion options: camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, and Title Case.
**Validates: Requirements 4.1**

**Property 12: Case conversion correctness**
*For any* multi-word text input and selected case type, the converter should correctly identify word boundaries and apply the appropriate case convention.
**Validates: Requirements 4.2, 4.3**

### Token Counter Properties

**Property 13: Token count calculation**
*For any* text input, the token counter should calculate and display character count, word count, and token count.
**Validates: Requirements 5.1, 5.2**

**Property 14: Model-specific tokenization**
*For any* text input and two different AI models, the token counts should differ according to each model's tokenization method.
**Validates: Requirements 5.3**

**Property 15: Cost calculation**
*For any* text input and selected model, the token counter should display an estimated API cost based on the token count and model pricing.
**Validates: Requirements 5.4**

**Property 16: Real-time count updates**
*For any* text input change, all counts (characters, words, tokens) should update to reflect the new input.
**Validates: Requirements 5.5**

### UUID Generator Properties

**Property 17: UUID v4 format validation**
*For any* generated UUID, it should match the UUID v4 format specification (8-4-4-4-12 hexadecimal pattern with version and variant bits).
**Validates: Requirements 6.1**

**Property 18: Bulk UUID generation count**
*For any* specified quantity N, bulk generation should produce exactly N UUIDs.
**Validates: Requirements 6.4, 6.5**

**Property 19: UUID uniqueness**
*For any* bulk generation request, all generated UUIDs should be unique (no duplicates).
**Validates: Requirements 6.5**

### Base64 Converter Properties

**Property 20: Base64 round-trip**
Text encoded to Base64 and then decoded should produce the original text.
**Validates: Requirements 7.1, 7.2**

**Property 21: Base64 decode error handling**
Invalid Base64 strings should result in error messages when attempting to decode.
**Validates: Requirements 7.3**

**Property 22: Base64 mode switching**
Switching between encode and decode modes should clear the output area.
**Validates: Requirements 7.4**

### JSON to TypeScript Properties

**Property 23: TypeScript interface generation**
*For any* valid JSON object, the tool should generate valid TypeScript interface definitions that can be compiled by the TypeScript compiler.
**Validates: Requirements 8.1**

**Property 24: Nested interface generation**
*For any* JSON with nested objects, the tool should create separate named interfaces for each nested structure.
**Validates: Requirements 8.2**

**Property 25: Array type inference**
*For any* JSON containing arrays, the generated TypeScript should use correct array type syntax (Type[] or Array<Type>).
**Validates: Requirements 8.3**

**Property 26: JSON to TypeScript error handling**
*For any* invalid JSON input, the tool should display a parsing error message.
**Validates: Requirements 8.4**

### JWT Decoder Properties

**Property 27: JWT section parsing**
*For any* valid JWT token, the decoder should extract and display three sections: header, payload, and signature.
**Validates: Requirements 9.1**

**Property 28: JWT payload formatting**
*For any* JWT token, the payload section should be formatted as readable JSON with syntax highlighting.
**Validates: Requirements 9.2**

**Property 29: JWT decode error handling**
*For any* malformed JWT token, the decoder should display an error message.
**Validates: Requirements 9.3**

**Property 30: JWT timestamp formatting**
*For any* JWT containing timestamp claims (exp, iat, nbf), those timestamps should be displayed in human-readable date format.
**Validates: Requirements 9.5**

### SQL Formatter Properties

**Property 31: SQL formatting**
*For any* SQL query string, the formatter should produce output with proper indentation and line breaks.
**Validates: Requirements 10.1**

**Property 32: SQL keyword highlighting**
*For any* SQL query, the formatted output should apply highlighting to SQL keywords (SELECT, FROM, WHERE, etc.).
**Validates: Requirements 10.2**

**Property 33: SQL expansion**
*For any* minified single-line SQL query, the formatter should expand it into a multi-line format.
**Validates: Requirements 10.3**

**Property 34: SQL error tolerance**
*For any* SQL input (valid or invalid), the formatter should not throw errors and should attempt to format the input.
**Validates: Requirements 10.5**

### Number Base Converter Properties

**Property 35: Multi-base conversion**
*For any* valid number in any base, the converter should display conversions to binary, octal, decimal, and hexadecimal.
**Validates: Requirements 11.1**

**Property 36: Base-specific validation**
*For any* input and selected base, the converter should reject digits that are invalid for that base (e.g., '8' in octal, 'G' in hex).
**Validates: Requirements 11.2, 11.3**

**Property 37: Base conversion reactivity**
*For any* input change, all four base representations should update to reflect the new value.
**Validates: Requirements 11.4**

### CSV/JSON Converter Properties

**Property 38: CSV/JSON round-trip**
*For any* CSV with headers, converting to JSON and back to CSV should preserve the data structure and headers.
**Validates: Requirements 12.1, 12.2**

**Property 39: CSV/JSON mode invariant**
*For any* input data, switching between CSV-to-JSON and JSON-to-CSV modes should preserve the input content unchanged.
**Validates: Requirements 12.4**

### Image Format Converter Properties

**Property 40: Image preview display**
*For any* uploaded image file, the converter should display a preview of the image.
**Validates: Requirements 13.1**

**Property 41: Image format conversion**
*For any* image and target format, the converter should produce a valid image file in the specified format (PNG, JPEG, WebP, or BMP).
**Validates: Requirements 13.2**

**Property 42: Client-side image processing**
*For any* image conversion operation, no network requests should be made to external servers.
**Validates: Requirements 13.5**

### Markdown Editor Properties

**Property 43: Markdown live preview**
*For any* Markdown input, the preview should display the rendered HTML representation.
**Validates: Requirements 14.1**

**Property 44: Markdown element rendering**
*For any* Markdown containing headings, lists, code blocks, links, or images, the preview should render each element type correctly.
**Validates: Requirements 14.2**

**Property 45: Markdown mode invariant**
*For any* Markdown content, switching between edit and preview modes should preserve the content unchanged.
**Validates: Requirements 14.3**

**Property 46: Code block syntax highlighting**
*For any* Markdown code block with a specified language, the preview should apply syntax highlighting.
**Validates: Requirements 14.5**

### Cron Calculator Properties

**Property 47: Cron execution time calculation**
*For any* valid cron expression, the calculator should display the next scheduled execution times.
**Validates: Requirements 15.1**

**Property 48: Cron expression generation**
*For any* visual builder configuration, the generated cron expression should be valid and parseable.
**Validates: Requirements 15.2**

**Property 49: Cron validation error handling**
*For any* invalid cron expression, the calculator should display an error message with details.
**Validates: Requirements 15.3**

**Property 50: Cron execution count**
*For any* valid cron expression, the calculator should display at least 5 next scheduled execution times.
**Validates: Requirements 15.4**

### Regex Generator Properties

**Property 51: Regex pattern validation**
*For any* regex pattern input, the tool should validate the syntax and report whether it's valid or invalid.
**Validates: Requirements 16.1**

**Property 52: Regex match highlighting**
*For any* valid regex pattern and test text, all matches should be highlighted in the text.
**Validates: Requirements 16.2**

**Property 53: Regex group display**
*For any* regex with capture groups and matching text, the tool should display both full matches and individual capture groups.
**Validates: Requirements 16.3**

**Property 54: Regex flag reactivity**
*For any* regex pattern and test text, changing flags should trigger re-evaluation and update the matches.
**Validates: Requirements 16.4**

**Property 55: Regex error handling**
*For any* invalid regex pattern, the tool should display a detailed error message.
**Validates: Requirements 16.5**

### Code Playground Properties

**Property 56: Code syntax highlighting**
*For any* code input and selected language, the editor should apply syntax highlighting appropriate for that language.
**Validates: Requirements 17.1**

**Property 57: Code execution**
*For any* valid code, clicking run should execute it and display the output.
**Validates: Requirements 17.2**

**Property 58: Code error display**
*For any* code that produces errors, the playground should display error messages with line numbers.
**Validates: Requirements 17.4**

**Property 59: Code persistence**
*For any* code saved by the user, it should be stored in browser localStorage and retrievable on next visit.
**Validates: Requirements 17.5**

### Timestamp Converter Properties

**Property 60: Timestamp round-trip**
*For any* Unix timestamp, converting to date and back to timestamp should produce the original value (within timezone precision).
**Validates: Requirements 18.1, 18.2**

**Property 61: Timestamp multi-format display**
*For any* timestamp or date input, the converter should display the result in multiple date formats and timezones.
**Validates: Requirements 18.3**

### Hash Generator Properties

**Property 62: Multi-algorithm hash generation**
*For any* text input, the hash generator should compute and display MD5, SHA-1, SHA-256, and SHA-512 hashes simultaneously.
**Validates: Requirements 19.1, 19.2**

**Property 63: Hash reactivity**
*For any* input text change, all four hash values should recalculate and update.
**Validates: Requirements 19.3**

### URL Encoder Properties

**Property 64: URL encoding round-trip**
*For any* text string, URL encoding and then decoding should produce the original text.
**Validates: Requirements 20.1, 20.2, 20.3**

**Property 65: URL encoder mode switching**
*For any* previous results, switching between encode and decode modes should clear the output area.
**Validates: Requirements 20.4**

### Lorem Generator Properties

**Property 66: Lorem paragraph count**
*For any* specified paragraph count N, the generator should produce exactly N paragraphs.
**Validates: Requirements 21.1**

**Property 67: Lorem word count**
*For any* specified word count N, the generator should produce text with approximately N words (within ±10% tolerance).
**Validates: Requirements 21.2**

**Property 68: Lorem sentence count**
*For any* specified sentence count N, the generator should produce exactly N sentences.
**Validates: Requirements 21.3**

### QR Code Generator Properties

**Property 69: QR code generation**
*For any* text or URL input, the generator should produce a valid QR code image that can be scanned.
**Validates: Requirements 22.1**

**Property 70: QR code sizing**
*For any* specified dimensions, the generated QR code should match those dimensions.
**Validates: Requirements 22.3**

**Property 71: QR code download format**
*For any* generated QR code, the download should provide a valid PNG image file.
**Validates: Requirements 22.4**

### Color Palette Generator Properties

**Property 72: Palette generation**
*For any* base color, the generator should produce a color palette with multiple colors.
**Validates: Requirements 23.1**

**Property 73: Palette type generation**
*For any* base color and palette type (complementary, analogous, triadic, monochromatic), the generator should produce colors following that color theory rule.
**Validates: Requirements 23.2**

**Property 74: Color format display**
*For any* generated color in the palette, it should be displayed with hex, RGB, and HSL values.
**Validates: Requirements 23.3**

**Property 75: Palette reactivity**
*For any* base color change, the entire palette should regenerate with new colors.
**Validates: Requirements 23.5**

### Privacy Properties

**Property 76: Client-side processing**
*For any* tool operation, no network requests should be made to external servers (excluding initial page load and CDN resources).
**Validates: Requirements 24.1, 24.2**

**Property 77: Offline functionality**
*For any* tool, after initial page load, the tool should function without network connectivity.
**Validates: Requirements 24.5**

### Accessibility Properties

**Property 78: Responsive layout**
*For any* tool page and viewport size (mobile, tablet, desktop), the layout should be readable and usable.
**Validates: Requirements 25.1, 25.4**

**Property 79: Keyboard accessibility**
*For any* interactive element (buttons, inputs, links), it should be accessible via keyboard navigation.
**Validates: Requirements 25.2**

**Property 80: ARIA labels**
*For any* interactive element, appropriate ARIA labels and semantic HTML should be present.
**Validates: Requirements 25.3**

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

### Phase 2: Text & Data Tools

1. JSON Viewer with syntax highlighting
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

**Text Comparison:**
- `diff` library for generating diffs
- Custom renderer for side-by-side and unified views

**Markdown:**
- `marked` for Markdown parsing
- `highlight.js` for code block syntax highlighting

**Regex:**
- Native JavaScript RegExp
- Custom match highlighter

**Code Execution:**
- `eval()` for JavaScript (sandboxed)
- `typescript` compiler API for TypeScript
- iframe sandbox for HTML/CSS

**Cryptography:**
- Native Web Crypto API for SHA hashes
- `crypto-js` for MD5 (not in Web Crypto)

**QR Codes:**
- `qrcode` library for generation

**Color Theory:**
- `tinycolor2` for color manipulation and palette generation

**Image Processing:**
- Native Canvas API for format conversion (PNG, JPEG, WebP, BMP)
- SVG support for vector image conversion and optimization

**Cron:**
- `cron-parser` for parsing and calculating execution times

**JWT:**
- Custom decoder (JWT is just Base64 + JSON)

**CSV:**
- `papaparse` for robust CSV parsing

**Token Counting:**
- `gpt-tokenizer` for OpenAI models
- Custom tokenizers for other models

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
