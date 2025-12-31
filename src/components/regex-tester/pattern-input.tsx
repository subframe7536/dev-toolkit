import type { HighlighterCore } from 'shiki'

import { TextField, TextFieldLabel, TextFieldTextArea } from '#/components/ui/text-field'
import { useRegexContext } from '#/contexts/regex-context'
import { createMemo, createResource, createUniqueId, For, Show, Suspense } from 'solid-js'

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
      <div innerHTML={html()} class="[&_pre]:(m-0 p-0 bg-transparent!) [&_code]:(bg-transparent!)" aria-hidden="true" />
    </Show>
  )
}

export function PatternInput() {
  const { store, actions } = useRegexContext()
  let textareaRef: HTMLTextAreaElement | undefined
  let highlightRef: HTMLDivElement | undefined

  const [highlighter] = createResource(loadHighlighter)
  const errorId = createUniqueId()
  const flagsGroupId = createUniqueId()

  const handleScroll = () => {
    if (textareaRef && highlightRef) {
      highlightRef.scrollTop = textareaRef.scrollTop
      highlightRef.scrollLeft = textareaRef.scrollLeft
    }
  }

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
      <TextFieldLabel id="pattern-label">Regular Expression Pattern</TextFieldLabel>
      <div class="flex gap-2">
        <div class="flex-1 relative">
          {/* Syntax highlighting overlay - hidden from screen readers */}
          <div
            ref={highlightRef}
            class="text-sm leading-relaxed font-mono p-(2 3) border border-transparent rounded-md pointer-events-none whitespace-pre-wrap break-words inset-0 absolute z-1 overflow-hidden"
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
            class="font-mono resize-none relative z-10 !min-h-8"
            style={{
              'background': highlighter() && store.pattern ? 'transparent' : undefined,
              'color': highlighter() && store.pattern ? 'transparent' : undefined,
              'caret-color': 'var(--foreground)',
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

        {/* Flags panel */}
        <fieldset class="w-24" aria-labelledby={flagsGroupId}>
          <legend id={flagsGroupId} class="text-xs font-medium mb-2">Flags</legend>
          <div class="space-y-1" role="group">
            <For each={FLAG_OPTIONS}>
              {({ flag, label, key, description }) => (
                <label
                  class="text-xs p-1 rounded flex gap-1 cursor-pointer items-center hover:bg-muted/50 focus-within:(ring-2 ring-ring ring-offset-1)"
                  title={description}
                >
                  <input
                    type="checkbox"
                    class="size-3 focus:(outline-none)"
                    checked={store.flags[key]}
                    onChange={e => actions.setFlags({ [key]: e.currentTarget.checked })}
                    aria-label={`${label} flag (${flag}): ${description}`}
                  />
                  <code class="text-xs font-mono font-semibold" aria-hidden="true">{flag}</code>
                  <span class="text-xs truncate">{label}</span>
                </label>
              )}
            </For>
          </div>
        </fieldset>
      </div>
    </TextField>
  )
}
