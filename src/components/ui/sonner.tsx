import { Icon } from 'moraine'
import type { Component, ComponentProps } from 'solid-js'
import { BaseToaster } from 'solid-toaster'

import { useTheme } from '#/utils/theme'

type ToasterProps = ComponentProps<typeof BaseToaster>

const Toaster: Component<ToasterProps> = (props) => {
  const { isDark } = useTheme()

  return (
    <BaseToaster
      theme={isDark() ? 'dark' : 'light'}
      visibleToasts={4}
      preventDuplicate
      style={{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
        '--border-radius': 'var(--radius)',
      }}
      icons={{
        success: () => <Icon name="icon-success" />,
        error: () => <Icon name="icon-error" />,
        warning: () => <Icon name="icon-warning" />,
        info: () => <Icon name="icon-info" />,
        loading: () => <Icon name="icon-loading" class="animate-spin" />,
        close: () => <Icon name="icon-close" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
