# Design Document

## Overview

The Regex Visualizer is a client-side web application built with SolidJS that provides comprehensive regular expression testing, matching, and debugging capabilities. The application offers real-time pattern matching, detailed match analysis, performance monitoring, and code export functionality. The design emphasizes practical utility, helping developers test and debug regex patterns with comprehensive feedback and analysis tools.

## Architecture

The application follows a modular, reactive architecture leveraging SolidJS's fine-grained reactivity system. The core architecture consists of three main layers:

### Presentation Layer
Components are organized in `src/components/regex-tester/`:
- **PatternInput** (`pattern-input.tsx`): Input component with syntax highlighting and error display
- **TestingPanel** (`testing-panel.tsx`): Pattern testing interface with match highlighting
- **DetailsPanel** (`details-panel.tsx`): Match information and capture group details
- **ExplanationPanel** (`explanation-panel.tsx`): Human-readable pattern explanations
- **HelpPanel** (`help-panel.tsx`): Regex syntax reference
- **PatternLibrarySheet** (`pattern-library.tsx`): Slide-out panel for browsing common patterns

All components are re-exported from `src/components/regex-tester/index.ts`.

### Business Logic Layer
Located in `src/utils/regex/`:
- **match-engine.ts**: Pattern matching and result analysis
- **explanation-engine.ts**: Generates human-readable explanations for regex elements
- **pattern-library.ts**: Predefined regex patterns with descriptions
- **types.ts**: TypeScript interfaces and types

### Data Layer
- **RegexContext** (`src/contexts/regex-context.tsx`): SolidJS context providing global state access
- **RegexStore**: SolidJS store managing pattern, flags, test data, and UI state

## Components and Interfaces

### Core Components

#### RegexTesterPage
```typescript
interface RegexTesterPageProps {}

interface RegexStore {
  pattern: string;
  flags: RegexFlags;
  testText: string;
  isValid: boolean;
  parseError?: ParseError;
  matches: MatchResult[];
  showExportDialog: boolean;
  selectedExportLanguage: 'javascript' | 'python' | 'java';
}

interface RegexFlags {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  sticky: boolean;
}
```

#### RegexContext
```typescript
interface RegexContextValue {
  store: RegexStore;
  actions: {
    setPattern: (pattern: string) => void;
    setFlags: (flags: Partial<RegexFlags>) => void;
    setTestText: (text: string) => void;
    toggleExportDialog: (show: boolean) => void;
    setExportLanguage: (language: 'javascript' | 'python' | 'java') => void;
    exportCode: () => string;
  };
}
```

#### PatternInput
```typescript
interface PatternInputProps {
  pattern: string;
  onPatternChange: (pattern: string) => void;
  parseError?: ParseError;
  flags: RegexFlags;
  onFlagsChange: (flags: RegexFlags) => void;
}

interface ParseError {
  message: string;
  position: number;
  length: number;
}

interface SyntaxHighlighter {
  highlightRegex: (pattern: string) => string;
  validatePattern: (pattern: string) => ValidationResult;
}
```

#### ExportDialog
```typescript
interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pattern: string;
  flags: RegexFlags;
}

interface ExportConfig {
  language: 'javascript' | 'python' | 'java';
  includeFlags: boolean;
  includeComments: boolean;
  variableName?: string;
}
```

#### TestingPanel
```typescript
interface TestingPanelProps {
  pattern: string;
  flags: RegexFlags;
  testText: string;
  onTestTextChange: (text: string) => void;
  matches: MatchResult[];
}

interface MatchResult {
  index: number;
  fullMatch: string;
  groups: CaptureGroup[];
  start: number;
  end: number;
}

interface CaptureGroup {
  index: number;
  name?: string;
  value: string;
  start: number;
  end: number;
}
```

### Business Logic Interfaces

#### RegexParser
```typescript
interface RegexParser {
  validate(pattern: string): ValidationResult;
  getExplanation(pattern: string): ExplanationResult;
}

interface ValidationResult {
  isValid: boolean;
  error?: ParseError;
}

interface ExplanationResult {
  elements: RegexElement[];
  description: string;
}

interface RegexElement {
  type: string;
  value: string;
  description: string;
  position: { start: number; end: number };
}
```


#### MatchEngine
```typescript
interface MatchEngine {
  findMatches(pattern: string, flags: RegexFlags, text: string): MatchResult[];
  validateInput(pattern: string, text: string): ValidationResult;
  analyzePerformance(pattern: string, text: string): PerformanceResult;
}

interface PerformanceResult {
  executionTime: number;
  steps: number;
  backtrackingDetected: boolean;
  warnings: PerformanceWarning[];
}
```

