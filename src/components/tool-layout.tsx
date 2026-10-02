import { useCurrentMatches } from '@solidjs/router'
import { Icon } from 'moraine'
import type { FileRouteInfo } from 'solid-file-router'
import type { ParentProps } from 'solid-js'
import { createMemo, Show } from 'solid-js'

export function ToolLayout(props: ParentProps) {
  const matches = useCurrentMatches()
  const tool = createMemo(() => matches().at(-1)?.route.info as FileRouteInfo | undefined)

  return (
    <div class="mx-auto max-w-7xl min-w-0 w-full">
      <Show when={tool()?.title}>
        <header class="mb-4 pb-4 border-b border-border/60 flex gap-3 items-start">
          <div class="text-muted-foreground bg-muted/50 shrink-0 grid size-8 place-items-center rounded-md">
            <Icon name={tool()?.icon as any} class="size-4" />
          </div>
          <div class="min-w-0">
            <h1 class="text-foreground leading-tight tracking-tight font-semibold text-lg sm:text-xl">
              {tool()?.title}
            </h1>
            <p class="text-muted-foreground leading-5 mt-1 max-w-90ch text-sm">
              {tool()?.description}
            </p>
          </div>
        </header>
      </Show>
      {props.children}
    </div>
  )
}
