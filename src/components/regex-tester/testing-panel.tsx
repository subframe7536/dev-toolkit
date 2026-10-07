import { Icon, Switch } from 'moraine'
import { createMemo, createSignal, For, Show } from 'solid-js'

import { useRegexContext } from '#/contexts/regex-context'
import type { MatchResult } from '#/utils/regex/types'

// Match highlight colors
const MATCH_COLOR = 'bg-primary/20 dark:bg-primary/30 rounded-xs'
const MATCH_SELECTED_COLOR = 'bg-primary/35 dark:bg-primary/50 ring-1 ring-primary rounded-xs'
const GROUP_COLORS = [
  'bg-blue-300/40 dark:bg-blue-800/40 text-blue-900 dark:text-blue-100 rounded-xs',
  'bg-green-300/40 dark:bg-green-800/40 text-green-900 dark:text-green-100 rounded-xs',
  'bg-purple-300/40 dark:bg-purple-800/40 text-purple-900 dark:text-purple-100 rounded-xs',
  'bg-orange-300/40 dark:bg-orange-800/40 text-orange-900 dark:text-orange-100 rounded-xs',
  'bg-pink-300/40 dark:bg-pink-800/40 text-pink-900 dark:text-pink-100 rounded-xs',
  'bg-cyan-300/40 dark:bg-cyan-800/40 text-cyan-900 dark:text-cyan-100 rounded-xs',
] as const

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

export function TestingPanel() {
  const { store, actions } = useRegexContext()

  let testRef!: HTMLTextAreaElement
  let testMirrorRef!: HTMLDivElement

  const [cursorPos, setCursorPos] = createSignal({ line: 1, column: 1 })

  const matchCount = createMemo(() => store.matches.length)
  const hasInput = createMemo(() => Boolean(store.pattern && store.testText))
  const segments = createMemo(() => buildHighlightSegments(store.testText, store.matches))

  const updateCursorPos = () => {
    if (!testRef) {
      return
    }
    const pos = testRef.selectionStart ?? 0
    const textBefore = store.testText.slice(0, pos)
    const lines = textBefore.split('\n')
    setCursorPos({
      line: lines.length,
      column: (lines[lines.length - 1]?.length ?? 0) + 1,
    })
  }

  const syncTestScroll = () => {
    if (testRef && testMirrorRef) {
      testMirrorRef.scrollTop = testRef.scrollTop
      testMirrorRef.scrollLeft = testRef.scrollLeft
    }
  }

  const handleMatchClick = (matchIndex: number) => {
    if (store.selectedMatchIndex === matchIndex) {
      actions.setSelectedMatchIndex(null)
    } else {
      actions.setSelectedMatchIndex(matchIndex)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    updateCursorPos()

    if (matchCount() === 0) {
      return
    }

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

  return (
    <div class="flex flex-col gap-1.5" role="region" aria-label="Test String">
      {/* Header bar */}
      <div class="flex min-h-6 items-center justify-between">
        <div class="flex gap-3 items-center">
          <span class="text-sm text-foreground font-medium">Test String</span>
          <Switch
            label="details"
            size="sm"
            checked={store.showMatchInfo}
            onCheckedChange={(checked) => actions.toggleMatchInfo(checked)}
            classes={{
              label: 'text-xs text-muted-foreground font-normal cursor-pointer select-none',
            }}
          />
        </div>
        <Show when={store.testText}>
          <span class="text-xs text-muted-foreground font-mono">
            {store.testText.length} {store.testText.length === 1 ? 'char' : 'chars'}
          </span>
        </Show>
      </div>

      {/* Enclosed Card */}
      <div class="border border-border rounded-lg bg-card/60 flex flex-col h-[300px] relative overflow-hidden focus-within:(border-primary ring-1 ring-primary)">
        {/* Editor Container */}
        <div class="flex-1 relative overflow-hidden">
          {/* Highlight mirror layer */}
          <div
            ref={(element) => (testMirrorRef = element)}
            class="text-sm leading-6 font-mono m-0 p-3.5 border-0 h-full w-full pointer-events-none select-none whitespace-pre-wrap break-all inset-0 absolute z-0 overflow-auto"
            aria-hidden="true"
          >
            <For each={segments()}>
              {(segment) => (
                <span
                  class={getSegmentClass(segment, store.selectedMatchIndex)}
                  data-match-index={segment.matchIndex}
                >
                  {segment.text}
                </span>
              )}
            </For>
          </div>

          {/* Textarea */}
          <textarea
            ref={(element) => (testRef = element)}
            placeholder="Enter text to test your regex..."
            class="text-sm text-transparent leading-6 font-mono m-0 p-3.5 outline-none caret-foreground border-0 bg-transparent h-full w-full block resize-none break-all relative z-10 overflow-auto selection:(text-transparent bg-primary/30)"
            value={store.testText}
            onInput={(e) => {
              actions.setTestText(e.currentTarget.value)
              updateCursorPos()
            }}
            onScroll={syncTestScroll}
            onKeyDown={handleKeyDown}
            onKeyUp={updateCursorPos}
            onSelect={updateCursorPos}
            onClick={(e: MouseEvent) => {
              updateCursorPos()
              const target = e.target as HTMLElement
              const idx = target.getAttribute?.('data-match-index')
              if (idx !== null && idx !== undefined) {
                handleMatchClick(Number.parseInt(idx, 10))
              }
            }}
          />
        </div>

        {/* Status bar */}
        <div class="text-xs text-muted-foreground font-mono px-3.5 py-1 text-right border-t border-border/40 bg-muted/10 shrink-0 select-none">
          Line {cursorPos().line}, column {cursorPos().column}
        </div>
      </div>

      {/* No matches hint (shown when match info is hidden) */}
      <Show when={!store.showMatchInfo && hasInput() && matchCount() === 0 && store.isValid}>
        <div class="text-xs text-amber-600 p-2.5 border border-amber-200 rounded-lg bg-amber-50 flex gap-2 items-center dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30">
          <Icon name="i-lucide-info" class="shrink-0 size-4" />
          <span>No matches found. Try adjusting your pattern or flags.</span>
        </div>
      </Show>
    </div>
  )
}
