import type { MatchResult } from '#/utils/regex/types'
import type { HighlighterCore } from 'shiki'

import Icon from '#/components/ui/icon'
import { SimpleSelect } from '#/components/ui/select'
import { TextField, TextFieldLabel, TextFieldTextArea } from '#/components/ui/text-field'
import { useRegexContext } from '#/contexts/regex-context'
import { useColorMode } from '@solid-hooks/core/web'
import { createEffect, createMemo, createResource, createUniqueId, For, on, Show, Suspense } from 'solid-js'

const FLAG_OPTIONS = [
  { flag: 'g', label: 'Global', key: 'global', description: 'Find all matches' },
  { flag: 'i', label: 'Case Insensitive', key: 'ignoreCase', description: 'Ignore case' },
  { flag: 'm', label: 'Multiline', key: 'multiline', description: '^ and $ match line boundaries' },
  { flag: 's', label: 'Dot All', key: 'dotAll', description: '. matches newlines' },
  { flag: 'u', label: 'Unicode', key: 'unicode', description: 'Full Unicode support' },
  { flag: 'y', label: 'Sticky', key: 'sticky', description: 'Match at current position only' },
] as const

// Match highlight colors
const MATCH_COLOR = 'bg-amber-300/60 dark:bg-amber-600/40'
const MATCH_SELECTED_COLOR = 'bg-amber-400/80 dark:bg-amber-500/60 ring-2 ring-primary'
const GROUP_COLORS = [
  'bg-blue-200/70 dark:bg-blue-800/50',
  'bg-green-200/70 dark:bg-green-800/50',
  'bg-purple-200/70 dark:bg-purple-800/50',
  'bg-orange-200/70 dark:bg-orange-800/50',
  'bg-pink-200/70 dark:bg-pink-800/50',
  'bg-cyan-200/70 dark:bg-cyan-800/50',
] as const

interface HighlightSegment {
  start: number
  end: number
  text: string
  type: 'match' | 'group' | 'text'
  matchIndex?: number
  groupIndex?: number
}

async function loadHighlighter(): Promise<HighlighterCore> {
  const { createHighlighterCore } = await import('shiki/core')
  const { createJavaScriptRegexEngine } = await import('shiki/engine-javascript.mjs')
  return createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
    langs: [import('shiki/langs/regex.mjs')],
  })
}

/**
 * Shiki-highlighted pattern with word-wrap support
 */
function PatternHighlight(props: {
  pattern: string
  highlighter: HighlighterCore
  isDark: boolean
}) {
  const html = createMemo(() => {
    if (!props.pattern) {
      return ''
    }
    try {
      const result = props.highlighter.codeToHtml(props.pattern, {
        lang: 'regexp',
        theme: props.isDark ? 'github-dark' : 'github-light',
      })
      // Extract inner content from <pre><code>...</code></pre>
      const match = result.match(/<code[^>]*>([\s\S]*?)<\/code>/)
      return match ? match[1] : props.pattern
    } catch {
      return props.pattern
    }
  })

  return (
    <Show when={html()} fallback={<span class="text-transparent">{props.pattern || ' '}</span>}>
      {/* eslint-disable-next-line solid/no-innerhtml */}
      <span innerHTML={html()} />
    </Show>
  )
}

/**
 * Build highlight segments from matches
 */
