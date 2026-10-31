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
      <header class="px-4 py-10 border-b border-border/70 sm:(px-6 py-14)">
        <h1 class="text-3xl text-foreground leading-tight tracking-tight font-semibold sm:text-4xl">
          Developer Toolkit
        </h1>
        <p class="text-sm text-muted-foreground leading-6 mt-3 max-w-60ch sm:text-base">
          Fast, local utilities for everyday development.
        </p>
      </header>
      <For each={categories}>
        {(category) => (
          <section
            class="px-4 py-6 border-b border-border/70 sm:(px-6 py-8) last:border-b-0"
            aria-labelledby={`category-${category.name}`}
          >
            <h2
              id={`category-${category.name}`}
              class="text-xs text-muted-foreground tracking-wider font-semibold mb-4 uppercase"
            >
              {category.name}
            </h2>
            <div class="gap-3 grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2">
              <For each={category.tools}>
                {(tool) => (
                  <A
                    href={tool.path}
                    class="group px-5 py-4 border border-border rounded-lg bg-card flex flex-col gap-1.5 min-h-24 min-w-0 transition-[border-color,background-color,transform] duration-150 ease-out justify-center sm:px-6 focus-visible:effect-fv hover:(border-foreground/30 bg-muted/40 -translate-y-px) active:translate-y-0 motion-reduce:(transform-none transition-none)"
                  >
                    <h3 class="text-sm text-foreground leading-5 font-medium flex gap-2 items-center">
                      <Icon name={tool.info.icon} class="text-muted-foreground shrink-0 size-4" />
                      <span class="flex-1 min-w-0">{tool.info.title}</span>
                      <Icon
                        name="i-lucide-arrow-right"
                        class="text-muted-foreground opacity-0 shrink-0 size-3.5 transition-opacity group-focus-visible:opacity-100 group-hover:opacity-100"
                      />
                    </h3>
                    <p class="text-sm text-muted-foreground leading-5 line-clamp-2">
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
