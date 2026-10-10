import { Dialog, Icon, Popover } from 'moraine'
import type { HighlighterCore } from 'shiki'
import { createEffect, createMemo, createResource, For, on, Show, Suspense } from 'solid-js'
import { toast } from 'solid-toaster'

import { HelpPanel } from '#/components/regex-tester/help-panel'
import { useRegexContext } from '#/contexts/regex-context'
import { useTheme } from '#/contexts/theme-context'
import { generateDebugSteps } from '#/utils/regex/debug-engine'
import { flagsToString } from '#/utils/regex/match-engine'

const FLAG_OPTIONS = [
  { flag: 'g', label: 'Global', key: 'global', description: 'Find all matches' },
  { flag: 'i', label: 'Case Insensitive', key: 'ignoreCase', description: 'Ignore case' },
  { flag: 'm', label: 'Multiline', key: 'multiline', description: '^ and $ match line boundaries' },
  { flag: 's', label: 'Dot All', key: 'dotAll', description: '. matches newlines' },
  { flag: 'u', label: 'Unicode', key: 'unicode', description: 'Full Unicode support' },
  { flag: 'y', label: 'Sticky', key: 'sticky', description: 'Match at current position only' },
] as const

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
      const content = match ? match[1] : props.pattern
      return props.pattern.endsWith('\n') ? `${content} ` : content
    } catch {
      return props.pattern
    }
  })

  return (
    <Show when={html()} fallback={<span class="text-transparent">{props.pattern || ' '}</span>}>
      {/* oxlint-disable-next-line subf/solid-no-innerhtml */}
      <span innerHTML={html()} />
    </Show>
  )
}

// Format execution time for display
function formatExecutionTime(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)} μs`
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)} ms`
  }
  return `${(ms / 1000).toFixed(2)} s`
}

