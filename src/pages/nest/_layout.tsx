import { useLocation } from '@solidjs/router'
import { createRoute } from 'solid-file-router'

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
