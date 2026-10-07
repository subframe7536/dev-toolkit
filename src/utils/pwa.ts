import { createEventListener } from 'moraine/utils'
import { createEffect, createSignal } from 'solid-js'
import { toast } from 'solid-toaster'

// Type definition for the non-standard event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let isServiceWorkerRegistered = false
let shouldReloadAfterActivation = false

export function registPWA() {
  const [deferredPrompt, setDeferredPrompt] = createSignal<BeforeInstallPromptEvent | null>(null)
  const [needRefresh, setNeedRefresh] = createSignal(false)
  const [registration, setRegistration] = createSignal<ServiceWorkerRegistration | null>(null)

  createEventListener<EventTarget, 'beforeinstallprompt'>(window, 'beforeinstallprompt', (e) => {
    // 1. Prevent the mini-infobar from appearing on mobile
    e.preventDefault()

    // 2. Stash the event so it can be triggered later
    setDeferredPrompt(e as BeforeInstallPromptEvent)

    // 3. Trigger the Sonner Toast
    toast('Install App', {
      description: 'Install this application on your device for a better experience.',
      duration: 10000, // Show for 10 seconds
      action: {
        label: 'Install',
        onClick: async () => {
          const promptEvent = deferredPrompt()
          if (!promptEvent) {
            return
          }

          // Show the native install prompt
          await promptEvent.prompt()

          // Wait for the user to respond to the prompt
          await promptEvent.userChoice

          // We've used the prompt, so clear it
          setDeferredPrompt(null)
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => setDeferredPrompt(null),
      },
      onDismiss: () => setDeferredPrompt(null),
      onAutoClose: () => setDeferredPrompt(null),
    })
  })

  registerServiceWorker((nextRegistration) => {
    setRegistration(nextRegistration)
    setNeedRefresh(true)
  })

  createEffect(() => {
    if (needRefresh()) {
      toast('New Version Available', {
        description: 'Click "Refresh" button to apply the update',
        duration: 10000, // Show for 10 seconds
        action: {
          label: 'Refresh',
          onClick: () => activateWaitingServiceWorker(registration()),
        },
        cancel: {
          label: 'Cancel',
          onClick: () => setNeedRefresh(false),
        },
        onDismiss: () => setNeedRefresh(false),
        onAutoClose: () => setNeedRefresh(false),
      })
    }
  })

  return null
}

export const registerPWA = registPWA

export function getServiceWorkerBaseUrl(
  baseEnv = import.meta.env.BASE_URL,
  origin = window.location.origin,
) {
  const rawBase = baseEnv || '/'
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
  return new URL(base, origin)
}

function registerServiceWorker(onUpdateReady: (registration: ServiceWorkerRegistration) => void) {
  if (isServiceWorkerRegistered || !import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return
  }

  isServiceWorkerRegistered = true

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!shouldReloadAfterActivation) {
      return
    }

    shouldReloadAfterActivation = false
    window.location.reload()
  })

  if (document.readyState === 'complete') {
    void registerServiceWorkerOnLoad(onUpdateReady)
  } else {
    window.addEventListener('load', () => {
      void registerServiceWorkerOnLoad(onUpdateReady)
    })
  }
}

export async function registerServiceWorkerOnLoad(
  onUpdateReady: (registration: ServiceWorkerRegistration) => void,
) {
  try {
    const baseUrl = getServiceWorkerBaseUrl()
    const nextRegistration = await navigator.serviceWorker.register(new URL('sw.js', baseUrl), {
      scope: baseUrl.pathname,
      updateViaCache: 'none',
    })

    if (nextRegistration.waiting) {
      onUpdateReady(nextRegistration)
    }

    const listenInstallingWorker = (worker: ServiceWorker | null) => {
      if (!worker) {
        return
      }

      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          onUpdateReady(nextRegistration)
        }
      })
    }

    if (nextRegistration.installing) {
      listenInstallingWorker(nextRegistration.installing)
    }

    nextRegistration.addEventListener('updatefound', () => {
      listenInstallingWorker(nextRegistration.installing)
    })
  } catch (error) {
    console.warn('Service worker registration failed.', error)
  }
}

export function activateWaitingServiceWorker(registration: ServiceWorkerRegistration | null) {
  if (!registration?.waiting) {
    return
  }

  shouldReloadAfterActivation = true
  registration.waiting.postMessage({ type: 'SKIP_WAITING' })
}
