import type { ParentProps } from 'solid-js'

import { createRoute } from '#/route'
import { A } from '#/router.gen'
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
  return (
    <div class="text-foreground bg-background min-h-screen">
      <header class="border-b border-border">
        <nav class="mx-auto px-4 max-w-7xl lg:px-8 sm:px-6">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center">
              <A href="/" class="text-xl font-semibold">
                Dev Toolkit
              </A>
            </div>
            <div class="flex items-center space-x-4">
              <A href="/" class="text-sm font-medium hover:text-primary-foreground">
                Home
              </A>
              <A href="/data" class="text-sm font-medium hover:text-primary-foreground">
                Data Tools
              </A>
            </div>
          </div>
        </nav>
      </header>

      <main class="mx-auto px-4 py-8 max-w-7xl lg:px-8 sm:px-6">
        {props.children}
      </main>
    </div>
  )
}
