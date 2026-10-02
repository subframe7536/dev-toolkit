import { A } from '@solidjs/router'
import { Icon } from 'moraine'
import { createRoute } from 'solid-file-router'
import { For } from 'solid-js'

import { ToolSearchTrigger } from '#/components/tool-search'
import { getCategories } from '#/utils/routes'

export default createRoute({ component: Index })

function Index() {
  const { categories, count } = getCategories()
  return (
    <div class="flex flex-col gap-4 min-w-0 w-full">
      <div class="flex flex-col gap-3">
        <div>
          <h1 class="text-foreground tracking-tight font-semibold text-xl sm:text-2xl">
            Developer Toolkit
          </h1>
          <p class="text-muted-foreground mt-1 text-sm">
            Fast, local utilities for everyday development.
          </p>
        </div>
        <ToolSearchTrigger prominent />
      </div>
      <div class="flex flex-col gap-4">
        <div class="text-muted-foreground flex items-center justify-between text-xs">
          <span>All tools</span>
          <span>{count} tools · In your browser</span>
        </div>
        <For each={categories}>
          {(category) => (
            <section class="flex flex-col gap-2">
              <h2 class="text-foreground font-semibold text-sm">{category.name}</h2>
              <div class="gap-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                <For each={category.tools}>
                  {(tool) => (
                    <A
                      href={tool.path}
                      class="group p-4 border border-border bg-card flex gap-2.5 min-w-0 transition-colors items-center rounded-lg focus-visible:effect-fv hover:(border-primary/50 bg-muted/40)"
                    >
                      <span class="text-muted-foreground bg-muted/60 shrink-0 grid size-7 place-items-center rounded-md group-hover:text-primary">
                        <Icon name={tool.info.icon} class="size-4" />
                      </span>
                      <div class="min-w-0">
                        <h3 class="text-foreground leading-5 font-medium text-sm">
                          {tool.info.title}
                        </h3>
                        <p class="text-muted-foreground leading-4 mt-0.5 line-clamp-2 text-xs">
                          {tool.info.description}
                        </p>
                      </div>
                    </A>
                  )}
                </For>
              </div>
            </section>
          )}
        </For>
      </div>
    </div>
  )
}
