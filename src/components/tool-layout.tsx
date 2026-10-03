import { useCurrentMatches } from '@solidjs/router'
import { Icon } from 'moraine'
import type { FileRouteInfo } from 'solid-file-router'
import type { ParentProps } from 'solid-js'
import { createMemo, Show } from 'solid-js'

export function ToolLayout(props: ParentProps) {
  const matches = useCurrentMatches()
  const tool = createMemo(() => matches().at(-1)?.route.info as FileRouteInfo | undefined)

  return (
    <div class={tool()?.title ? 'px-4 py-6 min-w-0 w-full sm:(px-6 py-8)' : 'min-w-0 w-full'}>
      <Show when={tool()?.title}>
        <header class="mb-6 flex gap-3 items-start">
          <div class="text-muted-foreground mt-1 shrink-0">
            <Icon name={tool()?.icon as any} class="size-5" />
          </div>
          <div class="min-w-0">
            <h1 class="text-foreground leading-tight tracking-tight font-semibold text-xl sm:text-2xl">
              {tool()?.title}
            </h1>
            <p class="text-muted-foreground leading-5 mt-1 max-w-90ch text-sm">
              {tool()?.description}
            </p>
          </div>
        </header>
      </Show>
      <div class={tool()?.title ? 'tool-workbench' : undefined}>{props.children}</div>
    </div>
  )
}
