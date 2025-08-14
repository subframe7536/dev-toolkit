import type { ParentProps } from 'solid-js'

import { createRoute, routes } from '@/route'
import { A, useModals, useNavigate } from '@/router.gen'
export default createRoute({
  component: App,
  error: Catch,
  pending: () => <div>Loading...</div>,
})

function Catch(props: { error: Error, reset: () => void }) {
  console.error(props)
  return (
    <div>
      Something went wrong:
      {' '}
      {props.error.message}
      Caught at _app error boundary
      <button onClick={() => props.reset}>reset</button>
    </div>
  )
}

function App(props: ParentProps) {
  // const navigate = useNavigate()
  const modals = useModals()
  return (
    <section style={{ margin: '24px' }}>
      <header style={{ display: 'flex', gap: '24px' }}>
        <A href="/">Home</A>
        <A href="/data">data</A>
        <A href="/nest">nest</A>
        <button
          class="text-red"
          onClick={() => modals.open('/modal', { at: '/nest/value' })}
        >
          Open global modal
        </button>
      </header>

      <main>{props.children}</main>
    </section>
  )
}
