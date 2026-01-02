import type { MatchResult } from '#/utils/regex/types'
import type { HighlighterCore } from 'shiki'

import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { TextField, TextFieldInput, TextFieldLabel } from '#/components/ui/text-field'
import { useRegexContext } from '#/contexts/regex-context'
import { createMemo, createResource, createUniqueId, For, Show, Suspense } from 'solid-js'

const FLAG_OPTIONS = [
  { flag: 'g', label: 'Global', key: 'global', description: 'Find all matches instead of stopping after the first match' },
  { flag: 'i', label: 'Ignore case', key: 'ignoreCase', description: 'Case-insensitive matching' },
  { flag: 'm', label: 'Multiline', key: 'multiline', description: 'Treat ^ and $ as line boundaries' },
  { flag: 's', label: 'Dot all', key: 'dotAll', description: 'Allow . to match newline characters' },
  { flag: 'u', label: 'Unicode', key: 'unicode', description: 'Enable full Unicode support' },
  { flag: 'y', label: 'Sticky', key: 'sticky', description: 'Match only at the current position' },
] as const

// Color palette for capture groups - distinct, accessible colors
const CAPTURE_GROUP_COLORS = [
  'bg-blue-200/70 dark:bg-blue-800/50',
  'bg-green-200/70 dark:bg-green-800/50',
  'bg-purple-200/70 dark:bg-purple-800/50',
  'bg-orange-200/70 dark:bg-orange-800/50',
  'bg-pink-200/70 dark:bg-pink-800/50',
  'bg-cyan-200/70 dark:bg-cyan-800/50',
  'bg-yellow-200/70 dark:bg-yellow-800/50',
  'bg-red-200/70 dark:bg-red-800/50',
] as const

// Full match highlight color
const FULL_MATCH_COLOR = 'bg-amber-300/60 dark:bg-amber-600/40'
const FULL_MATCH_SELECTED_COLOR = 'bg-amber-400/80 dark:bg-amber-500/60 ring-2 ring-primary'

interface HighlightSegment {
  start: number
  end: number
  text: string
  type: 'match' | 'group' | 'text'
  matchIndex?: number
  groupIndex?: number
}

async function loadHighlighter(): Promise<HighlighterCore> {
  const { createHighlighter } = await import('shiki')
  return createHighlighter({
    themes: ['github-light'],
    langs: ['regexp'],
  })
}

function HighlightedPattern(props: { pattern: string, highlighter: HighlighterCore }) {
  const html = createMemo(() => {
    if (!props.pattern) {
      return undefined
    }
    try {
      return props.highlighter.codeToHtml(props.pattern, {
        lang: 'regexp',
        theme: 'github-light',
      })
    } catch {
      return undefined
    }
  })

  return (
    <Show when={html()}>
      {/* eslint-disable-next-line solid/no-innerhtml */}
      <div innerHTML={html()} class="[&_pre]:(m-0 p-0) [&_code]:(bg-transparent!)" aria-hidden="true" />
    </Show>
  )
}

/**
 * Build highlight segments from matches
 * Handles overlapping capture groups by prioritizing full matches
 */
