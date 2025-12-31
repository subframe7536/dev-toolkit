// Core data structures for regex tester functionality
// Based on design document specifications

export interface RegexFlags {
  global: boolean
  ignoreCase: boolean
  multiline: boolean
  dotAll: boolean
  unicode: boolean
  sticky: boolean
}

export interface ParseError {
  message: string
  position: number
  length: number
}

export interface CaptureGroup {
  index: number
  name?: string
  value: string
  start: number
  end: number
}

export interface MatchResult {
  index: number
  fullMatch: string
  groups: CaptureGroup[]
  start: number
  end: number
}

export type ValidationMode = 'contains' | 'fullMatch'

export interface ValidationResult {
  isValid: boolean
  error?: ParseError
}

export interface TextValidationResult {
  passed: boolean
  mode: ValidationMode
  failPosition?: number
  failLength?: number
  message: string
}

export interface ReplacementResult {
  result: string
  replacementCount: number
}

export interface RegexStore {
  pattern: string
  flags: RegexFlags
  testText: string
  isValid: boolean
  parseError?: ParseError
  matches: MatchResult[]
  selectedMatchIndex: number | null
  showExportDialog: boolean
  selectedExportLanguage: 'javascript' | 'python' | 'java'
  // Performance monitoring state
  performanceEnabled: boolean
  performanceResult?: PerformanceResult
  // Validation state
  validationMode: ValidationMode
  validationResult?: TextValidationResult
  // Replacement state
  replacementPattern: string
  replacementResult?: ReplacementResult
  showReplacementPreview: boolean
}

export interface RegexContextValue {
  store: RegexStore
  actions: {
    setPattern: (pattern: string) => void
    setFlags: (flags: Partial<RegexFlags>) => void
    setTestText: (text: string) => void
    setSelectedMatchIndex: (index: number | null) => void
    toggleExportDialog: (show: boolean) => void
    setExportLanguage: (language: 'javascript' | 'python' | 'java') => void
    exportCode: () => string
    togglePerformanceMode: (enabled: boolean) => void
    // Validation actions
    setValidationMode: (mode: ValidationMode) => void
    // Replacement actions
    setReplacementPattern: (pattern: string) => void
    toggleReplacementPreview: (show: boolean) => void
    applyReplacement: () => string
  }
}

// Component prop interfaces
export interface TestingPanelProps {
  pattern: string
  flags: RegexFlags
  testText: string
  onTestTextChange: (text: string) => void
  matches: MatchResult[]
}

export interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  pattern: string
  flags: RegexFlags
}

export interface ExportConfig {
  language: 'javascript' | 'python' | 'java'
  includeFlags: boolean
  includeComments: boolean
  variableName?: string
}

// Business logic interfaces
export interface ValidationResult {
  isValid: boolean
  error?: ParseError
}

export interface RegexParser {
  validate: (pattern: string) => ValidationResult
  getExplanation: (pattern: string) => ExplanationResult
}

export interface ExplanationResult {
  elements: RegexElement[]
  description: string
}

export interface RegexElement {
  type: string
  value: string
  description: string
  position: { start: number, end: number }
}

export interface MatchEngine {
  findMatches: (pattern: string, flags: RegexFlags, text: string) => MatchResult[]
  validateInput: (pattern: string, text: string) => ValidationResult
  analyzePerformance: (pattern: string, text: string) => PerformanceResult
}

export interface PerformanceResult {
  executionTime: number
  steps: number
  backtrackingDetected: boolean
  warnings: PerformanceWarning[]
}

export interface PerformanceWarning {
  type: 'backtracking' | 'timeout' | 'complexity'
  message: string
  suggestion?: string
}

// Pattern library interfaces
export interface PatternCategory {
  id: string
  name: string
  description: string
  patterns: PatternDefinition[]
}

export interface PatternDefinition {
  id: string
  name: string
  pattern: string
  flags: RegexFlags
  description: string
  examples: PatternExample[]
  tags: string[]
}

export interface PatternExample {
  input: string
  shouldMatch: boolean
  description: string
}

// Debug interfaces
export interface DebugStep {
  stepNumber: number
  patternPosition: number
  textPosition: number
  action: 'match' | 'backtrack' | 'advance' | 'fail' | 'success' | 'start'
  description: string
  patternElement: string
  matchedText?: string
  isBacktrack: boolean
}

export interface DebugSession {
  steps: DebugStep[]
  currentStepIndex: number
  isPlaying: boolean
  playSpeed: number
  finalResult: 'success' | 'failure' | 'pending'
  matchStart?: number
  matchEnd?: number
}

export interface DebugState {
  inputPosition: number
  captureGroups: { [key: number]: string }
  backtrackStack: BacktrackPoint[]
}

export interface ASTNode {
  type: string
  value: string
  children?: ASTNode[]
}

export interface BacktrackPoint {
  position: number
  state: unknown
}
