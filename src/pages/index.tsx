import { Card } from '#/components/card'
import { getCategories } from '#/utils/routes'
import { A } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { For, Show } from 'solid-js'

export default createRoute({
  component: Index,
})

function Index() {
  const { categories, count } = getCategories()
  return (
    <div class="flex flex-col gap-8 items-center">
      <div class="text-center">
        <h1 class="text-4xl text-foreground tracking-tight font-bold sm:text-5xl">
          Developer Toolkit
        </h1>
        <p class="text-lg text-muted-foreground mt-4">
          A collection of
          {' '}
          {count}
          {' '}
          essential tools for developers
        </p>
      </div>

      <div class="flex flex-col gap-12 max-w-7xl w-full">
        <For each={categories}>
          {category => (
            <div class="flex flex-col gap-4">
              <h2 class="text-2xl text-foreground font-semibold">{category.name}</h2>
              <div class="gap-4 grid lg:grid-cols-2 xl:grid-cols-3">
                <For each={category.tools}>
                  {tool => (
                    <A href={tool.path}>
                      <Card
                        title={tool.info.title}
                        icon={tool.info.icon}
                        description={tool.info.description}
                        class="h-full cursor-pointer transition-all hover:shadow-md"
                        content={(
                          <Show when={tool.info.tags?.length}>
                            <div class="flex flex-wrap gap-1.5">
                              <For each={tool.info.tags}>
                                {tag => (
                                  <span class="text-xs text-muted-foreground px-1.5 py-0.5 border border-border/50 rounded bg-muted/20">
                                    {tag}
                                  </span>
                                )}
                              </For>
                            </div>
                          </Show>
                        )}
                      />
                    </A>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>

      <div class="text-lg text-muted-foreground m-(b-12 t-12)">
        More tools coming soon
      </div>

    </div>
  )
}
