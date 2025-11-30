import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX, ValidComponent } from 'solid-js'

import * as SelectPrimitive from '@kobalte/core/select'
import { cls, clsv, clsvDefault } from 'cls-variant'
import { splitProps } from 'solid-js'

import Icon from './icon'

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value
const SelectHiddenSelect = SelectPrimitive.HiddenSelect

type SelectTriggerProps<T extends ValidComponent = 'button'> =
  SelectPrimitive.SelectTriggerProps<T> & {
    class?: string | undefined
    children?: JSX.Element
  }

function SelectTrigger<T extends ValidComponent = 'button'>(props: PolymorphicProps<T, SelectTriggerProps<T>>) {
  const [local, others] = splitProps(props as SelectTriggerProps, ['class', 'children'])
  return (
    <SelectPrimitive.Trigger
      class={cls(
        'flex h-8 w-full items-center justify-between rounded-md b-(1 border) bg-input px-3 pl-2 pr-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:effect-fv disabled:effect-dis',
        local.class,
      )}
      {...others}
    >
      {local.children}
      <Icon name="lucide:chevrons-up-down" />
    </SelectPrimitive.Trigger>
  )
}

type SelectContentProps<T extends ValidComponent = 'div'> =
  SelectPrimitive.SelectContentProps<T> & { class?: string | undefined }

function SelectContent<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, SelectContentProps<T>>) {
  const [local, others] = splitProps(props as SelectContentProps, ['class'])
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        class={cls(
          'relative z-50 min-w-32 overflow-hidden rounded-md b-(1 border) bg-popover text-popover-foreground shadow-md animate-in fade-in-80',
          local.class,
        )}
        {...others}
      >
        <SelectPrimitive.Listbox class="m-0 p-1" />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

type SelectItemProps<T extends ValidComponent = 'li'> = SelectPrimitive.SelectItemProps<T> & {
  class?: string | undefined
  children?: JSX.Element
}

function SelectItem<T extends ValidComponent = 'li'>(props: PolymorphicProps<T, SelectItemProps<T>>) {
  const [local, others] = splitProps(props as SelectItemProps, ['class', 'children'])
  return (
    <SelectPrimitive.Item
      class={cls(
        'relative mt-0 flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:effect-dis',
        local.class,
      )}
      {...others}
    >
      <SelectPrimitive.ItemIndicator class="flex size-3.5 items-center right-2 justify-center absolute">
        <Icon name="lucide:check" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemLabel>{local.children}</SelectPrimitive.ItemLabel>
    </SelectPrimitive.Item>
  )
}

const labelVariants = clsvDefault(
  clsv(
    'text-sm font-medium leading-none peer-disabled:effect-dis',
    {
      variant: {
        label: 'data-[invalid]:text-destructive',
        description: 'font-normal text-muted-foreground',
        error: 'text-xs text-destructive',
      },
    },
  ),
  {
    variant: 'label',
  },
)

type SelectLabelProps<T extends ValidComponent = 'label'> = SelectPrimitive.SelectLabelProps<T> & {
  class?: string | undefined
}

function SelectLabel<T extends ValidComponent = 'label'>(props: PolymorphicProps<T, SelectLabelProps<T>>) {
  const [local, others] = splitProps(props as SelectLabelProps, ['class'])
  return <SelectPrimitive.Label class={cls(labelVariants(), local.class)} {...others} />
}

type SelectDescriptionProps<T extends ValidComponent = 'div'> =
  SelectPrimitive.SelectDescriptionProps<T> & {
    class?: string | undefined
  }

function SelectDescription<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, SelectDescriptionProps<T>>) {
  const [local, others] = splitProps(props as SelectDescriptionProps, ['class'])
  return (
    <SelectPrimitive.Description
      class={cls(labelVariants({ variant: 'description' }), local.class)}
      {...others}
    />
  )
}

type SelectErrorMessageProps<T extends ValidComponent = 'div'> =
  SelectPrimitive.SelectErrorMessageProps<T> & {
    class?: string | undefined
  }

function SelectErrorMessage<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, SelectErrorMessageProps<T>>) {
  const [local, others] = splitProps(props as SelectErrorMessageProps, ['class'])
  return (
    <SelectPrimitive.ErrorMessage
      class={cls(labelVariants({ variant: 'error' }), local.class)}
      {...others}
    />
  )
}

export {
  Select,
  SelectContent,
  SelectDescription,
  SelectErrorMessage,
  SelectHiddenSelect,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
}
