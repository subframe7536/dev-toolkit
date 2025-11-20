import type { Component, ComponentProps } from 'solid-js'

import { Toaster as Sonner } from 'solid-sonner'

type ToasterProps = ComponentProps<typeof Sonner>

const Toaster: Component<ToasterProps> = (props) => {
  return (
    <Sonner
      class="toaster group"
      toastOptions={{
        classes: {
          toast:
            'group toast group-[.toaster]:(bg-background text-foreground b-border shadow-lg)',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:(bg-primary text-primary-foreground)',
          cancelButton: 'group-[.toast]:(bg-muted text-muted-foreground)',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
