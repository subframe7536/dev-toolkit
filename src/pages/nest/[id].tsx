import { createRoute } from 'solid-file-router'

export default createRoute({
  preload: () => ({ id: 1 }),
  component: props => <div>{props.data.id}</div>,
})
