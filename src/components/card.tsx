import { Card as MoraineCard, Icon } from 'moraine'
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
      classes={{
        root: ['group min-w-0 border border-border rounded-xl', props.class],
        title: 'text-lg leading-snug font-semibold',
        description: 'text-muted-foreground text-sm leading-6 max-w-68ch',
        header: 'p-4 pb-0 sm:p-5 sm:pb-0',
        body: 'p-4 pt-4 sm:p-5 sm:pt-4',
        footer: 'p-4 pt-0 sm:p-5 sm:pt-0',
      }}
    >
      <MoraineCard.Header>
        <MoraineCard.Title>
          <div class="flex gap-2 items-center">
            <Show when={props.icon}>
              <span class="text-muted-foreground bg-muted shrink-0 grid size-8 transition-colors place-items-center rounded-md group-hover:text-primary">
                <Icon name={props.icon as any} class="size-4.5" />
              </span>
            </Show>
            <span>{props.title}</span>
          </div>
        </MoraineCard.Title>
        <Show when={props.description}>
          <MoraineCard.Description>{props.description}</MoraineCard.Description>
        </Show>
      </MoraineCard.Header>
      <Show when={props.content}>
        <MoraineCard.Body>{props.content}</MoraineCard.Body>
      </Show>
      <Show when={props.footer}>
        <MoraineCard.Footer>{props.footer}</MoraineCard.Footer>
      </Show>
    </MoraineCard>
  )
}