export function RegexInputPanel() {
  const { store, actions } = useRegexContext()

  let patternRef!: HTMLTextAreaElement
  let patternMirrorRef!: HTMLDivElement

  const [highlighter] = createResource(loadHighlighter)
  const { isDark } = useTheme()

  const hasInput = createMemo(() => Boolean(store.pattern && store.testText))
  const flagString = createMemo(() => flagsToString(store.flags))

  const debugStepsCount = createMemo(() => {
    if (!store.pattern || !store.testText || !store.isValid) {
      return 0
    }
    try {
      const session = generateDebugSteps(store.pattern, store.flags, store.testText)
      return session.steps.length
    } catch {
      return 0
    }
  })

  // Auto-resize pattern textarea
  const autoResizePattern = () => {
    if (patternRef) {
      patternRef.style.height = 'auto'
      patternRef.style.height = `${patternRef.scrollHeight}px`
      if (patternMirrorRef) {
        patternMirrorRef.style.height = `${patternRef.scrollHeight}px`
      }
    }
  }

  createEffect(
    on(
      () => store.pattern,
      () => {
        requestAnimationFrame(autoResizePattern)
      },
    ),
  )

  const handleCopyRegex = async () => {
    const fullRegex = `/${store.pattern}/${flagString()}`
    await navigator.clipboard.writeText(fullRegex)
    toast.success('Regular expression copied to clipboard')
  }

  return (
    <div class="flex flex-col gap-1.5" role="region" aria-label="Regular Expression">
      {/* Header bar outside card */}
      <div class="flex items-center justify-between">
        <span class="text-sm text-foreground font-medium">Regular Expression</span>
        <div class="flex gap-1.5 items-center">
          <Show when={hasInput()}>
            <span class="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded bg-muted/70">
              {store.matches.length} {store.matches.length === 1 ? 'match' : 'matches'}
            </span>
          </Show>
          <Show when={debugStepsCount() > 0}>
            <span class="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded bg-muted/70">
              {debugStepsCount()} steps
            </span>
          </Show>
          <Show when={hasInput() && store.executionTime > 0}>
            <span class="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded bg-muted/70">
              {formatExecutionTime(store.executionTime)}
            </span>
          </Show>
          {/* Reference Info Dialog */}
          <Dialog classes={{ content: 'max-h-[60vh] max-w-4xl overflow-y-auto' }}>
            <Dialog.Trigger
              as="button"
              type="button"
              class="text-muted-foreground p-0.5 rounded cursor-pointer transition-colors hover:text-foreground"
              title="Regex Syntax Reference"
            >
              <Icon name="i-lucide-info" class="size-4" />
            </Dialog.Trigger>
            <Dialog.Content title="Regex Syntax Reference">
              <Dialog.Body>
                <HelpPanel />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog>
        </div>
      </div>

      {/* Enclosed Card */}
      <div class="px-2 py-1.5 border border-border rounded-lg bg-card/60 flex gap-1 items-start focus-within:(border-primary ring-1 ring-primary)">
        {/* Left delimiter: : / */}
        <div class="text-sm text-muted-foreground leading-6 font-mono py-1 pl-1 flex shrink-0 select-none items-center">
          <span class="text-muted-foreground font-semibold">/</span>
        </div>

        {/* Pattern input with Shiki highlighting */}
        <div class="flex-1 min-w-0 relative">
          {/* Mirror div for syntax highlighting */}
          <div
            ref={(element) => (patternMirrorRef = element)}
            class="text-sm leading-6 font-mono m-0 p-1 border-0 pointer-events-none select-none whitespace-pre-wrap break-all inset-0 absolute z-0 overflow-hidden"
            aria-hidden="true"
          >
            <Suspense fallback={<span class="text-transparent">{store.pattern || ' '}</span>}>
              <Show when={highlighter()}>
                {(hl) => (
                  <PatternHighlight pattern={store.pattern} highlighter={hl()} isDark={isDark()} />
                )}
              </Show>
            </Suspense>
          </div>
          {/* Textarea */}
          <textarea
            ref={(element) => (patternRef = element)}
            placeholder="test(.*)"
            class="text-sm text-transparent leading-6 font-mono m-0 p-1 outline-none caret-foreground border-0 bg-transparent w-full block resize-none break-all relative z-10 overflow-hidden selection:(text-transparent bg-primary/30)"
            rows={1}
            value={store.pattern}
            onInput={(e) => {
              actions.setPattern(e.currentTarget.value)
              autoResizePattern()
            }}
            aria-invalid={!store.isValid}
          />
        </div>

        {/* Right suffix: / flags and copy */}
        <div class="leading-6 py-1 flex shrink-0 gap-1 select-none items-center">
          <span class="text-sm text-muted-foreground font-mono font-semibold">/</span>
          {/* Flags Popover */}
          <Popover placement="bottom" align="end">
            <Popover.Trigger
              as="button"
              type="button"
              class="text-sm text-primary font-medium font-mono px-1 py-0.5 rounded flex gap-0.5 cursor-pointer transition-colors items-center hover:bg-muted/80"
              title="Edit regex flags"
            >
              {flagString() || <span class="text-muted-foreground/50">none</span>}
            </Popover.Trigger>
            <Popover.Content
              classes={{
                content:
                  'w-60 p-2 bg-popover border border-border shadow-md rounded-lg text-xs space-y-1 z-50',
              }}
            >
              <div class="text-foreground font-semibold mb-1 px-2 py-1 border-b border-border/50 flex items-center justify-between">
                <span>Regex Flags</span>
                <span class="text-primary font-mono font-normal">/{flagString()}</span>
              </div>
              <For each={FLAG_OPTIONS}>
                {(option) => (
                  <label class="px-2 py-1.5 rounded flex cursor-pointer select-none items-center justify-between hover:bg-muted/50">
                    <div class="flex gap-2 items-center">
                      <span class="text-primary font-bold font-mono w-3">{option.flag}</span>
                      <span class="text-foreground">{option.label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(store.flags[option.key])}
                      onChange={(e) => actions.setFlags({ [option.key]: e.currentTarget.checked })}
                      class="accent-primary"
                    />
                  </label>
                )}
              </For>
            </Popover.Content>
          </Popover>

          {/* Copy Button */}
          <button
            type="button"
            class="text-muted-foreground p-1 rounded cursor-pointer transition-colors hover:text-foreground"
            title="Copy regular expression"
            onClick={handleCopyRegex}
          >
            <Icon name="i-lucide-copy" class="size-4" />
          </button>
        </div>
      </div>

      {/* Parse Error */}
      <Show when={store.parseError}>
        <div class="text-xs text-destructive mt-0.5 flex gap-1.5 items-center" role="alert">
          <Icon name="i-lucide-circle-alert" class="size-3.5" />
          <span>{store.parseError?.message}</span>
        </div>
      </Show>
    </div>
  )
}
