import { createRoute } from '@/route'

export const route = createRoute({
  component: Index,
})

function Index() {
  return <div>index</div>
}
