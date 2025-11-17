import { createRoute } from 'solid-file-router'

export default createRoute({
  component: props => <div>{JSON.stringify(props)}</div>,
})
