import type { RegexContextValue, RegexFlags, RegexStore, ValidationMode } from '#/utils/regex/types'
import type { ParentProps } from 'solid-js'

import { findMatches, flagsToString, replaceMatches, validatePattern, validateText } from '#/utils/regex/match-engine'
import { findMatchesWithPerformance } from '#/utils/regex/performance-analyzer'
import { createContext, untrack, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'

// Create context for regex state management
const RegexContext = createContext<RegexContextValue>()

export function useRegexContext() {
  const context = useContext(RegexContext)
  if (!context) {
    throw new Error('useRegexContext must be used within RegexProvider')
  }
  return context
}

// Provider component for regex state
export function RegexProvider(props: ParentProps) {
  const [store, setStore] = createStore<RegexStore>({
    pattern: '',
    flags: {
      global: false,
      ignoreCase: false,
      multiline: false,
      dotAll: false,
      unicode: false,
      sticky: false,
    },
    testText: '',
    isValid: true,
    matches: [],
    selectedMatchIndex: null,
    showExportDialog: false,
    selectedExportLanguage: 'javascript',
    performanceEnabled: false,
    performanceResult: undefined,
    // Validation state
    validationMode: 'contains',
    validationResult: undefined,
    // Replacement state
    replacementPattern: '',
    replacementResult: undefined,
    showReplacementPreview: false,
  })

  // Helper function to update matches based on current pattern and flags
  const updateMatches = (pattern: string, flags: RegexFlags, text: string) => {
    const performanceEnabled = untrack(() => store.performanceEnabled)

    if (performanceEnabled) {
      const { matches, performance } = findMatchesWithPerformance(pattern, flags, text)
      setStore('matches', matches)
      setStore('performanceResult', performance)
    } else {
      const matches = findMatches(pattern, flags, text)
      setStore('matches', matches)
      setStore('performanceResult', undefined)
    }
  }

  // Helper function to update validation result
  const updateValidation = (pattern: string, flags: RegexFlags, text: string, mode: ValidationMode) => {
    if (!pattern || !text) {
      setStore('validationResult', undefined)
      return
    }
    const result = validateText(pattern, flags, text, mode)
    setStore('validationResult', result)
  }

  // Helper function to update replacement result
  const updateReplacement = (pattern: string, flags: RegexFlags, text: string, replacement: string) => {
    if (!pattern || !text) {
      setStore('replacementResult', undefined)
      return
    }
    const result = replaceMatches(pattern, flags, text, replacement)
    setStore('replacementResult', result)
  }

  const actions = {
    setPattern: (pattern: string) => {
      setStore('pattern', pattern)

      if (pattern === '') {
        setStore('isValid', true)
        setStore('parseError', undefined)
        setStore('matches', [])
        setStore('validationResult', undefined)
        setStore('replacementResult', undefined)
        return
      }

      // Validate pattern using match engine
      const currentFlags = untrack(() => store.flags)
      const validation = validatePattern(pattern, currentFlags)

      if (validation.isValid) {
        setStore('isValid', true)
        setStore('parseError', undefined)

        // Re-run matching if test text exists
        untrack(() => {
          if (store.testText) {
            updateMatches(pattern, store.flags, store.testText)
            updateValidation(pattern, store.flags, store.testText, store.validationMode)
            if (store.showReplacementPreview) {
              updateReplacement(pattern, store.flags, store.testText, store.replacementPattern)
            }
          }
        })
      } else {
        setStore('isValid', false)
        setStore('parseError', validation.error)
        setStore('matches', [])
        setStore('selectedMatchIndex', null)
        setStore('validationResult', undefined)
        setStore('replacementResult', undefined)
      }
    },

    setFlags: (flags: Partial<RegexFlags>) => {
      const newFlags = { ...untrack(() => store.flags), ...flags }
      setStore('flags', newFlags)

      // Re-validate pattern with new flags if pattern exists
      untrack(() => {
        if (store.pattern) {
          const validation = validatePattern(store.pattern, newFlags)

          if (validation.isValid) {
            setStore('isValid', true)
            setStore('parseError', undefined)

            // Re-run matching if test text exists
            if (store.testText) {
              updateMatches(store.pattern, newFlags, store.testText)
              updateValidation(store.pattern, newFlags, store.testText, store.validationMode)
              if (store.showReplacementPreview) {
                updateReplacement(store.pattern, newFlags, store.testText, store.replacementPattern)
              }
            }
          } else {
            setStore('isValid', false)
            setStore('parseError', validation.error)
            setStore('matches', [])
            setStore('selectedMatchIndex', null)
            setStore('validationResult', undefined)
            setStore('replacementResult', undefined)
          }
        }
      })
    },

    setTestText: (text: string) => {
      setStore('testText', text)
      setStore('selectedMatchIndex', null)

      // Re-run matching if pattern is valid
      untrack(() => {
        if (store.pattern && store.isValid) {
          updateMatches(store.pattern, store.flags, text)
          updateValidation(store.pattern, store.flags, text, store.validationMode)
          if (store.showReplacementPreview) {
            updateReplacement(store.pattern, store.flags, text, store.replacementPattern)
          }
        } else {
          setStore('matches', [])
          setStore('validationResult', undefined)
          setStore('replacementResult', undefined)
        }
      })
    },

    setSelectedMatchIndex: (index: number | null) => {
      setStore('selectedMatchIndex', index)
    },

    toggleExportDialog: (show: boolean) => {
      setStore('showExportDialog', show)
    },

    setExportLanguage: (language: 'javascript' | 'python' | 'java') => {
      setStore('selectedExportLanguage', language)
    },

    exportCode: () => {
      const pattern = untrack(() => store.pattern)
      const flags = untrack(() => store.flags)
      const selectedExportLanguage = untrack(() => store.selectedExportLanguage)

      if (!pattern) {
        return '// No pattern to export'
      }

      const flagString = flagsToString(flags)

      switch (selectedExportLanguage) {
        case 'javascript':
          if (flagString) {
            return `const regex = new RegExp('${pattern.replace(/'/g, '\\\'')}', '${flagString}');`
          }
          return `const regex = /${pattern.replace(/\//g, '\\/')}/;`

        case 'python': {
          const pythonFlags = flagString
            .split('')
            .map((flag) => {
              switch (flag) {
                case 'g': return '' // Python doesn't have global flag
                case 'i': return 're.IGNORECASE'
                case 'm': return 're.MULTILINE'
                case 's': return 're.DOTALL'
                case 'u': return 're.UNICODE'
                case 'y': return '' // Python doesn't have sticky flag
                default: return ''
              }
            })
            .filter(Boolean)
            .join(' | ')

          if (pythonFlags) {
            return `import re\npattern = re.compile(r'${pattern}', ${pythonFlags})`
          }
          return `import re\npattern = re.compile(r'${pattern}')`
        }

        case 'java': {
          const javaFlags = flagString
            .split('')
            .map((flag) => {
              switch (flag) {
                case 'i': return 'Pattern.CASE_INSENSITIVE'
                case 'm': return 'Pattern.MULTILINE'
                case 's': return 'Pattern.DOTALL'
                case 'u': return 'Pattern.UNICODE_CASE'
                default: return ''
              }
            })
            .filter(Boolean)
            .join(' | ')

          if (javaFlags) {
            return `import java.util.regex.Pattern;\nPattern pattern = Pattern.compile("${pattern.replace(/"/g, '\\"')}", ${javaFlags});`
          }
          return `import java.util.regex.Pattern;\nPattern pattern = Pattern.compile("${pattern.replace(/"/g, '\\"')}");`
        }

        default:
          return '// Unsupported language'
      }
    },

    togglePerformanceMode: (enabled: boolean) => {
      setStore('performanceEnabled', enabled)

      // Re-run matching with performance analysis if enabled
      untrack(() => {
        if (store.pattern && store.isValid && store.testText) {
          updateMatches(store.pattern, store.flags, store.testText)
        } else {
          setStore('performanceResult', undefined)
        }
      })
    },

    // Validation actions
    setValidationMode: (mode: ValidationMode) => {
      setStore('validationMode', mode)

      // Re-run validation with new mode
      untrack(() => {
        if (store.pattern && store.isValid && store.testText) {
          updateValidation(store.pattern, store.flags, store.testText, mode)
        }
      })
    },

    // Replacement actions
    setReplacementPattern: (replacement: string) => {
      setStore('replacementPattern', replacement)

      // Update replacement result if preview is enabled
      untrack(() => {
        if (store.showReplacementPreview && store.pattern && store.isValid && store.testText) {
          updateReplacement(store.pattern, store.flags, store.testText, replacement)
        }
      })
    },

    toggleReplacementPreview: (show: boolean) => {
      setStore('showReplacementPreview', show)

      // Calculate replacement result when enabling preview
      untrack(() => {
        if (show && store.pattern && store.isValid && store.testText) {
          updateReplacement(store.pattern, store.flags, store.testText, store.replacementPattern)
        } else if (!show) {
          setStore('replacementResult', undefined)
        }
      })
    },

    applyReplacement: () => {
      const result = untrack(() => store.replacementResult)
      if (result) {
        return result.result
      }
      return untrack(() => store.testText)
    },
  }

  const contextValue: RegexContextValue = {
    store,
    actions,
  }

  return (
    <RegexContext.Provider value={contextValue}>
      {props.children}
    </RegexContext.Provider>
  )
}