function buildHighlightSegments(text: string, matches: MatchResult[]): HighlightSegment[] {
  if (!text || matches.length === 0) {
    return [{ start: 0, end: text.length, text, type: 'text' }]
  }

  const ranges: Array<{
    start: number
    end: number
    type: 'match' | 'group'
    matchIndex: number
    groupIndex?: number
  }> = []

  for (const match of matches) {
    ranges.push({
      start: match.start,
      end: match.end,
      type: 'match',
      matchIndex: match.index,
    })

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

  ranges.sort((a, b) => a.start - b.start || a.end - b.end)

  const segments: HighlightSegment[] = []
  let currentPos = 0

  for (const range of ranges) {
    if (range.end <= currentPos) {
      continue
    }

    if (range.start > currentPos) {
      segments.push({
        start: currentPos,
        end: range.start,
        text: text.slice(currentPos, range.start),
        type: 'text',
      })
    }

    const effectiveStart = Math.max(range.start, currentPos)
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

function getSegmentClass(segment: HighlightSegment, selectedMatchIndex: number | null): string {
  if (segment.type === 'text') {
    return ''
  }
  if (segment.type === 'group' && segment.groupIndex !== undefined) {
    return GROUP_COLORS[segment.groupIndex % GROUP_COLORS.length]
  }
  if (segment.matchIndex !== undefined && segment.matchIndex === selectedMatchIndex) {
    return MATCH_SELECTED_COLOR
  }
  return MATCH_COLOR
}

// Format execution time for display
function formatExecutionTime(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)}μs`
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

export function RegexInputPanel() {
  const { store, actions } = useRegexContext()

  let patternRef!: HTMLTextAreaElement
  let patternMirrorRef!: HTMLDivElement
  let testRef!: HTMLTextAreaElement
  let testMirrorRef!: HTMLDivElement

  const [highlighter] = createResource(loadHighlighter)
  const errorId = createUniqueId()

  const [, , isDark] = useColorMode()

  const matchCount = createMemo(() => store.matches.length)
  const hasInput = createMemo(() => store.pattern && store.testText)
  const segments = createMemo(() => buildHighlightSegments(store.testText, store.matches))

  // Get selected flags as array for multi-select
  const selectedFlags = createMemo(() => {
    return FLAG_OPTIONS.filter(option => store.flags[option.key]).map(option => option.flag)
  })

  // Handle flag selection change
  const handleFlagsChange = (flags: string[]) => {
    const newFlags = FLAG_OPTIONS.reduce((acc, option) => {
      acc[option.key] = flags.includes(option.flag)
      return acc
    }, {} as Record<string, boolean>)
    actions.setFlags(newFlags)
  }

  // Sync scroll for test input
  const syncTestScroll = () => {
    if (testRef && testMirrorRef) {
      testMirrorRef.scrollTop = testRef.scrollTop
      testMirrorRef.scrollLeft = testRef.scrollLeft
    }
  }

  // Auto-resize pattern textarea
  const autoResizePattern = () => {
    if (patternRef) {
      patternRef.style.height = 'auto'
      patternRef.style.height = `${patternRef.scrollHeight}px`
      // Sync mirror height
      if (patternMirrorRef) {
        patternMirrorRef.style.height = `${patternRef.scrollHeight}px`
      }
    }
  }

  createEffect(on(() => store.pattern, () => {
    // Delay auto-resize to ensure DOM is updated
    requestAnimationFrame(autoResizePattern)
  }))

  // Handle pattern change from TextField
  const handlePatternChange = (value: string) => {
    actions.setPattern(value)
  }

  const handleMatchClick = (matchIndex: number) => {
    if (store.selectedMatchIndex === matchIndex) {
      actions.setSelectedMatchIndex(null)
    } else {
      actions.setSelectedMatchIndex(matchIndex)
    }
  }

  return (
    <div class="flex flex-col gap-4">
      {/* Pattern Input Section */}
      <div class="space-y-3">
        {/* Header with stats */}
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium">Pattern</label>
          <div class="text-xs text-muted-foreground flex gap-3 items-center">
            <Show when={hasInput() && store.executionTime > 0}>
              <span class="flex gap-1 items-center">
                <Icon name="lucide:clock" class="size-3" />
                {formatExecutionTime(store.executionTime)}
              </span>
            </Show>
            <Show when={hasInput()}>
              <span class={matchCount() > 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                {matchCount()} match{matchCount() !== 1 ? 'es' : ''}
              </span>
            </Show>
          </div>
        </div>

        {/* Pattern Input with Shiki highlighting + Flag Select */}
        <div class="flex gap-2 items-start">
          <TextField value={store.pattern} onChange={handlePatternChange} class="flex-1 relative">
            {/* Mirror div for syntax highlighting */}
            <div
              ref={patternMirrorRef}
              class="text-sm leading-relaxed font-mono p-2 b-(1 transparent) pointer-events-none whitespace-pre-wrap break-all inset-0 absolute z-10 overflow-hidden"
              aria-hidden="true"
            >
              <Suspense fallback={<span>{store.pattern || ' '}</span>}>
                <Show when={highlighter()}>
                  {hl => <PatternHighlight pattern={store.pattern} highlighter={hl()} isDark={isDark()} />}
                </Show>
              </Suspense>
            </div>
            {/* Textarea - auto height based on content */}
            <TextFieldTextArea
              ref={patternRef}
              placeholder="Enter regex pattern..."
              class="c-transparent leading-relaxed font-mono caret-foreground resize-none break-all !p-2 !min-h-10"
              rows={1}
              aria-label="Regular expression pattern"
              aria-describedby={store.parseError ? errorId : undefined}
              aria-invalid={!store.isValid}
            />
          </TextField>

          {/* Flag Select */}
          <SimpleSelect
            multiple
            value={selectedFlags()}
            onChange={handleFlagsChange}
            options={FLAG_OPTIONS.map(option => ({
              value: option.flag,
              label: `${option.flag} - ${option.label}`,
              meta: option,
            }))}
            placeholder="No Flags"
            class="pt-1"
            renderItem={option => (
              <div class="flex gap-2 items-center">
                <code class="text-primary font-mono font-semibold">{option.value}</code>
                <span class="text-muted-foreground">
                  {option.meta.label}
                </span>
              </div>
            )}
            renderValue={selected => (
              <Show
                when={selected.length > 0}
                fallback={<span class="text-muted-foreground">Flags</span>}
              >
                <span class="text-primary font-medium font-mono">
                  {selected.map(s => s.value).join('')}
                </span>
              </Show>
            )}
          />
        </div>

        {/* Error display */}
        <Show when={store.parseError}>
          {error => (
            <div id={errorId} class="text-sm text-red-600 flex gap-2 items-start dark:text-red-400" role="alert">
              <Icon name="lucide:alert-circle" class="mt-0.5 flex-shrink-0 size-4" />
              <span>{error().message}</span>
            </div>
          )}
        </Show>
      </div>

      {/* Test Text Section - fixed 400px height with scroll */}
      <TextField value={store.testText} onChange={actions.setTestText}>
        <TextFieldLabel>Test String</TextFieldLabel>
        <div class="b-(1 transparent) rounded-lg h-100 relative overflow-hidden">
          {/* Highlight layer */}
          <div
            ref={testMirrorRef}
            class="text-sm leading-relaxed font-mono p-(x-3 y-2) h-full pointer-events-none whitespace-pre-wrap break-words inset-0 absolute z-0 overflow-auto"
            aria-hidden="true"
          >
            <For each={segments()}>
              {segment => (
                <span
                  class={getSegmentClass(segment, store.selectedMatchIndex)}
                  data-match-index={segment.matchIndex}
                >
                  {segment.text}
                </span>
              )}
            </For>
          </div>
          {/* Textarea - fixed height with scroll */}
          <TextFieldTextArea
            ref={testRef}
            placeholder="Enter text to test your regex..."
            class="c-transparent leading-relaxed font-mono caret-foreground h-full resize-none break-all !min-h-0"
            onScroll={syncTestScroll}
            onClick={(e: MouseEvent) => {
              const target = e.target as HTMLElement
              const idx = target.getAttribute?.('data-match-index')
              if (idx !== null && idx !== undefined) {
                handleMatchClick(Number.parseInt(idx, 10))
              }
            }}
            aria-label="Test text"
          />
        </div>
      </TextField>

      {/* No matches hint */}
      <Show when={hasInput() && matchCount() === 0 && store.isValid}>
        <div class="text-sm text-amber-600 p-3 border border-amber-200 rounded-lg bg-amber-50 flex gap-2 items-center dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30">
          <Icon name="lucide:info" class="size-4" />
          <span>No matches found. Try adjusting your pattern.</span>
        </div>
      </Show>
    </div>
  )
}
