import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import type { ValidComponent } from 'solid-js'
import type { Component } from 'solid-js'

import * as TooltipPrimitive from '@kobalte/core/tooltip'
import { cls } from 'cls-variant'
import { splitProps } from 'solid-js'

const TooltipTrigger = TooltipPrimitive.Trigger

const Tooltip: Component<TooltipPrimitive.TooltipRootProps> = (props) => {
  return <TooltipPrimitive.Root gutter={4} {...props} />
}

type TooltipContentProps<T extends ValidComponent = 'div'> =
  TooltipPrimitive.TooltipContentProps<T> & { class?: string | undefined }

function TooltipContent<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, TooltipContentProps<T>>) {
  const [local, others] = splitProps(props as TooltipContentProps, ['class'])
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        class={cls(
          'z-50 origin-$kb-tooltip-content-transform-origin overflow-hidden rounded-md border bg-background/80 px-3 py-1.5 text-sm text-foreground/80 shadow-md animate-in fade-in-0 zoom-in-95',
          local.class,
        )}
        {...others}
      />
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipTrigger }
