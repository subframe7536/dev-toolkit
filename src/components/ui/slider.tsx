import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import type { ValidComponent } from 'solid-js'

import * as SliderPrimitive from '@kobalte/core/slider'
import { cls } from 'cls-variant'
import { splitProps } from 'solid-js'

import { Label } from './label'

type SliderRootProps<T extends ValidComponent = 'div'> = SliderPrimitive.SliderRootProps<T> & {
  class?: string
  label: string
}

function Slider<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, SliderRootProps<T>>) {
  const [local, others] = splitProps(props as SliderRootProps, ['class', 'label'])
  return (
    <SliderPrimitive.Root
      class={cls('relative flex gap-3 w-full touch-none select-none flex-col items-center', local.class)}
      {...others}
    >
      <div class="flex w-full justify-between">
        <SliderPrimitive.Label as={Label}>{local.label}</SliderPrimitive.Label>
        <SliderPrimitive.ValueLabel as={Label} />
      </div>
      <SliderPrimitive.Track class="rounded-full bg-primary/50 grow h-2 w-full relative">
        <SliderPrimitive.Fill class="rounded-full bg-primary h-full absolute" />
        <SliderPrimitive.Thumb class="b-(2 secondary) rounded-full bg-background size-5 block transition-colors top--6px focus-visible:effect-fv disabled:effect-dis">
          <SliderPrimitive.Input />
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Track>
    </SliderPrimitive.Root>
  )
}

export { Slider }
