import type { MatchResult } from '#/utils/regex/types'

import { useRegexContext } from '#/contexts/regex-context'
import { createMemo, For, Show } from 'solid-js'

// Color palette for capture groups - matches TestingPanel colors
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

interface MatchDetailRowProps {
  match: MatchResult
  isSelected: boolean
  onSelect: () => void
}

function MatchDetailRow(props: MatchDetailRowProps) {
  return (
    <div
      class={`p-3 border rounded-md cursor-pointer transition-colors ${
        props.isSelected
          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
          : 'border-border bg-muted/20 hover:bg-muted/40'
      }`}
      onClick={() => props.onSelect()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          props.onSelect()
        }
      }}
      aria-pressed={props.isSelected}
      aria-label={`Match ${props.match.index + 1}: "${props.match.fullMatch}" at position ${props.match.start} to ${props.match.end}`}
    >
      {/* Match header */}
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-medium">Match {props.match.index + 1}</span>
        <span class="text-xs text-muted-foreground">
          Index: {props.match.index}
        </span>
      </div>

      {/* Match details table */}
      <table class="text-sm w-full" aria-label={`Details for match ${props.match.index + 1}`}>
        <tbody>
          <tr class="border-b border-border/50">
            <td class="text-muted-foreground font-medium py-1 pr-3 w-24">Full Match</td>
            <td class="font-mono py-1 break-all">"{props.match.fullMatch}"</td>
          </tr>
          <tr class="border-b border-border/50">
            <td class="text-muted-foreground font-medium py-1 pr-3">Position</td>
            <td class="font-mono py-1">{props.match.start} - {props.match.end}</td>
          </tr>
          <tr>
            <td class="text-muted-foreground font-medium py-1 pr-3">Length</td>
            <td class="font-mono py-1">{props.match.fullMatch.length}</td>
          </tr>
        </tbody>
      </table>

      {/* Capture groups */}
      <Show when={props.match.groups.length > 0}>
        <div class="mt-3 pt-2 border-t border-border/50">
          <div class="text-xs text-muted-foreground font-medium mb-2">
            Capture Groups ({props.match.groups.length})
          </div>
          <div class="space-y-1" role="list" aria-label="Capture groups">
            <For each={props.match.groups}>
              {group => (
                <div class="text-xs flex gap-2 items-start" role="listitem">
                  <span
                    class={`font-mono px-1.5 py-0.5 rounded ${
                      CAPTURE_GROUP_COLORS[group.index % CAPTURE_GROUP_COLORS.length]
                    }`}
                  >
                    {group.name ? `${group.name} (${group.index})` : `Group ${group.index}`}
                  </span>
                  <span class="font-mono flex-1 break-all">"{group.value}"</span>
                  <span class="text-muted-foreground whitespace-nowrap">
                    {group.start}-{group.end}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}

export function DetailsPanel() {
  const { store, actions } = useRegexContext()

  const hasMatches = createMemo(() => store.matches.length > 0)
  const hasInput = createMemo(() => store.pattern && store.testText)

  // Get selected match for detailed view
  const selectedMatch = createMemo(() => {
    if (store.selectedMatchIndex === null) {
      return null
    }
    return store.matches[store.selectedMatchIndex] ?? null
  })

  // Summary statistics
  const stats = createMemo(() => {
    const matches = store.matches
    if (matches.length === 0) {
      return null
    }

    const totalGroups = matches.reduce((sum, m) => sum + m.groups.length, 0)
    const totalLength = matches.reduce((sum, m) => sum + m.fullMatch.length, 0)

    return {
      matchCount: matches.length,
      groupCount: totalGroups,
      totalLength,
    }
  })

  // Keyboard navigation for match list
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!hasMatches()) {
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const currentIndex = store.selectedMatchIndex ?? -1
      const nextIndex = Math.min(currentIndex + 1, store.matches.length - 1)
      actions.setSelectedMatchIndex(nextIndex)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const currentIndex = store.selectedMatchIndex ?? store.matches.length
      const prevIndex = Math.max(currentIndex - 1, 0)
      actions.setSelectedMatchIndex(prevIndex)
    } else if (e.key === 'Escape') {
      actions.setSelectedMatchIndex(null)
    }
  }

  return (
    <div class="space-y-4">
      {/* Summary section */}
      <div class="p-4 border border-border rounded-lg bg-card" role="region" aria-labelledby="summary-heading">
        <h3 id="summary-heading" class="text-md text-foreground font-medium mb-3">Match Summary</h3>
        <Show
          when={hasMatches()}
          fallback={(
            <div class="text-sm text-muted-foreground p-4 border border-border rounded-md border-dashed bg-muted/20">
              {hasInput()
                ? 'No matches found'
                : 'Match results will appear here when you enter a pattern and test text.'}
            </div>
          )}
        >
          <div class="gap-3 grid grid-cols-3" role="group" aria-label="Match statistics">
            <div class="p-3 text-center border border-border rounded-md bg-muted/20">
              <div class="text-2xl text-primary font-bold" aria-label={`${stats()?.matchCount} matches`}>{stats()?.matchCount}</div>
              <div class="text-xs text-muted-foreground">Matches</div>
            </div>
            <div class="p-3 text-center border border-border rounded-md bg-muted/20">
              <div class="text-2xl text-primary font-bold" aria-label={`${stats()?.groupCount} groups`}>{stats()?.groupCount}</div>
              <div class="text-xs text-muted-foreground">Groups</div>
            </div>
            <div class="p-3 text-center border border-border rounded-md bg-muted/20">
              <div class="text-2xl text-primary font-bold" aria-label={`${stats()?.totalLength} characters matched`}>{stats()?.totalLength}</div>
              <div class="text-xs text-muted-foreground">Chars Matched</div>
            </div>
          </div>
        </Show>
      </div>

      {/* Match details section */}
      <div class="p-4 border border-border rounded-lg bg-card" role="region" aria-labelledby="details-heading">
        <div class="mb-3 flex items-center justify-between">
          <h3 id="details-heading" class="text-md text-foreground font-medium">Match Details</h3>
          <Show when={hasMatches() && store.selectedMatchIndex !== null}>
            <button
              class="text-xs text-muted-foreground transition-colors hover:text-foreground focus:(outline-none underline)"
              onClick={() => actions.setSelectedMatchIndex(null)}
              aria-label="Clear match selection"
            >
              Clear selection
            </button>
          </Show>
        </div>

        <Show
          when={hasMatches()}
          fallback={(
            <div class="text-sm text-muted-foreground p-4 border border-border rounded-md border-dashed bg-muted/20">
              Detailed information about matches and capture groups will be displayed here.
            </div>
          )}
        >
          <div
            class="max-h-96 overflow-y-auto space-y-2"
            role="listbox"
            aria-label="Match list"
            aria-activedescendant={store.selectedMatchIndex !== null ? `match-${store.selectedMatchIndex}` : undefined}
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <For each={store.matches}>
              {match => (
                <div id={`match-${match.index}`} role="option" aria-selected={store.selectedMatchIndex === match.index}>
                  <MatchDetailRow
                    match={match}
                    isSelected={store.selectedMatchIndex === match.index}
                    onSelect={() => actions.setSelectedMatchIndex(match.index)}
                  />
                </div>
              )}
            </For>
          </div>
          <div class="text-xs text-muted-foreground mt-2">
            Use ↑/↓ arrow keys to navigate matches, Escape to clear selection
          </div>
        </Show>
      </div>

      {/* Selected match expanded view */}
      <Show when={selectedMatch()}>
        {match => (
          <div class="p-4 border border-primary/50 rounded-lg bg-primary/5" role="region" aria-label={`Selected match ${match().index + 1} details`}>
            <h3 class="text-md text-foreground font-medium mb-3">
              Selected: Match {match().index + 1}
            </h3>
            <div class="space-y-3">
              <div>
                <div class="text-xs text-muted-foreground mb-1">Full Match Text</div>
                <div class="text-sm font-mono p-2 border border-border rounded bg-muted/30 break-all" tabIndex={0}>
                  {match().fullMatch}
                </div>
              </div>

              <div class="gap-3 grid grid-cols-2">
                <div>
                  <div class="text-xs text-muted-foreground mb-1">Start Position</div>
                  <div class="text-sm font-mono p-2 border border-border rounded bg-muted/30">
                    {match().start}
                  </div>
                </div>
                <div>
                  <div class="text-xs text-muted-foreground mb-1">End Position</div>
                  <div class="text-sm font-mono p-2 border border-border rounded bg-muted/30">
                    {match().end}
                  </div>
                </div>
              </div>

              <Show when={match().groups.length > 0}>
                <div>
                  <div class="text-xs text-muted-foreground mb-2">Capture Groups</div>
                  <table class="text-sm border border-border rounded w-full overflow-hidden" aria-label="Capture groups table">
                    <thead class="bg-muted/50">
                      <tr>
                        <th class="font-medium px-2 py-1 text-left" scope="col">Index</th>
                        <th class="font-medium px-2 py-1 text-left" scope="col">Name</th>
                        <th class="font-medium px-2 py-1 text-left" scope="col">Value</th>
                        <th class="font-medium px-2 py-1 text-left" scope="col">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={match().groups}>
                        {group => (
                          <tr class="border-t border-border/50">
                            <td class="font-mono px-2 py-1">{group.index}</td>
                            <td class="font-mono px-2 py-1">{group.name ?? '-'}</td>
                            <td class="font-mono px-2 py-1 break-all">"{group.value}"</td>
                            <td class="font-mono px-2 py-1">{group.start}-{group.end}</td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}
