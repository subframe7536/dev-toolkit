import { useEventListener } from '@solid-hooks/core/web'
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

  useEventListener(window, 'beforeinstallprompt', (e) => {
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
      })
    }
  })

  return null
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

  window.addEventListener('load', () => {
    void registerServiceWorkerOnLoad(onUpdateReady)
  })
}

async function registerServiceWorkerOnLoad(
  onUpdateReady: (registration: ServiceWorkerRegistration) => void,
) {
  try {
    const baseUrl = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
    const nextRegistration = await navigator.serviceWorker.register(new URL('sw.js', baseUrl), {
      scope: baseUrl.pathname,
      updateViaCache: 'none',
    })

    if (nextRegistration.waiting) {
      onUpdateReady(nextRegistration)
    }

    nextRegistration.addEventListener('updatefound', () => {
      const installingWorker = nextRegistration.installing

      if (!installingWorker) {
        return
      }

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          onUpdateReady(nextRegistration)
        }
      })
    })
  } catch (error) {
    console.warn('Service worker registration failed.', error)
  }
}

function activateWaitingServiceWorker(registration: ServiceWorkerRegistration | null) {
  shouldReloadAfterActivation = true
  registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
}
