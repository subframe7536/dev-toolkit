import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import type { ValidComponent } from 'solid-js'

import * as SkeletonPrimitive from '@kobalte/core/skeleton'
import { cls } from 'cls-variant'
import { splitProps } from 'solid-js'

type SkeletonRootProps<T extends ValidComponent = 'div'> =
  SkeletonPrimitive.SkeletonRootProps<T> & { class?: string | undefined }

function Skeleton<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, SkeletonRootProps<T>>) {
  const [local, others] = splitProps(props as SkeletonRootProps, ['class'])
  return (
    <SkeletonPrimitive.Root
      class={cls('bg-primary/10 data-[animate]:animate-pulse', local.class)}
      {...others}
    />
  )
}

export { Skeleton }
