import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js'

import * as DropdownMenuPrimitive from '@kobalte/core/dropdown-menu'
import { cls } from 'cls-variant'
import { splitProps } from 'solid-js'

import Icon from './icon'

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenu: Component<DropdownMenuPrimitive.DropdownMenuRootProps> = (props) => {
  return <DropdownMenuPrimitive.Root gutter={4} {...props} />
}

type DropdownMenuContentProps<T extends ValidComponent = 'div'>
  = DropdownMenuPrimitive.DropdownMenuContentProps<T> & {
    class?: string | undefined
  }

function DropdownMenuContent<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, DropdownMenuContentProps<T>>) {
  const [, rest] = splitProps(props as DropdownMenuContentProps, ['class'])
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        class={cls(
          'z-50 min-w-32 origin-[var(--kb-menu-content-transform-origin)] animate-content-hide overflow-hidden rounded-md b-(1 border) bg-popover p-1 text-popover-foreground shadow-md data-[expanded]:animate-content-show',
          props.class,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

type DropdownMenuItemProps<T extends ValidComponent = 'div'>
  = DropdownMenuPrimitive.DropdownMenuItemProps<T> & {
    class?: string | undefined
  }

function DropdownMenuItem<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, DropdownMenuItemProps<T>>) {
  const [, rest] = splitProps(props as DropdownMenuItemProps, ['class'])
  return (
    <DropdownMenuPrimitive.Item
      class={cls(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:(bg-accent text-accent-foreground) data-[disabled]:effect-dis',
        props.class,
      )}
      {...rest}
    />
  )
}

const DropdownMenuShortcut: Component<ComponentProps<'span'>> = (props) => {
  const [, rest] = splitProps(props, ['class'])
  return <span class={cls('ml-auto text-xs tracking-widest opacity-60', props.class)} {...rest} />
}

const DropdownMenuLabel: Component<ComponentProps<'div'> & { inset?: boolean }> = (props) => {
  const [, rest] = splitProps(props, ['class', 'inset'])
  return (
    <div
      class={cls('px-2 py-1.5 text-sm font-semibold', props.inset && 'pl-8', props.class)}
      {...rest}
    />
  )
}

type DropdownMenuSeparatorProps<T extends ValidComponent = 'hr'>
  = DropdownMenuPrimitive.DropdownMenuSeparatorProps<T> & {
    class?: string | undefined
  }

function DropdownMenuSeparator<T extends ValidComponent = 'hr'>(props: PolymorphicProps<T, DropdownMenuSeparatorProps<T>>) {
  const [, rest] = splitProps(props as DropdownMenuSeparatorProps, ['class'])
  return (
    <DropdownMenuPrimitive.Separator
      class={cls('-mx-1 my-1 h-px bg-muted', props.class)}
      {...rest}
    />
  )
}

type DropdownMenuSubTriggerProps<T extends ValidComponent = 'div'>
  = DropdownMenuPrimitive.DropdownMenuSubTriggerProps<T> & {
    class?: string | undefined
    children?: JSX.Element
  }

function DropdownMenuSubTrigger<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, DropdownMenuSubTriggerProps<T>>) {
  const [, rest] = splitProps(props as DropdownMenuSubTriggerProps, ['class', 'children'])
  return (
    <DropdownMenuPrimitive.SubTrigger
      class={cls(
        'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
        props.class,
      )}
      {...rest}
    >
      {props.children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="ml-auto size-4"
      >
        <path d="M9 6l6 6l-6 6" />
      </svg>
    </DropdownMenuPrimitive.SubTrigger>
  )
}

type DropdownMenuSubContentProps<T extends ValidComponent = 'div'>
  = DropdownMenuPrimitive.DropdownMenuSubContentProps<T> & {
    class?: string | undefined
  }

function DropdownMenuSubContent<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, DropdownMenuSubContentProps<T>>) {
  const [, rest] = splitProps(props as DropdownMenuSubContentProps, ['class'])
  return (
    <DropdownMenuPrimitive.SubContent
      class={cls(
        'z-50 min-w-32 origin-[var(--kb-menu-content-transform-origin)] overflow-hidden rounded-md b-(1 border) bg-popover p-1 text-popover-foreground shadow-md animate-in',
        props.class,
      )}
      {...rest}
    />
  )
}

type DropdownMenuCheckboxItemProps<T extends ValidComponent = 'div'>
  = DropdownMenuPrimitive.DropdownMenuCheckboxItemProps<T> & {
    class?: string | undefined
    children?: JSX.Element
  }

function DropdownMenuCheckboxItem<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, DropdownMenuCheckboxItemProps<T>>) {
  const [, rest] = splitProps(props as DropdownMenuCheckboxItemProps, ['class', 'children'])
  return (
    <DropdownMenuPrimitive.CheckboxItem
      class={cls(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:(bg-accent text-accent-foreground) data-[disabled]:effect-dis',
        props.class,
      )}
      {...rest}
    >
      <span class="flex size-3.5 items-center left-2 justify-center absolute">
        <DropdownMenuPrimitive.ItemIndicator>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4"
          >
            <path d="M5 12l5 5l10 -10" />
          </svg>
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {props.children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

type DropdownMenuGroupLabelProps<T extends ValidComponent = 'span'>
  = DropdownMenuPrimitive.DropdownMenuGroupLabelProps<T> & {
    class?: string | undefined
  }

function DropdownMenuGroupLabel<T extends ValidComponent = 'span'>(props: PolymorphicProps<T, DropdownMenuGroupLabelProps<T>>) {
  const [, rest] = splitProps(props as DropdownMenuGroupLabelProps, ['class'])
  return (
    <DropdownMenuPrimitive.GroupLabel
      class={cls('px-2 py-1.5 text-sm font-semibold', props.class)}
      {...rest}
    />
  )
}

type DropdownMenuRadioItemProps<T extends ValidComponent = 'div'>
  = DropdownMenuPrimitive.DropdownMenuRadioItemProps<T> & {
    class?: string | undefined
    children?: JSX.Element
  }

function DropdownMenuRadioItem<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, DropdownMenuRadioItemProps<T>>) {
  const [, rest] = splitProps(props as DropdownMenuRadioItemProps, ['class', 'children'])
  return (
    <DropdownMenuPrimitive.RadioItem
      class={cls(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-7 pr-2 text-sm outline-none focus:(bg-accent text-accent-foreground) data-[disabled]:effect-dis',
        props.class,
      )}
      {...rest}
    >
      <DropdownMenuPrimitive.ItemIndicator class="leading-none translate-y--50% left-0 top-50% absolute">
        <Icon name="lucide:dot" class="size-8" />
      </DropdownMenuPrimitive.ItemIndicator>
      {props.children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
