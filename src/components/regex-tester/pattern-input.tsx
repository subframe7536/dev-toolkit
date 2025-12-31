import type { HighlighterCore } from 'shiki'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { TextField, TextFieldLabel, TextFieldTextArea } from '#/components/ui/text-field'
import { useRegexContext } from '#/contexts/regex-context'
import { createEffect, createMemo, createResource, createUniqueId, For, onMount, Show, Suspense } from 'solid-js'

import Icon from '../ui/icon'

const FLAG_OPTIONS = [
  { flag: 'g', label: 'Global', key: 'global', description: 'Find all matches instead of stopping after the first match' },
  { flag: 'i', label: 'Ignore case', key: 'ignoreCase', description: 'Case-insensitive matching' },
  { flag: 'm', label: 'Multiline', key: 'multiline', description: 'Treat ^ and $ as line boundaries' },
  { flag: 's', label: 'Dot all', key: 'dotAll', description: 'Allow . to match newline characters' },
  { flag: 'u', label: 'Unicode', key: 'unicode', description: 'Enable full Unicode support' },
  { flag: 'y', label: 'Sticky', key: 'sticky', description: 'Match only at the current position' },
] as const

async function loadHighlighter(): Promise<HighlighterCore> {
  const { createHighlighter } = await import('shiki')
  return createHighlighter({
    themes: ['github-dark'],
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
        theme: 'github-dark',
      })
    } catch {
      return undefined
    }
  })

  return (
    <Show when={html()}>
      <div
        // eslint-disable-next-line solid/no-innerhtml
        innerHTML={html()}
        class="[&_pre]:(m-0! p-0! bg-transparent! whitespace-pre-wrap! overflow-visible!) [&_code]:(bg-transparent! whitespace-pre-wrap! break-words!)"
        aria-hidden="true"
      />
    </Show>
  )
}

export function PatternInput() {
  const { store, actions } = useRegexContext()
  let textareaRef: HTMLTextAreaElement | undefined
  let highlightRef: HTMLDivElement | undefined

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

  const matchStatus = createMemo(() => {
    if (!store.pattern || !store.testText) {
      return null
    }
    if (!store.isValid) {
      return 'invalid pattern'
    }
    if (store.matches.length === 0) {
      return 'no match'
    }
    return `${store.matches.length} match${store.matches.length !== 1 ? 'es' : ''}`
  })

  const handleScroll = () => {
    if (textareaRef && highlightRef) {
      highlightRef.scrollTop = textareaRef.scrollTop
      highlightRef.scrollLeft = textareaRef.scrollLeft
    }
  }

  // // Fix highlight layer overflow and sync height
  // const fixHighlightOverflow = () => {
  //   if (highlightRef) {
  //     // Remove overflow restrictions
  //     highlightRef.style.overflow = 'visible'
  //     highlightRef.style.height = 'auto'
  //     highlightRef.style.minHeight = '100%'
  //     highlightRef.style.maxHeight = 'none'

  //     // Ensure pre and code elements wrap properly
  //     const preElement = highlightRef.querySelector('pre')
  //     const codeElement = highlightRef.querySelector('code')

  //     if (preElement) {
  //       preElement.style.whiteSpace = 'pre-wrap'
  //       preElement.style.wordBreak = 'break-word'
  //       preElement.style.overflow = 'visible'
  //     }

  //     if (codeElement) {
  //       codeElement.style.whiteSpace = 'pre-wrap'
  //       codeElement.style.wordBreak = 'break-word'
  //     }
  //   }
  // }

  // // Apply fixes when component mounts and when highlighter loads
  // onMount(() => {
  //   fixHighlightOverflow()
  // })

  // // Re-apply fixes when highlighter content changes
  // createEffect(() => {
  //   if (highlighter() && store.pattern) {
  //     // Use setTimeout to ensure DOM is updated
  //     queueMicrotask(fixHighlightOverflow)
  //   }
  // })

  // Keyboard shortcut handler for common actions
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + Enter to focus test text area
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      const testTextArea = document.querySelector('[aria-label="Test text input"]') as HTMLTextAreaElement
      testTextArea?.focus()
    }
  }

  return (
    <TextField class="space-y-4">
      {/* Header with title and status */}
      <div class="flex items-center justify-between">
        <TextFieldLabel id="pattern-label" class="text-sm text-muted-foreground tracking-wide font-medium uppercase">
          Regular Expression
        </TextFieldLabel>
        <div class="text-xs text-muted-foreground flex gap-2 items-center">
          <Show when={matchStatus()}>
            <span class={matchStatus()?.includes('no match') || matchStatus()?.includes('invalid')
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-green-600 dark:text-green-400'}
            >
              {matchStatus()}
            </span>
          </Show>
          <Show when={executionTime()}>
            <span>({executionTime()})</span>
          </Show>
        </div>
      </div>

      <div class="flex gap-2">
        <div class="flex-1 relative">
          {/* Syntax highlighting overlay - hidden from screen readers */}
          <div
            ref={highlightRef}
            class="text-sm leading-relaxed font-mono p-3 b-(1 transparent) rounded-md pointer-events-none whitespace-pre-wrap break-words inset-0 absolute z-10 h-auto! max-h-none! min-h-full! overflow-visible!"
            aria-hidden="true"
          >
            <Suspense>
              <Show when={highlighter()}>
                {hl => <HighlightedPattern pattern={store.pattern} highlighter={hl()} />}
              </Show>
            </Suspense>
          </div>

          {/* Textarea input */}
          <TextFieldTextArea
            ref={textareaRef}
            placeholder="Enter your regex pattern here..."
            class="font-mono resize-none relative z-1 !min-h-8"
            style={{
              'color': '#fff',
              'caret-color': 'var(--colors-foreground)',
              'overflow': 'auto',
            }}
            value={store.pattern}
            onInput={e => actions.setPattern(e.currentTarget.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            aria-labelledby="pattern-label"
            aria-describedby={store.parseError ? errorId : undefined}
            aria-invalid={!store.isValid}
          />

          {/* Error display */}
          <Show when={store.parseError}>
            {error => (
              <div
                id={errorId}
                class="text-sm text-red-600 mt-1 flex gap-2 items-start"
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

        {/* Flags multi-select */}
        <div class="w-24">
          <label class="text-xs font-medium mb-2 block">Flags</label>
          <Select<string>
            multiple
            value={selectedFlags()}
            onChange={handleFlagsChange}
            options={FLAG_OPTIONS.map(option => option.flag)}
            placeholder="Select flags"
            itemComponent={props => (
              <SelectItem item={props.item}>
                <div class="flex gap-2 items-center">
                  <code class="text-xs font-mono font-semibold">{props.item.rawValue}</code>
                  <span class="text-xs">
                    {FLAG_OPTIONS.find(opt => opt.flag === props.item.rawValue)?.label}
                  </span>
                </div>
              </SelectItem>
            )}
          >
            <SelectTrigger noIcon class="text-xs h-8 w-full">
              <SelectValue<string[]>>
                {state => (
                  <div class="flex flex-wrap gap-1">
                    <Show
                      when={state.selectedOptions().length > 0}
                      fallback={<span class="text-muted-foreground">No flags</span>}
                    >
                      <For each={state.selectedOptions()}>
                        {flag => (
                          <span class="text-xs text-primary font-mono px-1 rounded bg-primary/10">
                            {flag}
                          </span>
                        )}
                      </For>
                    </Show>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
      </div>
    </TextField>
  )
}