## Data Models

### Pattern Library Structure
```typescript
interface PatternCategory {
  id: string;
  name: string;
  description: string;
  patterns: PatternDefinition[];
}

interface PatternDefinition {
  id: string;
  name: string;
  pattern: string;
  flags: RegexFlags;
  description: string;
  examples: PatternExample[];
  tags: string[];
}

interface PatternExample {
  input: string;
  shouldMatch: boolean;
  description: string;
}
```

### Export Configuration
```typescript
interface ExportResult {
  code: string;
  language: 'javascript' | 'python' | 'java';
  filename: string;
}
```

### Step-by-Step Debugging
```typescript
interface DebugStep {
  stepNumber: number;
  position: number;
  currentNode: ASTNode;
  action: 'match' | 'backtrack' | 'advance' | 'fail' | 'success';
  description: string;
  state: DebugState;
}

interface DebugState {
  inputPosition: number;
  captureGroups: { [key: number]: string };
  backtrackStack: BacktrackPoint[];
}
```

## Technology Stack

### Core Framework
- **SolidJS 1.9.10**: Reactive UI framework with fine-grained reactivity
- **SolidJS Store**: Built-in state management with createStore and context
- **TypeScript 5.9.3**: Type safety and enhanced developer experience
- **Vite 7.2.4**: Fast build tool and development server

### Regex Processing
- **Built-in RegExp**: JavaScript's native RegExp for pattern matching and validation
- **Shiki**: Syntax highlighting for regex patterns with single theme support
- **Custom explanation engine**: Pattern analysis for educational explanations

### Syntax Highlighting Implementation
```typescript
// Shiki configuration for regex highlighting
interface ShikiConfig {
  theme: 'github-light'; // Single theme, no user switching
  langs: ['regex'];
  highlighter: BundledHighlighter;
}

// Custom regex grammar for better highlighting
interface RegexGrammar {
  patterns: {
    quantifiers: /[*+?{}\d,]/;
    groups: /[()]/;
    charClasses: /[\[\]\\]/;
    anchors: /[\^$]/;
    alternation: /\|/;
    literals: /[a-zA-Z0-9]/;
  };
}
```

### UI Components
- **Kobalte Core**: Accessible UI primitives
- **UnoCSS**: Utility-first CSS framework
- **Iconify/Lucide**: Icon system
- **Shiki**: Lightweight syntax highlighting for regex patterns

### Utilities
- **clipboard-copy**: Clipboard operations for sharing and export
- **Custom regex validator**: Lightweight regex validation and error positioning

## Implementation Strategy

### Lightweight Architecture Principles
- **Minimal Dependencies**: Use textarea + Shiki instead of heavy Monaco Editor (~2MB → ~300KB)
- **Native Performance**: Leverage browser's built-in RegExp for optimal matching performance
- **Simple State Management**: Use SolidJS context + store without external state libraries
- **No Theme Switching**: Single light theme to reduce bundle size and complexity
- **Essential Features Only**: Focus on core regex testing without advanced editor features

### Phase 1: Core Infrastructure
1. Set up project structure and routing
2. Implement textarea-based pattern input with Shiki syntax highlighting
3. Create fundamental UI components and layout
4. Establish SolidJS context + store state management

### Phase 2: Testing and Matching Engine
1. Build pattern matching engine with detailed results
2. Implement real-time text highlighting
3. Create match details panel with group information
4. Add flag configuration and behavior

### Phase 3: Advanced Features
1. Implement step-by-step debugging functionality
2. Add performance analysis and warnings
3. Create pattern library with categorized examples
4. Build export dialog for JavaScript, Python, and Java

### Phase 4: Polish and Optimization
1. Add comprehensive error handling and user feedback
2. Implement accessibility features and keyboard navigation
3. Optimize performance for large patterns and text
4. Add comprehensive testing and documentation

## Error Handling

### Parse Error Recovery
- Graceful degradation when regex parsing fails
- Clear error messages with position indicators
- Suggestion system for common syntax errors
- Fallback to basic pattern matching when AST generation fails

### Runtime Error Management
- Timeout protection for potentially infinite loops
- Memory usage monitoring for large text inputs
- Graceful handling of unsupported regex features
- User-friendly error messages with actionable suggestions

