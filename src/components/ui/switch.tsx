import * as SwitchPrimitive from '@kobalte/core/switch'
import { cls } from 'cls-variant'
import { splitProps } from 'solid-js'

interface SwitchProps extends Omit<SwitchPrimitive.SwitchRootOptions, 'children'> {
  text: string
  class?: string
}

export function Switch(props: SwitchProps) {
  const [local, rest] = splitProps(props, ['text', 'class'])
  return (
    <SwitchPrimitive.Root class={cls('inline-flex items-center', props.class)} {...rest}>
      <SwitchPrimitive.Input class="peer" />
      <SwitchPrimitive.Control class="b-(2 transparent) rounded-full bg-muted inline-flex shrink-0 h-5 w-9 cursor-pointer transition items-center peer-focus-visible:effect-fv data-[checked]:bg-primary data-[disabled]:effect-dis">
        <SwitchPrimitive.Thumb class="rounded-full bg-background size-4 block pointer-events-none ring-0 shadow-lg translate-x-0 transition-transform data-[checked]:translate-x-4" />
      </SwitchPrimitive.Control>
      <SwitchPrimitive.Label class="text-sm leading-5 font-500 ps-2 h-5 select-none data-[disabled]:effect-dis">{local.text}</SwitchPrimitive.Label>
    </SwitchPrimitive.Root>
  )
}
