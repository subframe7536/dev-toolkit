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
            <Icon name={props.icon as any} class="text-muted-foreground size-6" />
          </Show>
          <span>{props.title}</span>
        </div>
      }
      description={props.description}
      footer={props.footer}
      classes={{
        root: cn('shadow-sm', props.class),
        title: 'text-lg leading-none tracking-tight font-semibold',
      }}
    >
      {props.content}
    </MoraineCard>
  )
}
