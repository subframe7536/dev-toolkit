import type { JSXElement } from 'solid-js'

import { cls } from 'cls-variant'
import { For, Show } from 'solid-js'

import Icon from './ui/icon'

type CardProps = {
  class?: string
  title: string
  icon?: string
  description?: string
  tags?: string[]
  content?: JSXElement
  footer?: JSXElement
}

export function Card(props: CardProps) {
  return (
    <div
      class={cls('rounded-lg b-(1 border) bg-card text-card-foreground shadow-sm', props.class)}
    >
      <div class="p-6 flex flex-col gap-2">
        <div class="flex gap-2 items-center">
          <Show when={props.icon}>
            <Icon name={props.icon as `lucide:${string}`} class="text-muted-foreground size-6" />
          </Show>
          <h3 class="text-lg leading-none tracking-tight font-semibold">{props.title}</h3>
        </div>
        <Show when={props.description}>
          <p class="text-sm text-muted-foreground">
            {props.description}
          </p>
        </Show>
        <Show when={props.tags && props.tags.length > 0}>
          <div class="flex gap-1.5 flex-wrap">
            <For each={props.tags}>
              {tag => (
                <span class="text-xs text-muted-foreground px-1.5 py-0.5 border border-border/50 rounded bg-muted/20">
                  {tag}
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>
      <Show when={props.content}>
        <div class="p-6 pt-0">{props.content}</div>
      </Show>
      <Show when={props.footer}>
        <div class="p-6 pt-0 flex items-center">
          {props.footer}
        </div>
      </Show>
    </div>
  )
}
