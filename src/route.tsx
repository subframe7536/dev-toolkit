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
import { isDev } from 'solid-js/web'

interface RouteComponents {
  error?: Component<{ error: any, reset: VoidFunction }>
  pending?: Component
}

interface RouteModule extends RouteComponents {
  component: ParentComponent
  preload?: RoutePreloadFunc
}

interface RouteConfig<T = unknown> extends RouteComponents {
  component: Component<RouteSectionProps<NoInfer<T>>>
  preload?: RoutePreloadFunc<T>
}

const Fragment = (_args?: any) => <></>
export function createRoute<T = unknown>(config: RouteConfig<T>): RouteModule {
  return config
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

const preservedRoutes = generatePreservedRoutes<{ default: RouteModule }>(PRESERVED)
const modalRoutes = generateModalRoutes<Element>(MODALS)
const regularRoutes = generateRegularRoutes<RouteInfo, () => Promise<{ default: RouteModule }>>(ROUTES, moduleFn)

const _app = preservedRoutes?._app?.default || { component: props => <>{props.children}</> }
const NotFoundComponent = preservedRoutes?.['404']?.default.component || Fragment

function moduleFn(module: () => Promise<{ default: RouteModule }>): RouteInfo {
  const Comp = lazy(() => module().then(mod => ({ default: mod.default.component })))
  const Pending = lazy(() => module().then(mod => ({
    default: mod.default.pending || Fragment,
  })))
  const Catch = lazy(() => module().then(mod => ({
    default: mod.default.error || ((err: any) => (isDev && console.error(err), Fragment())),
  })))

  return {
    component: (props: any) => (
      <ErrorBoundary fallback={(error, reset) => Catch({ error, reset })}>
        <Suspense fallback={<Pending />}>
          <Comp {...props} />
        </Suspense>
      </ErrorBoundary>
    ),
    preload: (args: RoutePreloadFuncArgs) => module()
      .then(mod => mod?.default.preload?.(args) || undefined),
  }
}

function Layout(props: ParentProps) {
  const modalPath = createMemo(() => useLocation<any>().state?.modal)
  const Modal = createMemo(() => modalRoutes[modalPath()])
  return (
    <>
      {_app.component(props)}
      <Show when={modalPath()}>
        <Modal />
      </Show>
    </>
  )
}

function App(props: ParentProps) {
  const fallback = isDev && !_app.error
    ? (error: any) => (console.error(error), Fragment())
    : (error: any, reset: VoidFunction) => _app.error?.({ error, reset })

  return (
    <ErrorBoundary fallback={fallback}>
      <Show when={_app.pending} fallback={Layout(props)}>
        <Suspense fallback={_app.pending!({})}>
          {Layout(props)}
        </Suspense>
      </Show>
    </ErrorBoundary>
  )
}

export const routes: RouteDefinition[] = [{
  path: '',
  component: App,
  preload: _app.preload,
  children: [
    ...regularRoutes,
    {
      path: '*',
      component: NotFoundComponent,
    },
  ],
}]

export const FileRouter: Component<Omit<RouterProps, 'children'>> = (
  props?: Omit<RouterProps, 'children'>,
) => Router({ ...props, children: routes })
