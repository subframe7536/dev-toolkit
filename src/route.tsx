import type {
  RouteDefinition,
  RoutePreloadFunc,
  RoutePreloadFuncArgs,
  RouterProps,
  RouteSectionProps,
} from '@solidjs/router'
import type { Component, ParentComponent, ParentProps } from 'solid-js'

import {
  generateModalRoutes,
  generatePreservedRoutes,
  generateRegularRoutes,
} from '@generouted/solid-router/core'
import { Router, useLocation } from '@solidjs/router'
import {
  createMemo,
  ErrorBoundary,
  lazy,
  Show,
  Suspense,
} from 'solid-js'

interface RouteComponents {
  error?: Component<{ error: any, reset: VoidFunction }>
  pending?: Component
}

interface RouteModule extends RouteComponents {
  default: Component
  preload?: RoutePreloadFunc
}

interface RouteConfig<T = unknown> extends RouteComponents {
  component: Component<RouteSectionProps<T>>
  preload?: RoutePreloadFunc<T>
}

const Fragment = (_args: any) => <></>
function wrap<T extends Component | undefined>(
  el: T,
): T extends undefined ? undefined : T {
  // @ts-expect-error fxxk ts
  return el ? props => el(props) : undefined
}
export function createRoute<T = unknown>(config: RouteConfig<T>): RouteModule {
  return {
    default: wrap(config.component),
    error: wrap(config.error),
    pending: wrap(config.pending),
    preload: config.pending,
  }
}

interface RouteInfo {
  path?: string
  component?: Component
  preload?: RoutePreloadFunc
  children?: RouteInfo[]
}

const PRESERVED = import.meta.glob<{ route: RouteModule }>(
  '/src/pages/(_app|404).{jsx,tsx}',
  { eager: true },
)
const MODALS = import.meta.glob<RouteModule>(
  '/src/pages/**/[+]*.{jsx,tsx}',
  { eager: true },
)
const ROUTES = import.meta.glob<{ route: RouteModule }>([
  '/src/pages/**/[\\w[-]*.{jsx,tsx,mdx}',
  '!/src/pages/**/(_!(layout)*(/*)?|_app|404)*',
])

const preservedRoutes = generatePreservedRoutes<{ route: RouteModule }>(PRESERVED)
const modalRoutes = generateModalRoutes<Element>(MODALS)

const _app = preservedRoutes?._app?.route
const _404 = preservedRoutes?.['404']?.route

const Default: ParentComponent = _app?.default || (props => <>{props.children}</>)

function Layout(props: ParentProps) {
  const Modals = createMemo(
    () => modalRoutes[useLocation<any>().state?.modal || ''] || <></>,
  )
  return (
    <>
      <Default {...props} />
      <Modals />
    </>
  )
}

function App(props: ParentProps) {
  return (
    <ErrorBoundary fallback={(error, reset) => _app?.error?.({ error, reset })}>
      <Show when={_app?.pending} fallback={<Layout {...props} />}>
        <Suspense fallback={_app!.pending!({})}>
          <Layout {...props} />
        </Suspense>
      </Show>
    </ErrorBoundary>
  )
}
function moduleFn(module: () => Promise<{ route: RouteModule }>): RouteInfo {
  const Default = lazy(() => module().then(mod => mod.route))
  const Pending = lazy(() => module().then(mod => ({
    default: mod.route.pending || _app?.pending || Fragment,
  })))
  const Catch = lazy(() => module().then(mod => ({
    default: mod.route.error || _app?.error || Fragment,
  })))

  return {
    component: (props: any) => (
      <ErrorBoundary fallback={(error, reset) => Catch({ error, reset })}>
        <Suspense fallback={<Pending />}>
          <Default {...props} />
        </Suspense>
      </ErrorBoundary>
    ),
    preload: (args: RoutePreloadFuncArgs) => module()
      .then(mod => mod?.route.preload?.(args) || undefined),
  }
}

export const routes: RouteDefinition[] = [{
  path: '',
  component: App,
  preload: _app?.preload,
  children: [
    ...generateRegularRoutes<RouteInfo, () => Promise<{ route: RouteModule }>>(ROUTES, moduleFn),
    {
      path: '*',
      component: _404?.default || Fragment,
    },
  ],
}]
export function Routes(props?: Omit<RouterProps, 'children'>) {
  return <Router {...props}>{routes}</Router>
}
