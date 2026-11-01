// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { activateWaitingServiceWorker, getServiceWorkerBaseUrl, isStandalone } from './pwa'

describe('pwa utils', () => {
  describe('getServiceWorkerBaseUrl', () => {
    test('resolves default root base', () => {
      const url = getServiceWorkerBaseUrl('/', 'http://localhost:3000')
      expect(url.href).toBe('http://localhost:3000/')
    })

    test('resolves subpath base with trailing slash', () => {
      const url = getServiceWorkerBaseUrl('/dev-toolkit/', 'http://localhost:3000')
      expect(url.href).toBe('http://localhost:3000/dev-toolkit/')
    })

    test('resolves subpath base without trailing slash', () => {
      const url = getServiceWorkerBaseUrl('/dev-toolkit', 'http://localhost:3000')
      expect(url.href).toBe('http://localhost:3000/dev-toolkit/')
    })
  })

  describe('isStandalone', () => {
    const originalMatchMedia = window.matchMedia

    afterEach(() => {
      window.matchMedia = originalMatchMedia
      delete (window.navigator as { standalone?: boolean }).standalone
    })

    test('returns false in normal browser tab', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any
      expect(isStandalone()).toBe(false)
    })

    test('returns true when display-mode is standalone', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
      })) as any
      expect(isStandalone()).toBe(true)
    })

    test('returns true when iOS navigator.standalone is true', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
        configurable: true,
      })
      expect(isStandalone()).toBe(true)
    })
  })

  describe('activateWaitingServiceWorker', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    test('posts SKIP_WAITING to waiting worker', () => {
      const postMessage = vi.fn()
      const mockRegistration = {
        waiting: { postMessage } as unknown as ServiceWorker,
      } as ServiceWorkerRegistration

      activateWaitingServiceWorker(mockRegistration)

      expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    })

    test('falls back to installing worker when installed', () => {
      const postMessage = vi.fn()
      const mockRegistration = {
        waiting: null,
        installing: {
          state: 'installed',
          postMessage,
        } as unknown as ServiceWorker,
      } as ServiceWorkerRegistration

      activateWaitingServiceWorker(mockRegistration)

      expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    })
  })
})
