import type { Component, ComponentProps } from 'solid-js'
import { Toaster as SolidToaster } from 'solid-toaster'

import { useTheme } from '#/utils/theme'

type ToasterProps = ComponentProps<typeof SolidToaster>

const Toaster: Component<ToasterProps> = (props) => {
  const { isDark } = useTheme()

  return (
    <SolidToaster
      theme={isDark() ? 'dark' : 'light'}
      classes={{
        toast: 'bg-popover text-popover-foreground b-(1 border) shadow-lg',
        description: 'text-muted-foreground',
        actionButton: 'bg-primary text-primary-foreground',
        cancelButton: 'bg-muted text-muted-foreground',
      }}
      {...props}
    />
  )
}

export { Toaster }
