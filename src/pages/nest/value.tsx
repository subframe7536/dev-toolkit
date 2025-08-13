import { createRoute } from '@/route'

export const route = createRoute({
  component: props => <div>{JSON.stringify(props)}</div>,
})
