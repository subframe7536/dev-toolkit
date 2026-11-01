import { createMemo, For, Show } from 'solid-js'

import { useRegexContext } from '#/contexts/regex-context'
import type { MatchResult } from '#/utils/regex/types'

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
      class={`p-2.5 border rounded-md cursor-pointer transition-colors focus-visible:outline-none ${
        props.isSelected
          ? 'border-primary bg-primary/10 ring-1 ring-primary'
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
      <div class="mb-1 flex gap-2 items-center justify-between">
        <div class="flex gap-1.5 min-w-0 items-center">
          <span class="text-xs text-foreground font-semibold">Match {props.match.index + 1}</span>
          <span class="text-[11px] text-muted-foreground font-mono px-1.5 py-0.2 rounded bg-muted/60">
            {props.match.start}–{props.match.end}
          </span>
          <Show when={props.match.groups.length > 0}>
            <span class="text-[11px] text-muted-foreground">
              · {props.match.groups.length} {props.match.groups.length === 1 ? 'group' : 'groups'}
            </span>
          </Show>
        </div>
        <span class="text-[11px] text-muted-foreground font-mono shrink-0">
          len {props.match.fullMatch.length}
        </span>
      </div>

      <div class="text-xs font-mono px-2 py-1 border border-border/40 rounded bg-background/50 break-all truncate">
        "{props.match.fullMatch}"
      </div>

      <Show when={props.match.groups.length > 0}>
        <div class="mt-1.5 flex flex-wrap gap-1" role="list" aria-label="Capture groups">
          <For each={props.match.groups}>
            {(group) => (
              <span
                class={`text-[11px] font-mono px-1.5 py-0.2 rounded max-w-full truncate ${
                  CAPTURE_GROUP_COLORS[group.index % CAPTURE_GROUP_COLORS.length]
                }`}
                title={
                  group.name
                    ? `${group.name}: "${group.value}"`
                    : `Group ${group.index}: "${group.value}"`
                }
                role="listitem"
              >
                ${group.index}: "{group.value}"
              </span>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}

export function DetailsPanel() {
  const { store, actions } = useRegexContext()

  const hasMatches = createMemo(() => store.matches.length > 0)
  const hasInput = createMemo(() => Boolean(store.pattern && store.testText))

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

  return (
    <div class="flex flex-col gap-1.5" role="region" aria-label="Match Information">
      {/* Header bar */}
      <div class="flex min-h-6 items-center justify-between">
        <div class="flex gap-2 items-center">
          <span class="text-sm text-foreground font-medium">Match Information</span>
          <Show when={hasMatches()}>
            <span class="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded bg-muted/70">
              {stats()?.matchCount} {stats()?.matchCount === 1 ? 'match' : 'matches'}
              <Show when={(stats()?.groupCount ?? 0) > 0}>
                {' · '}
                {stats()?.groupCount} {(stats()?.groupCount ?? 0) === 1 ? 'group' : 'groups'}
              </Show>
            </span>
          </Show>
        </div>
        <Show when={hasMatches() && store.selectedMatchIndex !== null}>
          <button
            class="text-xs text-muted-foreground cursor-pointer transition-colors hover:text-foreground focus:(outline-none underline)"
            onClick={() => actions.setSelectedMatchIndex(null)}
            aria-label="Clear match selection"
          >
            Clear selection
          </button>
        </Show>
      </div>

      {/* Enclosed Card */}
      <div class="p-3 border border-border rounded-lg bg-card/60 flex flex-col h-[300px] overflow-hidden">
        <Show
          when={hasMatches()}
          fallback={
            <div class="text-sm text-muted-foreground p-4 text-center border border-border rounded-md border-dashed bg-muted/20 flex flex-1 items-center justify-center">
              {hasInput()
                ? 'No matches found.'
                : 'Enter a regular expression and test string to view match breakdown.'}
            </div>
          }
        >
          {/* Summary statistics */}
          <div class="shrink-0 gap-2.5 grid grid-cols-3" role="group" aria-label="Match statistics">
            <div class="p-2 text-center border border-border rounded-md bg-muted/20">
              <div
                class="text-xl text-primary font-bold"
                aria-label={`${stats()?.matchCount} matches`}
              >
                {stats()?.matchCount}
              </div>
              <div class="text-xs text-muted-foreground">Matches</div>
            </div>
            <div class="p-2 text-center border border-border rounded-md bg-muted/20">
              <div
                class="text-xl text-primary font-bold"
                aria-label={`${stats()?.groupCount} groups`}
              >
                {stats()?.groupCount}
              </div>
              <div class="text-xs text-muted-foreground">Groups</div>
            </div>
            <div class="p-2 text-center border border-border rounded-md bg-muted/20">
              <div
                class="text-xl text-primary font-bold"
                aria-label={`${stats()?.totalLength} characters matched`}
              >
                {stats()?.totalLength}
              </div>
              <div class="text-xs text-muted-foreground">Chars Matched</div>
            </div>
          </div>

          {/* Match details and selected match scrollable area */}
          <div class="mt-2 pr-0.5 flex-1 overflow-y-auto space-y-2">
            {/* Match details list */}
            <div
              class="space-y-1.5"
              role="listbox"
              aria-label="Match list"
              aria-activedescendant={
                store.selectedMatchIndex !== null ? `match-${store.selectedMatchIndex}` : undefined
              }
            >
              <For each={store.matches}>
                {(match) => (
                  <div
                    id={`match-${match.index}`}
                    role="option"
                    aria-selected={store.selectedMatchIndex === match.index}
                  >
                    <MatchDetailRow
                      match={match}
                      isSelected={store.selectedMatchIndex === match.index}
                      onSelect={() => actions.setSelectedMatchIndex(match.index)}
                    />
                  </div>
                )}
              </For>
            </div>

            {/* Selected match expanded view */}
            <Show when={selectedMatch()}>
              {(match) => (
                <div
                  class="p-3 border border-primary/40 rounded-lg bg-primary/5 space-y-2.5"
                  role="region"
                  aria-label={`Selected match ${match().index + 1} details`}
                >
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs text-foreground font-semibold">
                      Selected: Match {match().index + 1}
                    </h4>
                    <button
                      class="text-xs text-muted-foreground cursor-pointer transition-colors hover:text-foreground"
                      onClick={() => actions.setSelectedMatchIndex(null)}
                      aria-label="Close selected match details"
                    >
                      Close
                    </button>
                  </div>
                  <div class="space-y-2">
                    <div>
                      <div class="text-xs text-muted-foreground mb-1">Full Match Text</div>
                      <div
                        class="text-xs font-mono p-2 border border-border rounded bg-muted/30 max-h-24 break-all overflow-y-auto"
                        tabIndex={0}
                      >
                        {match().fullMatch}
                      </div>
                    </div>

                    <div class="gap-2 grid grid-cols-2">
                      <div>
                        <div class="text-xs text-muted-foreground mb-0.5">Start Position</div>
                        <div class="text-xs font-mono p-1.5 border border-border rounded bg-muted/30">
                          {match().start}
                        </div>
                      </div>
                      <div>
                        <div class="text-xs text-muted-foreground mb-0.5">End Position</div>
                        <div class="text-xs font-mono p-1.5 border border-border rounded bg-muted/30">
                          {match().end}
                        </div>
                      </div>
                    </div>

                    <Show when={match().groups.length > 0}>
                      <div>
                        <div class="text-xs text-muted-foreground mb-1">Capture Groups</div>
                        <table
                          class="text-xs border border-border rounded w-full overflow-hidden"
                          aria-label="Capture groups table"
                        >
                          <thead class="bg-muted/50">
                            <tr>
                              <th class="font-medium px-2 py-1 text-left" scope="col">
                                Index
                              </th>
                              <th class="font-medium px-2 py-1 text-left" scope="col">
                                Name
                              </th>
                              <th class="font-medium px-2 py-1 text-left" scope="col">
                                Value
                              </th>
                              <th class="font-medium px-2 py-1 text-left" scope="col">
                                Position
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <For each={match().groups}>
                              {(group) => (
                                <tr class="border-t border-border/50">
                                  <td class="font-mono px-2 py-1">
                                    <span
                                      class={`font-mono px-1.5 py-0.5 rounded ${
                                        CAPTURE_GROUP_COLORS[
                                          group.index % CAPTURE_GROUP_COLORS.length
                                        ]
                                      }`}
                                    >
                                      ${group.index}
                                    </span>
                                  </td>
                                  <td class="font-mono px-2 py-1">{group.name ?? '-'}</td>
                                  <td class="font-mono px-2 py-1 break-all">"{group.value}"</td>
                                  <td class="font-mono px-2 py-1">
                                    {group.start}–{group.end}
                                  </td>
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
        </Show>
      </div>
    </div>
  )
}
