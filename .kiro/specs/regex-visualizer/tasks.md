# Implementation Plan: Regex Tester

## Overview

This implementation plan creates a lightweight, client-side regex testing tool using SolidJS, TypeScript, and Shiki for syntax highlighting. The approach prioritizes minimal dependencies, native performance, and essential functionality over advanced editor features.

## Tasks

- [x] 1. Set up project structure and routing
  - Create regex-tester page route following solid-file-router conventions
  - Set up basic page layout with responsive design
  - Configure TypeScript interfaces for core data structures
  - _Requirements: 1.1, 1.4_

- [x] 2. Implement state management with SolidJS context and store
  - [x] 2.1 Create RegexStore with pattern, flags, testText, and UI state
    - Define store structure using createStore for reactive state
    - Include pattern validation state and error tracking
    - _Requirements: 1.1, 1.3, 4.1_

  - [ ]* 2.2 Write property test for store state consistency
    - **Property 1: State updates maintain consistency**
    - **Validates: Requirements 1.1, 4.1**

  - [x] 2.3 Create RegexContext provider with actions
    - Implement context provider in `src/contexts/regex-context.tsx`
    - Define action methods for state updates (setPattern, setFlags, etc.)
    - _Requirements: 1.1, 4.1_

- [x] 3. Build pattern input component with Shiki highlighting
  - [x] 3.1 Create PatternInput component with textarea base
    - Implement controlled textarea with real-time pattern updates
    - Add flag toggles for all JavaScript regex flags (g, i, m, s, u, y)
    - _Requirements: 1.1, 1.2, 4.1, 4.6_

  - [x] 3.2 Integrate Shiki syntax highlighting
    - Configure Shiki with github-light theme and regex grammar
    - Implement overlay highlighting that syncs with textarea content
    - Handle highlighting updates on pattern changes
    - _Requirements: 1.2_

  - [ ]* 3.3 Write property test for syntax highlighting accuracy
    - **Property 2: Syntax highlighting correctly identifies regex elements**
    - **Validates: Requirements 1.2**

  - [x] 3.4 Implement regex validation and error display
    - Add real-time pattern validation using JavaScript RegExp constructor
    - Display error messages with position indicators for invalid patterns
    - _Requirements: 1.3_

  - [x] 3.5 Write property test for validation consistency
    - **Property 3: Pattern validation matches JavaScript RegExp behavior**
    - **Validates: Requirements 1.3, 2.1**

- [ ] 4. Checkpoint - Ensure pattern input works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create testing panel with match highlighting
  - [x] 5.1 Build TestingPanel component
    - Create textarea for test text input with proper styling
    - Implement real-time match highlighting using overlay technique
    - Display "no matches" indicator when appropriate
    - _Requirements: 2.1, 2.3_

  - [x] 5.2 Implement match highlighting engine
    - Use JavaScript RegExp.exec() for finding matches with proper flag handling
    - Create highlight overlays for full matches and capture groups
    - Use distinct colors for different capture groups
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

  - [ ]* 5.3 Write property test for match highlighting accuracy
    - **Property 4: Match highlighting correctly identifies all matches**
    - **Validates: Requirements 2.1, 2.4, 2.5**

  - [x] 5.4 Add flag behavior implementation
    - Ensure global flag finds all matches vs first match only
    - Implement case-insensitive, multiline, and dotall flag behaviors
    - Update highlighting immediately when flags change
    - _Requirements: 2.4, 2.5, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.5 Write property test for flag behavior consistency
    - **Property 5: Flag changes immediately affect matching behavior**
    - **Validates: Requirements 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 6. Build match details panel
  - [x] 6.1 Create DetailsPanel component
    - Display match information in clear tabular format
    - Show full match text, start/end positions, and match index
    - List capture groups with text, positions, and names/indices
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.2 Implement interactive match selection
    - Add click handlers to highlighted matches in test text
    - Highlight corresponding match details when match is clicked
    - Ensure proper synchronization between text and details panel
    - _Requirements: 3.5_

  - [ ]* 6.3 Write property test for match information completeness
    - **Property 6: Match details contain all required information**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 7. Implement explanation system
  - [x] 7.1 Create explanation engine for regex elements
    - Build pattern analysis system to identify regex constructs
    - Generate human-readable explanations for quantifiers, groups, assertions
    - Provide detailed explanations for complex constructs and lookarounds
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.2 Add help panel with syntax reference
    - Create collapsible help section with common regex syntax
    - Include examples and explanations for standard regex elements
    - _Requirements: 5.5_

  - [ ]* 7.3 Write property test for explanation accuracy
    - **Property 7: Explanations accurately describe regex element behavior**
    - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 8. Create pattern library
  - [x] 8.1 Build pattern library data structure
    - Define categorized common patterns (email, phone, dates, etc.)
    - Include pattern descriptions and example matches for each
    - Ensure minimum 15 patterns across different categories
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 8.2 Implement pattern selection interface
    - Create organized display of categorized patterns
    - Add pattern loading functionality to input field
    - Display pattern descriptions when patterns are loaded
    - _Requirements: 6.3, 6.4_

  - [ ]* 8.3 Write property test for pattern library functionality
    - **Property 8: Pattern library patterns load correctly and demonstrate expected behavior**
    - **Validates: Requirements 6.3, 6.4**

