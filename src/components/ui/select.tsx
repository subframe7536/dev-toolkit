import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX, ValidComponent } from 'solid-js'

import * as SelectPrimitive from '@kobalte/core/select'
import { cls, clsv, clsvDefault } from 'cls-variant'
import { createMemo, Show, splitProps } from 'solid-js'

import Icon from './icon'

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value
const SelectHiddenSelect = SelectPrimitive.HiddenSelect

type SelectTriggerProps<T extends ValidComponent = 'button'> =
  SelectPrimitive.SelectTriggerProps<T> & {
    noIcon?: boolean
    class?: string | undefined
    children?: JSX.Element
  }

function SelectTrigger<T extends ValidComponent = 'button'>(props: PolymorphicProps<T, SelectTriggerProps<T>>) {
  const [local, others] = splitProps(props as SelectTriggerProps, ['noIcon', 'class', 'children'])
  return (
    <SelectPrimitive.Trigger
      class={cls(
        'flex h-8 w-full items-center justify-between rounded-md b-(1 border) bg-input px-3 pl-2 pr-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:effect-fv disabled:effect-dis',
        local.class,
      )}
      {...others}
    >
      {local.children}
      <Show when={!props.noIcon}>
        <Icon name="lucide:chevron-down" />
      </Show>
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
        <SelectPrimitive.Listbox class="m-0 p-1 focus-visible:outline-none" />
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

// Unified Select Component
type UnifiedSelectProps<T = string> = {
  options: Array<Record<string, any>>
  value?: T | T[]
  onChange?: (value: T | T[]) => void
  placeholder?: string
  multiple?: boolean
  searchable?: boolean
  disabled?: boolean
  disallowEmptySelection?: boolean
  class?: string
  renderItem?: (option: Record<string, any>, index: number) => JSX.Element
  renderValue?: (selected: any, options: Array<Record<string, any>>) => JSX.Element
}

function SimpleSelect<T extends string = string>(props: UnifiedSelectProps<T>) {
  const isMultiple = createMemo(() => props.multiple || Array.isArray(props.value))

  const handleValueChange = (newValue: string | string[]) => {
    if (!isMultiple() && Array.isArray(newValue)) {
      // For single select, take first value
      props.onChange?.(newValue[0] as T)
    } else {
      props.onChange?.(newValue as T | T[])
    }
  }

  const getValue = createMemo(() => {
    if (Array.isArray(props.value)) {
      return props.value
    }
    return props.value ? [props.value] : []
  })

  const selectedOptions = createMemo(() => {
    const currentValue = getValue()
    return props.options.filter(option =>
      currentValue.includes(option.value),
    )
  })

  const renderDefaultValue = () => {
    const selected = selectedOptions()
    if (selected.length === 0) {
      return props.placeholder || 'Select...'
    }

    if (isMultiple()) {
      if (selected.length === props.options.length) {
        return 'All'
      }
      if (selected.length === 0) {
        return 'None'
      }
      return `${selected.length} selected`
    }

    return selected[0]?.label || props.placeholder
  }

  return (
    <Select<T>
      value={props.value as any}
      onChange={handleValueChange as any}
      options={props.options.map(option => option.value)}
      disabled={props.disabled}
      class={props.class}
      itemComponent={(itemProps) => {
        const option = props.options.find(opt => opt.value === itemProps.item.rawValue)
        if (!option) {
          return null
        }

        if (props.renderItem) {
          // renderItem expects (option, index)
          return props.renderItem(option, props.options.indexOf(option))
        }

        // Default SelectItem
        return (
          <SelectItem item={itemProps.item}>
            {option.label}
          </SelectItem>
        )
      }}
    >
      <SelectTrigger>
        <SelectValue>
          <Show when={props.renderValue} fallback={renderDefaultValue()}>
            {props.renderValue!(selectedOptions(), props.options)}
          </Show>
        </SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
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
  SimpleSelect,
}
