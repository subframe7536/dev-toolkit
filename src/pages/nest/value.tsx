import { createRoute } from '#/route'

export default createRoute({
  component: props => <div>{JSON.stringify(props)}</div>,
})
