import { A } from '@solidjs/router'
import { Icon } from 'moraine'
import { createRoute } from 'solid-file-router'
import { For } from 'solid-js'

import { getCategories } from '#/utils/routes'

export default createRoute({ component: Index })

function Index() {
  const { categories } = getCategories()
  return (
    <div class="min-w-0 w-full">
      <header class="px-4 py-8 border-b border-border/70 sm:(px-6 py-10)">
        <h1 class="text-foreground leading-tight tracking-tight font-semibold text-3xl sm:text-4xl">
          Developer Toolkit
        </h1>
        <p class="text-muted-foreground leading-6 mt-3 text-sm sm:text-base">
          Fast, local utilities for everyday development.
        </p>
      </header>
      <For each={categories}>
        {(category) => (
          <section class="px-4 py-6 border-b border-border/70 sm:(px-6 py-8) last:border-b-0">
            <h2 class="text-muted-foreground tracking-wide font-medium mb-4 uppercase text-xs">
              {category.name}
            </h2>
            <div class="gap-3 grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2">
              <For each={category.tools}>
                {(tool) => (
                  <A
                    href={tool.path}
                    class="group px-5 py-5 border border-border bg-card flex flex-col gap-1.5 min-w-0 transition-colors justify-center rounded-lg sm:px-6 focus-visible:effect-fv hover:(border-foreground/30 bg-muted/40)"
                  >
                    <h3 class="text-foreground leading-5 font-medium flex gap-2 items-center text-sm">
                      <Icon name={tool.info.icon} class="text-muted-foreground shrink-0 size-4" />
                      <span>{tool.info.title}</span>
                    </h3>
                    <p class="text-muted-foreground leading-5 line-clamp-2 text-sm">
                      {tool.info.description}
                    </p>
                  </A>
                )}
              </For>
            </div>
          </section>
        )}
      </For>
    </div>
  )
}
