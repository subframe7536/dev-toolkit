import { createRoute } from '#/route'
import { useLocation } from '@solidjs/router'

export default createRoute({
  component: (props) => {
    return (
      <>
        <div>{useLocation().pathname}</div>
        <div>{props.location.pathname}</div>
        <div>{props.children}</div>
      </>
    )
  },
})
