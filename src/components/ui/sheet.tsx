import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import type { VariantProps } from 'cls-variant'
import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js'

import * as SheetPrimitive from '@kobalte/core/dialog'
import { cls, clsv, clsvDefault } from 'cls-variant'
import { splitProps } from 'solid-js'

import Icon from './icon'

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.CloseButton

const portalVariants = clsvDefault(
  clsv('fixed inset-0 z-50 flex', {
    position: {
      top: 'items-start',
      bottom: 'items-end',
      left: 'justify-start',
      right: 'justify-end',
    },
  }),
  { position: 'right' },
)

type PortalProps = SheetPrimitive.DialogPortalProps & VariantProps<typeof portalVariants>

const SheetPortal: Component<PortalProps> = (props) => {
  const [local, others] = splitProps(props, ['position', 'children'])
  return (
    <SheetPrimitive.Portal {...others}>
      <div class={portalVariants({ position: local.position })}>{local.children}</div>
    </SheetPrimitive.Portal>
  )
}

type DialogOverlayProps<T extends ValidComponent = 'div'> = SheetPrimitive.DialogOverlayProps<T> & {
  class?: string | undefined
}

function SheetOverlay<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, DialogOverlayProps<T>>) {
  const [local, others] = splitProps(props as DialogOverlayProps, ['class'])
  return (
    <SheetPrimitive.Overlay
      class={cls(
        'fixed inset-0 z-50 bg-black/80 data-[expanded]:(animate-in fade-in-0 data-[closed]:(animate-out fade-out-0)',
        local.class,
      )}
      {...others}
    />
  )
}

const sheetVariants = clsvDefault(
  clsv(
    'fixed z-50 gap-4 bg-background p-4 shadow-lg transition ease-in-out data-[closed]:(duration-300 animate-out) data-[expanded]:(duration-500 animate-in)',
    {
      position: {
        top: 'inset-x-0 top-0 border-b data-[closed]:slide-out-to-top data-[expanded]:slide-in-from-top',
        bottom:
        'inset-x-0 bottom-0 border-t data-[closed]:slide-out-to-bottom data-[expanded]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[closed]:slide-out-to-left data-[expanded]:slide-in-from-left sm:max-w-sm',
        right:
        'inset-y-0 right-0 h-full w-3/4 border-l data-[closed]:slide-out-to-right data-[expanded]:slide-in-from-right sm:max-w-sm',
      },
    },
  ),
  { position: 'right' },
)

type DialogContentProps<T extends ValidComponent = 'div'> = SheetPrimitive.DialogContentProps<T>
  & VariantProps<typeof sheetVariants> & { class?: string | undefined, children?: JSX.Element }

function SheetContent<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, DialogContentProps<T>>) {
  const [local, others] = splitProps(props as DialogContentProps, ['position', 'class', 'children'])
  return (
    <SheetPortal position={local.position}>
      <SheetOverlay />
      <SheetPrimitive.Content
        class={cls(
          sheetVariants({ position: local.position }),
          local.class,
          'max-h-screen overflow-y-auto',
        )}
        {...others}
      >
        {local.children}
        <SheetPrimitive.CloseButton class="rounded-sm opacity-70 ring-offset-background transition-opacity right-4 top-4 absolute focus:effect-fv focus:outline-none data-[state=open]:bg-secondary disabled:effect-dis hover:opacity-100">
          <Icon name="lucide:x" />
          <span class="sr-only">Close</span>
        </SheetPrimitive.CloseButton>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

const SheetHeader: Component<ComponentProps<'div'>> = (props) => {
  const [local, others] = splitProps(props, ['class'])
  return (
    <div class={cls('flex flex-col gap-2 text-center sm:text-left', local.class)} {...others} />
  )
}

const SheetFooter: Component<ComponentProps<'div'>> = (props) => {
  const [local, others] = splitProps(props, ['class'])
  return (
    <div
      class={cls('flex flex-col-reverse sm:(flex-row justify-end gap-2)', local.class)}
      {...others}
    />
  )
}

type DialogTitleProps<T extends ValidComponent = 'h2'> = SheetPrimitive.DialogTitleProps<T> & {
  class?: string | undefined
}

function SheetTitle<T extends ValidComponent = 'h2'>(props: PolymorphicProps<T, DialogTitleProps<T>>) {
  const [local, others] = splitProps(props as DialogTitleProps, ['class'])
  return (
    <SheetPrimitive.Title
      class={cls('font-semibold text-(lg foreground)', local.class)}
      {...others}
    />
  )
}

type DialogDescriptionProps<T extends ValidComponent = 'p'> =
  SheetPrimitive.DialogDescriptionProps<T> & { class?: string | undefined }

function SheetDescription<T extends ValidComponent = 'p'>(props: PolymorphicProps<T, DialogDescriptionProps<T>>) {
  const [local, others] = splitProps(props as DialogDescriptionProps, ['class'])
  return (
    <SheetPrimitive.Description
      class={cls('text-(sm muted-foreground)', local.class)}
      {...others}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
