import type { ParentProps } from 'solid-js'
import { createUniqueId } from 'solid-js'

export function ToolOptions(props: ParentProps<{ title?: string }>) {
  const headingId = createUniqueId()

  return (
    <section aria-labelledby={headingId} class="min-w-0 w-full space-y-3">
      <h2 id={headingId} class="text-foreground font-medium text-sm">
        {props.title ?? 'Options'}
      </h2>
      {props.children}
    </section>
  )
}