function buildHighlightSegments(text: string, matches: MatchResult[]): HighlightSegment[] {
  if (!text || matches.length === 0) {
    return [{ start: 0, end: text.length, text, type: 'text' }]
  }

  // Collect all highlight ranges
  const ranges: Array<{
    start: number
    end: number
    type: 'match' | 'group'
    matchIndex: number
    groupIndex?: number
  }> = []

  for (const match of matches) {
    // Add full match range
    ranges.push({
      start: match.start,
      end: match.end,
      type: 'match',
      matchIndex: match.index,
    })

    // Add capture group ranges (they may overlap with full match)
    for (const group of match.groups) {
      if (group.value && group.start >= 0 && group.end > group.start) {
        ranges.push({
          start: group.start,
          end: group.end,
          type: 'group',
          matchIndex: match.index,
          groupIndex: group.index,
        })
      }
    }
  }

  // Sort ranges by start position
  ranges.sort((a, b) => a.start - b.start || a.end - b.end)

  // Build segments
  const segments: HighlightSegment[] = []
  let currentPos = 0

  for (const range of ranges) {
    // Skip if this range is before current position (already processed)
    if (range.end <= currentPos) {
      continue
    }

    // Add text segment before this range
    if (range.start > currentPos) {
      segments.push({
        start: currentPos,
        end: range.start,
        text: text.slice(currentPos, range.start),
        type: 'text',
      })
    }

    // Adjust start if we've already processed part of this range
    const effectiveStart = Math.max(range.start, currentPos)

    // Add highlighted segment
    segments.push({
      start: effectiveStart,
      end: range.end,
      text: text.slice(effectiveStart, range.end),
      type: range.type,
      matchIndex: range.matchIndex,
      groupIndex: range.groupIndex,
    })

    currentPos = range.end
  }

  // Add remaining text
  if (currentPos < text.length) {
    segments.push({
      start: currentPos,
      end: text.length,
      text: text.slice(currentPos),
      type: 'text',
    })
  }

  return segments
}

/**
 * Get CSS class for a highlight segment
 */
function getSegmentClass(segment: HighlightSegment, selectedMatchIndex: number | null): string {
  if (segment.type === 'text') {
    return ''
  }
  if (segment.type === 'group' && segment.groupIndex !== undefined) {
    return CAPTURE_GROUP_COLORS[segment.groupIndex % CAPTURE_GROUP_COLORS.length]
  }
  // Full match - check if selected
  if (segment.matchIndex !== undefined && segment.matchIndex === selectedMatchIndex) {
    return FULL_MATCH_SELECTED_COLOR
  }
  return FULL_MATCH_COLOR
}

