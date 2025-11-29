// import type json from '@iconify-json/lucide/icons.json'

import { cls } from 'cls-variant'

export interface Props {
  name: `lucide:${string}`
  class?: string
  title?: string
}

export function Icon(props: Props) {
  return (
    <div
      class={cls(`i-${props.name} inline-block`, props.class)}
      title={props.title || props.name}
    />
  )
}

export default Icon
