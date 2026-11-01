import type { ParentProps } from 'solid-js'
import { createUniqueId } from 'solid-js'

export function ToolOptions(props: ParentProps<{ title?: string }>) {
  const headingId = createUniqueId()

  return (
    <section aria-labelledby={headingId} class="min-w-0 tool-option-controls w-full space-y-3">
      <h2 id={headingId} class="text-sm text-foreground font-medium">
        {props.title ?? 'Options'}
      </h2>
      {props.children}
    </section>
  )
}