export function RegexInputPanel() {
  const { store, actions } = useRegexContext()
  let patternTextareaRef!: HTMLTextAreaElement
  let patternHighlightRef!: HTMLDivElement
  let testTextareaRef!: HTMLTextAreaElement
  let testHighlightRef!: HTMLDivElement

  const [highlighter] = createResource(loadHighlighter)
  const errorId = createUniqueId()

  // Get selected flags as array for multi-select
  const selectedFlags = createMemo(() => {
    return FLAG_OPTIONS.filter(option => store.flags[option.key]).map(option => option.flag)
  })

  // Handle flag selection change
  const handleFlagsChange = (flags: string[]) => {
    // Create new flags object based on selected flags
    const newFlags = FLAG_OPTIONS.reduce((acc, option) => {
      acc[option.key] = flags.includes(option.flag)
      return acc
    }, {} as Record<string, boolean>)

    actions.setFlags(newFlags)
  }

  // Calculate execution time and match status
  const executionTime = createMemo(() => {
    if (store.performanceResult) {
      const ms = store.performanceResult.executionTime
      if (ms < 1) {
        return `${(ms * 1000).toFixed(0)}μs`
      }
      if (ms < 1000) {
        return `${ms.toFixed(2)}ms`
      }
      return `${(ms / 1000).toFixed(2)}s`
    }
    return null
  })

  // Build highlight segments reactively
  const segments = createMemo(() =>
    buildHighlightSegments(store.testText, store.matches),
  )

  // Check if there are any matches
  const hasMatches = createMemo(() => store.matches.length > 0)
  const hasInput = createMemo(() => store.pattern && store.testText)

  // Replacement functionality
  const replacementResult = createMemo(() => store.replacementResult)

  const handleCopyResult = async () => {
    const result = replacementResult()
    if (result) {
      await navigator.clipboard.writeText(result.result)
    }
  }

  const handleApplyToTestText = () => {
    const result = actions.applyReplacement()
    actions.setTestText(result)
  }

  const handlePatternScroll = () => {
    if (patternTextareaRef && patternHighlightRef) {
      patternHighlightRef.scrollTop = patternTextareaRef.scrollTop
      patternHighlightRef.scrollLeft = patternTextareaRef.scrollLeft
    }
  }

  const handlePatternInput = (e: Event) => {
    const target = e.currentTarget as HTMLTextAreaElement
    actions.setPattern(target.value)

    // Auto-resize textarea to fit content
    target.style.height = 'auto'
    target.style.height = `${Math.max(40, target.scrollHeight)}px`

    // Sync highlight layer height with textarea
    if (patternHighlightRef) {
      patternHighlightRef.style.height = `${target.offsetHeight}px`
    }
  }

  const handleTestScroll = () => {
    if (testTextareaRef && testHighlightRef) {
      testHighlightRef.scrollTop = testTextareaRef.scrollTop
      testHighlightRef.scrollLeft = testTextareaRef.scrollLeft
    }
  }

  // Handle click on highlighted match
  const handleHighlightClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const matchIndexAttr = target.getAttribute('data-match-index')
    if (matchIndexAttr !== null) {
      const matchIndex = Number.parseInt(matchIndexAttr, 10)
      if (!Number.isNaN(matchIndex)) {
        // Toggle selection: if already selected, deselect; otherwise select
        if (store.selectedMatchIndex === matchIndex) {
          actions.setSelectedMatchIndex(null)
        } else {
          actions.setSelectedMatchIndex(matchIndex)
        }
      }
    }
  }

  // Status message for screen readers
  const statusMessage = createMemo(() => {
    if (!hasInput()) {
      return 'Enter a pattern and test text to see matches'
    }
    if (!store.isValid) {
      return 'Invalid pattern'
    }
    if (!hasMatches()) {
      return 'No matches found'
    }
    return `${store.matches.length} match${store.matches.length !== 1 ? 'es' : ''} found`
  })

  return (
    <div class="space-y-6">
      {/* Header with title only */}
      <div class="flex items-center justify-between">
        <h2 class="text-sm text-muted-foreground tracking-wide font-medium uppercase">
          Regular Expression
        </h2>
      </div>

      {/* Pattern Input Section - Inline regex format */}
      <div class="relative">
        {/* Container with border and rounded corners */}
        <div class="border rounded-md bg-input transition-all focus-within:(ring-2 ring-ring)">
          <div class="flex items-start">
            {/* Opening slash */}
            <div class="text-lg text-muted-foreground font-mono px-3 py-2 flex-shrink-0 select-none">/</div>

            {/* Pattern input area */}
            <div class="flex-1 min-h-10 relative">
              {/* Textarea input */}
              <textarea
                ref={patternTextareaRef}
                placeholder="pattern"
                class="text-sm leading-relaxed font-mono py-2 pr-0 border-none min-h-10 w-full resize-none relative z-20 placeholder:text-muted-foreground/60 focus:outline-none"
                style={{
                  'color': store.pattern ? 'transparent' : undefined,
                  'caret-color': 'var(--colors-foreground)',
                }}
                value={store.pattern}
                onInput={handlePatternInput}
                onScroll={handlePatternScroll}
                aria-label="Regular expression pattern"
                aria-describedby={store.parseError ? errorId : undefined}
                aria-invalid={!store.isValid}
              />

              {/* Syntax highlighting overlay - positioned to match textarea exactly */}
              <div
                ref={patternHighlightRef}
                class="overflow-wrap-break-word text-sm leading-relaxed font-mono py-2 pr-0 pointer-events-none whitespace-pre-wrap inset-0 absolute z-10 overflow-hidden"
                aria-hidden="true"
              >
                <Suspense>
                  <Show when={highlighter()}>
                    {hl => <HighlightedPattern pattern={store.pattern} highlighter={hl()} />}
                  </Show>
                </Suspense>
              </div>
            </div>

            {/* Closing slash and flags selector - merged */}
            <div class="flex flex-shrink-0 items-center">
              <div class="text-lg text-muted-foreground font-mono px-1 py-2 select-none">/</div>
              <div class="min-w-12">
                <Select<string>
                  multiple
                  value={selectedFlags()}
                  onChange={handleFlagsChange}
                  options={FLAG_OPTIONS.map(option => option.flag)}
                  placeholder=""
                  class="!bg-transparent"
                  itemComponent={props => (
                    <SelectItem item={props.item}>
                      <div class="py-1 flex flex-col gap-1">
                        <div class="flex gap-2 items-center">
                          <code class="text-sm text-primary font-mono font-semibold">{props.item.rawValue}</code>
                          <span class="text-sm font-medium">
                            {FLAG_OPTIONS.find(opt => opt.flag === props.item.rawValue)?.label}
                          </span>
                        </div>
                        <div class="text-xs text-muted-foreground leading-relaxed">
                          {FLAG_OPTIONS.find(opt => opt.flag === props.item.rawValue)?.description}
                        </div>
                      </div>
                    </SelectItem>
                  )}
                >
                  <SelectTrigger noIcon class="text-xs p-1 border-none bg-transparent h-8 min-w-12 shadow-none transition-colors hover:bg-muted/50">
                    <SelectValue<string[]>>
                      {state => (
                        <div class="flex flex-wrap gap-0.5">
                          <Show
                            when={state.selectedOptions().length > 0}
                            fallback={<span class="text-xs text-muted-foreground/60 font-mono">flags</span>}
                          >
                            <For each={state.selectedOptions()}>
                              {flag => (
                                <span class="text-xs text-primary font-medium font-mono">
                                  {flag}
                                </span>
                              )}
                            </For>
                          </Show>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent class="min-w-80" />
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        <Show when={store.parseError}>
          {error => (
            <div
              id={errorId}
              class="text-sm text-red-600 mt-2 flex gap-2 items-start"
              role="alert"
              aria-live="polite"
            >
              <Icon name="lucide:alert-circle" class="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <div class="font-medium">Syntax Error</div>
                <div>{error().message}</div>
                <Show when={error().position !== undefined}>
                  <div class="text-xs text-red-500 mt-1">
                    Position: {error().position}
                  </div>
                </Show>
              </div>
            </div>
          )}
        </Show>
      </div>

      {/* Test String Section */}
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label id="test-text-label" class="text-sm text-muted-foreground tracking-wide font-medium uppercase">Test String</label>
          <div class="text-xs text-muted-foreground flex gap-2 items-center">
            <Show when={executionTime()}>
              <span>({executionTime()})</span>
            </Show>
            <Show when={hasInput()}>
              <div aria-live="polite">
                <Show
                  when={hasMatches()}
                  fallback={<span class="text-amber-600 dark:text-amber-400">No matches</span>}
                >
                  <span class="text-green-600 dark:text-green-400">
                    {store.matches.length} match{store.matches.length !== 1 ? 'es' : ''}
                  </span>
                </Show>
              </div>
            </Show>
          </div>
        </div>

        <div class="bg-input relative">
          {/* Highlight overlay - hidden from screen readers */}
          <div
            ref={testHighlightRef}
            class="text-sm leading-relaxed font-mono p-(2 3) border border-transparent rounded-md whitespace-pre-wrap break-words inset-0 absolute z-1 overflow-hidden"
            onClick={handleHighlightClick}
            aria-hidden="true"
          >
            <For each={segments()}>
              {segment => (
                <span
                  class={`${getSegmentClass(segment, store.selectedMatchIndex)}  ${
                    segment.type === 'match' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                  }`}
                  data-match-index={segment.matchIndex}
                  data-group-index={segment.groupIndex}
                >
                  {segment.text}
                </span>
              )}
            </For>
          </div>

          {/* Textarea input */}
          <textarea
            ref={testTextareaRef}
            placeholder="Enter text to test your regex against..."
            class="text-sm leading-relaxed font-mono p-(2 3) border rounded-md h-64 w-full resize-y relative z-10 focus:(outline-none ring-2 ring-ring)"
            style={{
              'background': store.testText ? 'transparent' : undefined,
              'color': store.testText ? 'transparent' : undefined,
              'caret-color': 'var(--foreground)',
            }}
            value={store.testText}
            onInput={e => actions.setTestText(e.currentTarget.value)}
            onScroll={handleTestScroll}
            aria-label="Test text input"
            aria-labelledby="test-text-label"
            aria-describedby="test-text-hint"
          />

          {/* Screen reader status */}
          <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {statusMessage()}
          </div>
        </div>

        {/* Hint for clickable matches */}
        <Show when={hasMatches()}>
          <div id="test-text-hint" class="text-xs text-muted-foreground">
            <Icon name="lucide:mouse-pointer-click" class="mr-1 size-3 inline-block" aria-hidden="true" />
            Click on highlighted matches to view details.
          </div>
        </Show>

        {/* No matches indicator when pattern and text exist but no matches */}
        <Show when={hasInput() && !hasMatches() && store.isValid}>
          <div
            class="text-sm text-amber-600 p-2 border border-amber-200 rounded-md bg-amber-50 flex gap-2 items-center dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30"
            role="status"
          >
            <span class="i-lucide-info size-4" aria-hidden="true" />
            <span>No matches found. Try adjusting your pattern or test text.</span>
          </div>
        </Show>
      </div>

      {/* Replacement Section */}
      <div class="pt-6 border-t border-border space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm text-muted-foreground tracking-wide font-medium uppercase">
            Find & Replace
          </h3>
        </div>

        {/* Replacement Pattern Input */}
        <TextField value={store.replacementPattern} onChange={t => actions.setReplacementPattern(t)}>
          <TextFieldLabel>Replacement Pattern</TextFieldLabel>
          <TextFieldInput placeholder="Enter replacement (e.g., $1-$2 or $<name>)" />
        </TextField>

        {/* Replacement Syntax Help */}
        <div class="text-xs text-muted-foreground space-y-1">
          <div class="font-medium mb-1">Replacement syntax:</div>
          <div class="gap-x-4 gap-y-1 grid grid-cols-2">
            <span><code class="px-1 rounded bg-muted">$1, $2</code> - Capture groups</span>
            <span><code class="px-1 rounded bg-muted">&amp;</code> - Full match</span>
            <span><code class="px-1 rounded bg-muted">&lt;name&gt;</code> - Named group</span>
            <span><code class="px-1 rounded bg-muted">$$</code> - Literal $</span>
          </div>
        </div>

        {/* Replacement Result Preview */}
        <Show when={hasInput() && store.showReplacementPreview}>
          <Show
            when={hasMatches()}
            fallback={(
              <div
                class="text-sm text-amber-600 p-3 border border-amber-200 rounded-md bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30"
                role="status"
              >
                <Icon name="lucide:info" class="mr-2 size-4 inline-block" aria-hidden="true" />
                No matches to replace
              </div>
            )}
          >
            <div class="space-y-3">
              {/* Stats */}
              <Show when={replacementResult()}>
                {result => (
                  <div class="text-xs text-muted-foreground flex gap-2 items-center" aria-live="polite">
                    <Icon name="lucide:repeat" class="size-3" aria-hidden="true" />
                    {result().replacementCount}
                    {' '}
                    replacement
                    {result().replacementCount !== 1 ? 's' : ''}
                    {store.flags.global ? ' (global)' : ' (first match only)'}
                  </div>
                )}
              </Show>

              {/* Preview Output */}
              <div class="space-y-2">
                <label class="text-xs text-muted-foreground">Result Preview</label>
                <div class="relative">
                  <pre
                    class="text-sm font-mono p-3 border rounded-md bg-muted/50 max-h-48 whitespace-pre-wrap break-words overflow-auto"
                    tabIndex={0}
                  >
                    {replacementResult()?.result || store.testText}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div class="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyResult}
                  disabled={!replacementResult()}
                  aria-label="Copy replacement result to clipboard"
                >
                  <Icon name="lucide:copy" class="mr-1 size-4" aria-hidden="true" />
                  Copy Result
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApplyToTestText}
                  disabled={!replacementResult() || replacementResult()?.replacementCount === 0}
                  aria-label="Apply replacement to test text"
                >
                  <Icon name="lucide:check" class="mr-1 size-4" aria-hidden="true" />
                  Apply to Test Text
                </Button>
              </div>
            </div>
          </Show>
        </Show>

        <Show when={!hasInput() || !store.replacementPattern}>
          <div class="text-sm text-muted-foreground py-4 text-center">
            Enter a pattern and test text to see replacements
          </div>
        </Show>
      </div>
    </div>
  )
}
