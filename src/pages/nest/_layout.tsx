import type { RouteSectionProps } from '@solidjs/router'

import { useLocation } from '@solidjs/router'

import { createRoute } from '@/route'

export const route = createRoute({
  component: (props: RouteSectionProps) => {
    return (
      <>
        <div>{useLocation().pathname}</div>
        <div>{props.location.pathname}</div>
        <div>{props.children}</div>
      </>
    )
  },
})