### Performance Safeguards
- Execution time limits with user warnings
- Backtracking detection and optimization suggestions
- Input size limits with progressive loading for large texts
- Browser compatibility checks for advanced regex features

## Testing Strategy

The testing approach combines unit testing for individual components with property-based testing for regex correctness validation. Both testing methodologies are essential for ensuring comprehensive coverage and correctness.

### Unit Testing
Unit tests focus on specific examples, edge cases, and component integration:

- **Component Testing**: Verify UI components render correctly with various props
- **Parser Testing**: Test regex parsing with known patterns and edge cases
- **Diagram Generation**: Validate diagram structure for specific regex patterns
- **Match Engine**: Test pattern matching against known input/output pairs
- **Error Handling**: Verify proper error states and recovery mechanisms

### Property-Based Testing
Property-based tests validate universal correctness properties across randomized inputs using a PBT library like fast-check. Each test runs a minimum of 100 iterations and references specific design properties:

**Configuration**: Use fast-check for property-based testing with 100+ iterations per test
**Tagging**: Each property test includes a comment: **Feature: regex-visualizer, Property {number}: {property_text}**

### Testing Tools
- **Bun Test Runner**: Primary testing framework
- **@solidjs/testing-library**: Component testing utilities
- **fast-check**: Property-based testing library
- **jsdom**: DOM environment for component tests

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Real-time Pattern Validation and Highlighting
*For any* regular expression pattern, when typed into the input field, the system should validate it immediately, apply syntax highlighting for valid patterns, and provide appropriate error feedback for invalid patterns
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Comprehensive Syntax Support
*For any* standard JavaScript regex syntax including ES2018+ features (named groups, lookbehind, unicode property escapes), the system should successfully validate and process the pattern
**Validates: Requirements 1.5**

### Property 3: Real-time Match Highlighting
*For any* regex pattern and test text combination, when either the pattern or text changes, the Match Highlighter should update the highlighting immediately to reflect the current matches
**Validates: Requirements 3.1, 3.6**

### Property 4: Capture Group Visualization
*For any* regex pattern with capture groups, when matches are found, the Match Highlighter should use distinct colors for different capture groups and display both named and numeric group information
**Validates: Requirements 3.2, 4.3, 4.4**

### Property 5: Flag Behavior Consistency
*For any* regex pattern, when flags are toggled (global, case-insensitive, multiline, dotall), the matching behavior should immediately reflect the flag settings with appropriate changes to match results
**Validates: Requirements 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 6: Match Information Completeness
*For any* successful regex match, the match details panel should display all required information including full match text, start/end positions, match index, and capture group details
**Validates: Requirements 4.1, 4.2**

### Property 7: Interactive Element Responsiveness
*For any* clickable element in the interface (matches, controls, library patterns), user interactions should trigger appropriate responses such as highlighting, loading, or state changes
**Validates: Requirements 4.5, 7.3**

### Property 8: Explanation Accuracy
*For any* regex pattern containing complex constructs (lookahead/lookbehind, quantifiers, character classes), the explanation system should provide accurate descriptions of the element behavior and matching semantics
**Validates: Requirements 6.2, 6.3, 6.4**

### Property 9: Pattern Library Functionality
*For any* pattern selected from the library, it should load correctly into the input field with its associated description and demonstrate the expected matching behavior
**Validates: Requirements 7.3, 7.4**

### Property 10: Multi-language Export Correctness
*For any* regex pattern and flag combination, when exported to different programming languages (JavaScript, Python, Java), the generated code should be syntactically correct and functionally equivalent to the original pattern
**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

### Property 11: Performance Monitoring Accuracy
*For any* regex pattern tested for performance, the system should accurately measure execution time, detect potential backtracking issues, and provide appropriate warnings or optimization suggestions
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 12: Debug Step Accuracy
*For any* regex pattern in step-by-step debug mode, each step should accurately represent the current matching state, highlight the correct positions, and provide clear indication of backtracking or final results
**Validates: Requirements 10.2, 10.3, 10.4**

### Property 13: Validation Mode Distinction
*For any* text input, the validation system should correctly distinguish between "contains match" and "full string match" modes, providing appropriate pass/fail indicators and highlighting non-matching positions when validation fails
**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

### Property 14: Replacement Operation Correctness
*For any* regex pattern with replacement string, the replacement operation should correctly substitute matches, handle capture group references, respect global/single replacement modes, and properly escape special characters
**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6**