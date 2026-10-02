import { useCurrentMatches } from '@solidjs/router'
import { Icon } from 'moraine'
import type { FileRouteInfo } from 'solid-file-router'
import type { ParentProps } from 'solid-js'
import { createMemo, For, Show } from 'solid-js'

export function ToolLayout(props: ParentProps) {
  const matches = useCurrentMatches()
  const tool = createMemo(() => matches().at(-1)?.route.info as FileRouteInfo | undefined)

  return (
    <div class="mx-auto max-w-7xl min-w-0 w-full">
      <Show when={tool()?.title}>
        <header class="mb-8 space-y-3">
          <div class="flex gap-3 items-start sm:items-center">
            <div class="border border-border bg-muted/50 shrink-0 grid size-10 place-items-center rounded-lg">
              <Icon name={tool()?.icon as any} class="text-foreground size-5" />
            </div>
            <h1 class="text-foreground leading-tight tracking-tight font-semibold text-2xl sm:text-3xl">
              {tool()?.title}
            </h1>
          </div>
          <p class="text-muted-foreground leading-relaxed max-w-70ch text-sm sm:text-base">
            {tool()?.description}
          </p>
          <div class="text-muted-foreground flex flex-wrap gap-2 items-center text-xs">
            <span class="font-medium">{tool()?.category}</span>
            <For each={tool()?.tags}>
              {(tag) => <span class="px-2 py-0.5 rounded bg-muted/60">{tag}</span>}
            </For>
          </div>
        </header>
      </Show>
      {props.children}
    </div>
  )
}
