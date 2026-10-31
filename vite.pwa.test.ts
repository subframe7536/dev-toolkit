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
      expect(sw).toContain('networkFirstNavigation')
      expect(sw).toContain('cacheFirst')
      expect(sw).toContain("pathname === new URL('sw.js', self.registration.scope).pathname")
    })
  })

  describe('createServiceWorker lifecycle', () => {
    const LEGACY_CACHE = 'workbox-precache-v2-https://tool.subf.dev/'
    const OLD_CACHE = 'dev-toolkit-precache-2026-01-01T00:00:00.000Z'
    const CURRENT_CACHE = 'dev-toolkit-precache-2026-10-10T00:00:00.000Z'

    function setup(initialCaches: string[]) {
      const cacheNames = new Set(initialCaches)
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
      const caches = {
        keys: async () => [...cacheNames],
        open: async (name: string) => {
          cacheNames.add(name)
          return { addAll: async () => {} }
        },
        delete: async (name: string) => cacheNames.delete(name),
      }

      runInNewContext(
        createServiceWorker({
          buildId: '2026-10-10T00:00:00.000Z',
          cachePrefix: 'dev-toolkit',
          precacheUrls: ['.'],
        }),
        { self, caches, URL, Request: class {} },
      )

      const dispatch = async (type: string) => {
        let pending: Promise<unknown> = Promise.resolve()
        listeners[type]({ waitUntil: (promise: Promise<unknown>) => (pending = promise) })
        await pending
        // Page reloads run after activation, outside waitUntil.
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      return { self, cacheNames, windowClient, dispatch }
    }

    test('takes over from the legacy Workbox worker and reloads its pages', async () => {
      const { self, cacheNames, windowClient, dispatch } = setup([LEGACY_CACHE])

      await dispatch('install')
      expect(self.skipWaiting).toHaveBeenCalled()

      await dispatch('activate')
      expect(self.clients.claim).toHaveBeenCalled()
      expect([...cacheNames]).toEqual([CURRENT_CACHE])
      expect(windowClient.navigate).toHaveBeenCalledWith(windowClient.url)
    })

    test('waits for the update prompt when replacing one of its own versions', async () => {
      const { self, cacheNames, windowClient, dispatch } = setup([OLD_CACHE])

      await dispatch('install')
      expect(self.skipWaiting).not.toHaveBeenCalled()

      await dispatch('activate')
      expect([...cacheNames]).toEqual([CURRENT_CACHE])
      expect(windowClient.navigate).not.toHaveBeenCalled()
    })
  })
})
