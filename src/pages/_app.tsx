import type { ParentProps } from 'solid-js'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { useColorMode } from '@solid-hooks/core/web'
import { createRoute } from 'solid-file-router'
import { fileRoutes } from 'virtual:routes'

export default createRoute({
  component: App,
  errorComponent: Catch,
  loadingComponent: () => <div>Loading...</div>,
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
  const [mode, setMode, isDark] = useColorMode()
  console.log(fileRoutes)
  return (
    <SidebarProvider>
      <Sidebar variant="floating">
        <SidebarHeader>1</SidebarHeader>
        <SidebarContent>2</SidebarContent>
        <SidebarFooter>
          <div>{isDark() ? 'dark' : 'light'} theme</div>
          <div>{mode()}</div>
          <button onClick={() => setMode(m => m === 'dark' ? 'auto' : m === 'light' ? 'dark' : 'light')}>click</button>

        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger class="left-2 top-2 absolute" />
        <div class="px-24 pt-24">
          {props.children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
