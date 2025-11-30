import * as CheckboxPrimitive from '@kobalte/core/checkbox'
import { Show, splitProps } from 'solid-js'

import Icon from './icon'

export const CheckboxLabel = CheckboxPrimitive.Label
export const CheckboxErrorMessage = CheckboxPrimitive.ErrorMessage
export const CheckboxDescription = CheckboxPrimitive.Description

interface CheckboxProps extends CheckboxPrimitive.CheckboxRootOptions {
  class?: string
  text?: string
}

export function Checkbox(props: CheckboxProps) {
  const [local, rest] = splitProps(props, [
    'text',
  ])

  return (
    <CheckboxPrimitive.Root {...rest}>
      <CheckboxPrimitive.Input class="[&:focus-visible+div]:effect-fv" />
      <CheckboxPrimitive.Control
        class="border border-primary rounded-sm shrink-0 size-4 shadow transition-shadow data-[checked]:(text-primary-foreground bg-primary) data-[disabled]:effect-dis"
      >
        <CheckboxPrimitive.Indicator class="text-current flex items-center justify-center">
          <Icon name="lucide:check" class="size-4" title="Checkbox" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Control>
      <Show when={local.text}>
        <CheckboxPrimitive.Label>{local.text}</CheckboxPrimitive.Label>
      </Show>
    </CheckboxPrimitive.Root>
  )
}
