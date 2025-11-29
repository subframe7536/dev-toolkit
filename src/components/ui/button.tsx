import type { ButtonRootProps } from '@kobalte/core/button'
import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import type { VariantProps } from 'cls-variant'
import type { ValidComponent } from 'solid-js'

import * as ButtonPrimitive from '@kobalte/core/button'
import { cls, clsv, clsvDefault } from 'cls-variant'
import { splitProps } from 'solid-js'

export const buttonVariants = clsvDefault(
  clsv(
    'inline-flex items-center justify-center rounded-md font-500 transition focus-visible:effect-fv disabled:(effect-dis cursor-not-allowed) select-none whitespace-nowrap',
    {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        outline: 'b-(1 border) bg-background shadow-xs hover:(bg-accent text-accent-foreground)',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:(bg-accent text-accent-foreground hover:bg-accent/50)',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 rounded-md px-3 text-xs',
        md: 'h-8 rounded-md px-4 text-xs md:text-sm',
        lg: 'h-12 rounded-md px-8 text-lg',
        icon: 'size-9',
      },
    },
  ),
  {
    variant: 'default',
    size: 'default',
  },
)

type ButtonProps<T extends ValidComponent = 'button'> = ButtonRootProps<T>
  & VariantProps<typeof buttonVariants> & {
    class?: string
  }

function Button<T extends ValidComponent = 'button'>(props: PolymorphicProps<T, ButtonProps<T>>) {
  const [local, rest] = splitProps(props as ButtonProps, [
    'class',
    'variant',
    'size',
  ])

  return (
    <ButtonPrimitive.Root
      class={cls(
        buttonVariants({
          size: local.size,
          variant: local.variant,
        }),
        local.class,
      )}
      {...rest}
    />
  )
}

export { Button, type ButtonProps }
