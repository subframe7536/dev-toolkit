import { Card as MoraineCard, cn, Icon } from 'moraine'
import type { JSXElement } from 'solid-js'
import { Show } from 'solid-js'

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
    <MoraineCard
      title={
        <div class="flex gap-2 items-center">
          <Show when={props.icon}>
            <span class="border border-border rounded-md bg-muted/40 grid size-8 transition-colors place-items-center group-hover:text-primary group-hover:bg-primary/10">
              <Icon name={props.icon as any} class="size-4.5" />
            </span>
          </Show>
          <span>{props.title}</span>
        </div>
      }
      description={props.description}
      footer={props.footer}
      classes={{
        root: cn(
          'group border border-border/80 shadow-sm transition-(colors shadow transform) duration-180 ease-out hover:(border-primary/35 bg-card/95 shadow-md -translate-y-0.5)',
          props.class,
        ),
        title: 'text-lg leading-tight tracking-tight font-semibold',
        description: 'text-sm leading-6',
        body: 'pt-4',
      }}
    >
      {props.content}
    </MoraineCard>
  )
}
