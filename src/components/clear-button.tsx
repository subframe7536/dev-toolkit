import type { ButtonProps } from 'moraine'
import { Button } from 'moraine'
import { splitProps } from 'solid-js'

type ClearButtonProps = Omit<ButtonProps, 'onClick' | 'children'> & {
  onClear: () => void
}

export function ClearButton(props: ClearButtonProps) {
  const [local, rest] = splitProps(props, ['onClear'])

  return (
    <Button tone="danger" leading="i-lucide-x" {...rest} onClick={() => local.onClear()}>
      Clear
    </Button>
  )
}