- [x] 9. Build export dialog
  - [x] 9.1 Create ExportDialog modal component
    - Build modal dialog using Kobalte Dialog primitive
    - Add language selection for JavaScript, Python, and Java
    - Include options for variable naming and comment inclusion
    - _Requirements: 7.1, 7.6_

  - [x] 9.2 Implement code generation for supported languages
    - Generate proper JavaScript RegExp syntax with flags
    - Create Python re.compile() syntax with appropriate flags
    - Build Java Pattern.compile() syntax
    - Ensure flag inclusion in exported code for each language
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [ ]* 9.3 Write property test for export correctness
    - **Property 9: Exported code is syntactically correct and functionally equivalent**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

- [x] 10. Add performance monitoring
  - [x] 10.1 Implement execution time measurement
    - Measure regex execution time for performance analysis
    - Display performance metrics when performance testing is enabled
    - _Requirements: 8.1, 8.5_

  - [x] 10.2 Add backtracking detection and warnings
    - Detect potentially catastrophic backtracking patterns
    - Provide timeout protection for long-running patterns
    - Suggest optimization strategies for problematic patterns
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ]* 10.3 Write property test for performance monitoring accuracy
    - **Property 10: Performance monitoring accurately measures execution time**
    - **Validates: Requirements 8.1, 8.5**

- [x] 11. Implement step-by-step debugging
  - [x] 11.1 Create debug mode interface
    - Add step-by-step mode controls (play, pause, step forward/backward, reset)
    - Implement debug state tracking and visualization
    - _Requirements: 9.1, 9.5_

  - [x] 11.2 Build step execution engine
    - Highlight current position in both pattern and text during stepping
    - Visually indicate backtracking events with explanations
    - Show clear final result indication (success/failure)
    - _Requirements: 9.2, 9.3, 9.4_

  - [ ]* 11.3 Write property test for debug step accuracy
    - **Property 11: Debug steps accurately represent matching state**
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [x] 12. Add validation and replacement features
  - [x] 12.1 Implement validation modes
    - Add "contains match" vs "full string match" validation modes
    - Provide clear pass/fail indicators for validation results
    - Highlight non-matching positions when validation fails
    - Handle anchor behavior properly in validation context
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 12.2 Build replacement functionality
    - Create replacement pattern input and preview
    - Handle capture group references in replacement strings
    - Support both global and single replacement modes
    - Properly escape special characters in replacement patterns
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 12.3 Write property test for validation and replacement correctness
    - **Property 12: Validation modes correctly distinguish match types**
    - **Validates: Requirements 10.1, 10.4, 10.5**

  - [ ]* 12.4 Write property test for replacement operation correctness
    - **Property 13: Replacement operations correctly substitute matches**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [x] 13. Final integration and polish
  - [x] 13.1 Wire all components together
    - Connect all components through RegexContext
    - Ensure proper state synchronization across all panels
    - Add proper error boundaries and loading states
    - _Requirements: All requirements_

  - [x] 13.2 Add accessibility and keyboard navigation
    - Implement proper ARIA labels and keyboard navigation
    - Ensure screen reader compatibility for all interactive elements
    - Add focus management for modal dialogs and complex interactions
    - _Requirements: All requirements_

  - [ ]* 13.3 Write integration tests
    - Test end-to-end workflows from pattern input to results
    - Verify proper state management across component boundaries
    - _Requirements: All requirements_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation prioritizes lightweight architecture and essential functionality