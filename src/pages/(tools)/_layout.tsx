import type { FileRouteInfo } from 'solid-file-router'
import type { ParentProps } from 'solid-js'

import Icon from '#/components/ui/icon'
import { useCurrentMatches } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { createEffect, For, Show } from 'solid-js'
import { createStore } from 'solid-js/store'

export default createRoute({
  component: ToolsLayout,
})

function ToolsLayout(props: ParentProps) {
  const matches = useCurrentMatches()
  const [currentTool, setCurrentTool] = createStore<FileRouteInfo>({} as any)

  // Extract route info from the current match
  createEffect(() => {
    const currentMatch = matches().at(-1)
    if (currentMatch?.route?.info) {
      setCurrentTool(currentMatch.route.info)
    } else {
      setCurrentTool({})
    }
  })

  return (
    <>
      <div class="mx-a max-w-400 space-y-2">
        <div class="flex gap-3 items-end">
          <div class="border border-border rounded-lg bg-muted/50 size-8">
            <Icon
              name={currentTool.icon}
              class="text-foreground m-1.5"
            />
          </div>
          <h1 class="text-3xl text-foreground leading-none font-bold">{currentTool.title}</h1>
        </div>
        <p class="text-muted-foreground mt-2">
          {currentTool.description}
        </p>
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-xs text-muted-foreground font-medium px-2 py-0.5 border border-border rounded-md bg-muted/30">
            {currentTool.category}
          </span>
          <Show when={currentTool.tags?.length > 0}>
            <For each={currentTool.tags}>
              {tag => (
                <span class="text-xs text-muted-foreground px-2 py-0.5 border border-border/50 rounded-md bg-muted/20">
                  {tag}
                </span>
              )}
            </For>
          </Show>
        </div>
        <div class="mt-8">
          {props.children}
        </div>
      </div>
    </>
  )
}
