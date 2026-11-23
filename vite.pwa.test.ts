import { runInNewContext } from 'node:vm'

import { describe, expect, test, vi } from 'vitest'

import {
  createManifest,
  createServiceWorker,
  getBundleAssets,
  getManifestPath,
  unique,
} from './vite.pwa'

describe('vite.pwa', () => {
  describe('createManifest', () => {
    test('creates manifest with default theme and background colors', () => {
      const manifest = createManifest({
        name: 'Dev Toolkit',
        shortName: 'DevToolkit',
        description: 'Tools for developers',
      })

      expect(manifest.name).toBe('Dev Toolkit')
      expect(manifest.short_name).toBe('DevToolkit')
      expect(manifest.description).toBe('Tools for developers')
      expect(manifest.id).toBe('.')
      expect(manifest.start_url).toBe('.')
      expect(manifest.scope).toBe('.')
      expect(manifest.display).toBe('standalone')
      expect(manifest.theme_color).toBe('#f6f7f3')
      expect(manifest.background_color).toBe('#f6f7f3')
      expect(manifest.icons).toHaveLength(4)
      expect(manifest.icons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
          expect.objectContaining({ sizes: '512x512', purpose: 'any' }),
          expect.objectContaining({ sizes: '192x192', purpose: 'maskable' }),
          expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
        ]),
      )
    })

    test('supports custom themeColor and backgroundColor', () => {
      const manifest = createManifest({
        name: 'App',
        shortName: 'App',
        description: 'Desc',
        themeColor: '#18211d',
        backgroundColor: '#18211d',
      })

      expect(manifest.theme_color).toBe('#18211d')
      expect(manifest.background_color).toBe('#18211d')
    })
  })

  describe('getManifestPath', () => {
    test('handles root bases', () => {
      expect(getManifestPath('/')).toBe('/manifest.webmanifest')
      expect(getManifestPath('')).toBe('/manifest.webmanifest')
      expect(getManifestPath('./')).toBe('/manifest.webmanifest')
    })

    test('handles subpath bases', () => {
      expect(getManifestPath('/dev-toolkit')).toBe('/dev-toolkit/manifest.webmanifest')
      expect(getManifestPath('/dev-toolkit/')).toBe('/dev-toolkit/manifest.webmanifest')
    })
  })

  describe('getBundleAssets', () => {
    test('extracts asset fileNames while filtering .map and sw.js', () => {
      const bundle = {
        'index.js': { fileName: 'assets/index.js' },
        'index.js.map': { fileName: 'assets/index.js.map' },
        'sw.js': { fileName: 'sw.js' },
        'style.css': { fileName: 'assets/style.css' },
        other: {},
      }

      const assets = getBundleAssets(bundle)
      expect(assets).toEqual(['assets/index.js', 'assets/style.css'])
    })
  })

  describe('unique', () => {
    test('removes duplicate entries', () => {
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
    })
  })

  describe('createServiceWorker', () => {
    test('generates service worker script with required handlers', () => {
      const sw = createServiceWorker({
        buildId: '2026-10-10T00:00:00.000Z',
        cachePrefix: 'dev-toolkit',
        precacheUrls: ['.', 'manifest.webmanifest', 'assets/index.js'],
      })

      expect(sw).toContain('CACHE_NAME = "dev-toolkit-precache-2026-10-10T00:00:00.000Z"')
      expect(sw).toContain('dev-toolkit-precache-')
      expect(sw).toContain('"manifest.webmanifest"')
      expect(sw).toContain('SKIP_WAITING')
      expect(sw).toContain('self.skipWaiting()')
      expect(sw).toContain('self.clients.claim()')
      expect(sw).toContain('cacheFirstNavigation')
      expect(sw).toContain('cacheFirst')
      expect(sw).toContain("pathname === new URL('sw.js', self.registration.scope).pathname")
    })
  })

  describe('createServiceWorker lifecycle', () => {
    const LEGACY_CACHE = 'workbox-precache-v2-https://tool.subf.dev/'
    const OLD_CACHE = 'dev-toolkit-precache-2026-01-01T00:00:00.000Z'
    const CURRENT_CACHE = 'dev-toolkit-precache-2026-10-10T00:00:00.000Z'

    function setup(
      initialCaches: string[],
      options?: {
        precacheUrls?: string[]
        initialEntries?: Record<string, Map<string, unknown>>
        fetchImpl?: (request: unknown) => Promise<unknown>
      },
    ) {
      const cacheStores = new Map<string, Map<string, unknown>>()
      for (const name of initialCaches) {
        cacheStores.set(name, new Map(options?.initialEntries?.[name] ?? []))
      }
      const listeners: Record<string, (event: unknown) => void> = {}
      const windowClient = { url: 'https://tool.subf.dev/json-formatter', navigate: vi.fn() }
      windowClient.navigate.mockResolvedValue(windowClient)

      const self = {
        registration: { scope: 'https://tool.subf.dev/' },
        location: { origin: 'https://tool.subf.dev' },
        addEventListener: (type: string, listener: (event: unknown) => void) => {
          listeners[type] = listener
        },
        skipWaiting: vi.fn(async () => {}),
        clients: {
          claim: vi.fn(async () => {}),
          matchAll: vi.fn(async () => [windowClient]),
        },
      }

      const toKey = (req: unknown) => (typeof req === 'string' ? req : (req as { url: string }).url)
      const stripSearch = (rawUrl: string) => {
        const parsed = new URL(rawUrl)
        parsed.search = ''
        return parsed.toString()
      }

      const matchStore = (
        store: Map<string, unknown>,
        req: unknown,
        opts?: { ignoreSearch?: boolean },
      ) => {
        const key = toKey(req)
        if (store.has(key)) {
          return store.get(key)
        }
        if (opts?.ignoreSearch) {
          const target = stripSearch(key)
          for (const [entryKey, value] of store.entries()) {
            if (stripSearch(entryKey) === target) {
              return value
            }
          }
        }
        return undefined
      }

      const fetchMock = vi.fn(
        options?.fetchImpl ??
          (async (req: unknown) => ({
            status: 200,
            redirected: false,
            url: toKey(req),
            clone() {
              return this
            },
          })),
      )

      const caches = {
        keys: async () => [...cacheStores.keys()],
        match: async (req: unknown, opts?: { ignoreSearch?: boolean }) => {
          for (const store of cacheStores.values()) {
            const matched = matchStore(store, req, opts)
            if (matched) {
              return matched
            }
          }
          return undefined
        },
        open: async (name: string) => {
          let store = cacheStores.get(name)
          if (!store) {
            store = new Map()
            cacheStores.set(name, store)
          }
          return {
            addAll: async (requests: unknown[]) => {
              for (const req of requests) {
                const resp = await fetchMock(req)
                store.set(toKey(req), resp)
              }
            },
            put: async (req: unknown, resp: unknown) => {
              store.set(toKey(req), resp)
            },
            match: async (req: unknown, opts?: { ignoreSearch?: boolean }) =>
              matchStore(store, req, opts),
          }
        },
        delete: async (name: string) => cacheStores.delete(name),
      }

      runInNewContext(
        createServiceWorker({
          buildId: '2026-10-10T00:00:00.000Z',
          cachePrefix: 'dev-toolkit',
          precacheUrls: options?.precacheUrls ?? ['.'],
        }),
        {
          self,
          caches,
          URL,
          Request: class {
            url: string
            cache?: string
            constructor(url: string, init?: { cache?: string }) {
              this.url = url
              this.cache = init?.cache
            }
          },
          Response: { error: () => ({ status: 0, type: 'error' }) },
          fetch: fetchMock,
        },
      )

      const dispatch = async (type: string) => {
        let pending: Promise<unknown> = Promise.resolve()
        listeners[type]({ waitUntil: (promise: Promise<unknown>) => (pending = promise) })
        await pending
        // Page reloads run after activation, outside waitUntil.
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      const dispatchFetch = async (request: { url: string; method: string; mode?: string }) => {
        let responded: Promise<unknown> | undefined
        const waitPromises: Promise<unknown>[] = []
        listeners.fetch({
          request,
          respondWith: (promise: Promise<unknown>) => {
            responded = promise
          },
          waitUntil: (promise: Promise<unknown>) => {
            waitPromises.push(promise)
          },
        })
        const response = responded ? await responded : undefined
        await Promise.all(waitPromises)
        return response
      }

      return { self, cacheStores, windowClient, fetchMock, dispatch, dispatchFetch }
    }

    test('takes over from the legacy Workbox worker and reloads its pages', async () => {
      const { self, cacheStores, windowClient, dispatch } = setup([LEGACY_CACHE])

      await dispatch('install')
      expect(self.skipWaiting).toHaveBeenCalled()

      await dispatch('activate')
      expect(self.clients.claim).toHaveBeenCalled()
      expect([...cacheStores.keys()]).toEqual([CURRENT_CACHE])
      expect(windowClient.navigate).toHaveBeenCalledWith(windowClient.url)
    })

    test('waits for the update prompt when replacing one of its own versions', async () => {
      const { self, cacheStores, windowClient, dispatch } = setup([OLD_CACHE])

      await dispatch('install')
      expect(self.skipWaiting).not.toHaveBeenCalled()

      await dispatch('activate')
      expect([...cacheStores.keys()]).toEqual([CURRENT_CACHE])
      expect(windowClient.navigate).not.toHaveBeenCalled()
    })

    test('serves cached navigation immediately without waiting for network', async () => {
      const cachedHome = { status: 200, body: 'cached-home' }
      const { fetchMock, dispatchFetch } = setup([CURRENT_CACHE], {
        initialEntries: {
          [CURRENT_CACHE]: new Map([['https://tool.subf.dev/', cachedHome]]),
        },
      })

      const rootResponse = await dispatchFetch({
        url: 'https://tool.subf.dev/',
        method: 'GET',
        mode: 'navigate',
      })
      expect(rootResponse).toBe(cachedHome)

      const queryResponse = await dispatchFetch({
        url: 'https://tool.subf.dev/?source=pwa',
        method: 'GET',
        mode: 'navigate',
      })
      expect(queryResponse).toBe(cachedHome)

      const indexResponse = await dispatchFetch({
        url: 'https://tool.subf.dev/index.html',
        method: 'GET',
        mode: 'navigate',
      })
      expect(indexResponse).toBe(cachedHome)

      expect(fetchMock).not.toHaveBeenCalled()
    })

    test('fetches and caches uncached navigation routes, falling back to root when offline', async () => {
      const cachedHome = { status: 200, body: 'cached-home' }
      const networkPage = {
        status: 200,
        redirected: false,
        body: 'network-formatter',
        clone() {
          return this
        },
      }
      const { cacheStores, fetchMock, dispatchFetch } = setup([CURRENT_CACHE], {
        initialEntries: {
          [CURRENT_CACHE]: new Map([['https://tool.subf.dev/', cachedHome]]),
        },
        fetchImpl: async (req) => {
          const url = typeof req === 'string' ? req : (req as { url: string }).url
          if (url.endsWith('/json-formatter')) {
            return networkPage
          }
          throw new Error('offline')
        },
      })

      const onlineMiss = await dispatchFetch({
        url: 'https://tool.subf.dev/json-formatter',
        method: 'GET',
        mode: 'navigate',
      })
      expect(onlineMiss).toBe(networkPage)
      expect(cacheStores.get(CURRENT_CACHE)?.get('https://tool.subf.dev/json-formatter')).toBe(
        networkPage,
      )

      const offlineMiss = await dispatchFetch({
        url: 'https://tool.subf.dev/base64',
        method: 'GET',
        mode: 'navigate',
      })
      expect(offlineMiss).toBe(cachedHome)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    test('reuses unchanged hashed assets from prior caches during install', async () => {
      const cachedChunk = {
        status: 200,
        redirected: false,
        body: 'unchanged-chunk',
        clone() {
          return this
        },
      }
      const { cacheStores, fetchMock, dispatch } = setup([OLD_CACHE], {
        precacheUrls: ['.', 'assets/xlsx-12345678.js', 'assets/new-87654321.js'],
        initialEntries: {
          [OLD_CACHE]: new Map([['https://tool.subf.dev/assets/xlsx-12345678.js', cachedChunk]]),
        },
      })

      await dispatch('install')

      const fetchedUrls = fetchMock.mock.calls.map((call) => (call[0] as { url: string }).url)
      expect(fetchedUrls).toEqual([
        'https://tool.subf.dev/',
        'https://tool.subf.dev/assets/new-87654321.js',
      ])
      expect(
        cacheStores.get(CURRENT_CACHE)?.get('https://tool.subf.dev/assets/xlsx-12345678.js'),
      ).toBe(cachedChunk)
    })
  })
})
