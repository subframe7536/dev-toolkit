import type { Component, ComponentProps, JSXElement } from 'solid-js'

import { cls } from 'cls-variant'
import { Show, splitProps } from 'solid-js'

type CardProps = {
  class?: string
  title: string
  description?: string
  content: JSXElement
  footer?: JSXElement
}

export function Card(props: CardProps) {
  return (
    <div
      class={cls('rounded-lg b-(1 border) bg-card text-card-foreground shadow-sm', props.class)}
    >
      <div class="p-6 flex flex-col gap-1.5">
        <h3 class="text-lg leading-none tracking-tight font-semibold">{props.title}</h3>
        <Show when={props.description}>
          <p class="text-sm text-muted-foreground">
            {props.description}
          </p>
        </Show>
      </div>
      <div class="p-6 pt-0">{props.content}</div>
      <Show when={props.footer}>
        <div class="p-6 pt-0 flex items-center">
          {props.footer}
        </div>
      </Show>
    </div>
  )
}
