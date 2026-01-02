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
