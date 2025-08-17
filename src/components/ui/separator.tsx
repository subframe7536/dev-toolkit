import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import type { ValidComponent } from 'solid-js'

import * as SeparatorPrimitive from '@kobalte/core/separator'
import { cls } from 'cls-variant'
import { splitProps } from 'solid-js'

type SeparatorRootProps<T extends ValidComponent = 'hr'>
  = SeparatorPrimitive.SeparatorRootProps<T> & { class?: string | undefined }

function Separator<T extends ValidComponent = 'hr'>(props: PolymorphicProps<T, SeparatorRootProps<T>>) {
  const [local, others] = splitProps(props as SeparatorRootProps, ['class', 'orientation'])
  return (
    <SeparatorPrimitive.Root
      orientation={local.orientation ?? 'horizontal'}
      class={cls(
        'shrink-0 bg-border',
        local.orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        local.class,
      )}
      {...others}
    />
  )
}

export { Separator }
