import type { MatchResult } from '#/utils/regex/types'

import { useRegexContext } from '#/contexts/regex-context'
import { createMemo, For, Show } from 'solid-js'

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

export function TestingPanel() {
  const { store, actions } = useRegexContext()
  let textareaRef: HTMLTextAreaElement | undefined
  let highlightRef: HTMLDivElement | undefined

  // Build highlight segments reactively
  const segments = createMemo(() =>
    buildHighlightSegments(store.testText, store.matches),
  )

  // Check if there are any matches
  const hasMatches = createMemo(() => store.matches.length > 0)
  const hasInput = createMemo(() => store.pattern && store.testText)

  const handleScroll = () => {
    if (textareaRef && highlightRef) {
      highlightRef.scrollTop = textareaRef.scrollTop
      highlightRef.scrollLeft = textareaRef.scrollLeft
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

  // Keyboard navigation for matches
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!hasMatches()) {
      return
    }

    // Arrow keys to navigate between matches when focused on test text
    if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault()
      const currentIndex = store.selectedMatchIndex ?? -1
      const nextIndex = Math.min(currentIndex + 1, store.matches.length - 1)
      actions.setSelectedMatchIndex(nextIndex)
    } else if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault()
      const currentIndex = store.selectedMatchIndex ?? store.matches.length
      const prevIndex = Math.max(currentIndex - 1, 0)
      actions.setSelectedMatchIndex(prevIndex)
    } else if (e.key === 'Escape') {
      actions.setSelectedMatchIndex(null)
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
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label id="test-text-label" class="text-sm font-medium">Test Text</label>
        <Show when={hasInput()}>
          <div class="text-xs text-muted-foreground" aria-live="polite">
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

      <div class="relative">
        {/* Highlight overlay - hidden from screen readers */}
        <div
          ref={highlightRef}
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
          ref={textareaRef}
          placeholder="Enter text to test your regex against..."
          class="text-sm leading-relaxed font-mono p-(2 3) border border-input rounded-md h-64 w-full resize-y relative z-10 focus:(outline-none ring-2 ring-ring)"
          style={{
            'background': store.testText ? 'transparent' : undefined,
            'color': store.testText ? 'transparent' : undefined,
            'caret-color': 'var(--foreground)',
          }}
          value={store.testText}
          onInput={e => actions.setTestText(e.currentTarget.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
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
          <span class="i-lucide-mouse-pointer-click mr-1 size-3 inline-block" aria-hidden="true" />
          Click on highlighted matches to view details. Use Alt+↑/↓ to navigate matches.
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
  )
}
