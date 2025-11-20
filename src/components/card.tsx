import type { JSXElement } from 'solid-js'

import { cls } from 'cls-variant'
import { Show } from 'solid-js'

import Icon from './ui/icon'

type CardProps = {
  class?: string
  title: string
  icon?: string
  description?: string
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
