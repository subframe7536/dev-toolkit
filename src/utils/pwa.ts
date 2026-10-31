import type { ToastT } from 'moraine'
import { Toast } from 'moraine'
import { onCleanup, onMount } from 'solid-js'

// Type definition for the non-standard event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let isServiceWorkerRegistered = false
let shouldReloadAfterActivation = false
let stashedPromptEvent: BeforeInstallPromptEvent | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    stashedPromptEvent = e as BeforeInstallPromptEvent
  })
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    Boolean((window.navigator as { standalone?: boolean }).standalone)
  )
}

function listenWindow(type: string, listener: EventListenerOrEventListenerObject) {
  window.addEventListener(type, listener)
  onCleanup(() => window.removeEventListener(type, listener))
}

export function registPWA() {
  let deferredPrompt: BeforeInstallPromptEvent | null = null
  let installToast: ToastT.Handle | undefined

  const promptInstall = (promptEvent: BeforeInstallPromptEvent) => {
    if (isStandalone()) {
      return
    }

    deferredPrompt = promptEvent
    installToast = Toast.show({
      title: 'Install App',
      description: 'Install this application on your device for a better experience.',
      duration: 10000,
      action: {
        label: 'Install',
        onClick: async () => {
          await deferredPrompt?.prompt()
          await deferredPrompt?.userChoice
        },
      },
      cancel: true,
      onClose: () => {
        deferredPrompt = null
        installToast = undefined
      },
    })
  }

  // `Toast` throws until its host is mounted, so wait for the app to render.
  onMount(() => {
    if (stashedPromptEvent) {
      promptInstall(stashedPromptEvent)
      stashedPromptEvent = null
    }

    listenWindow('beforeinstallprompt', (e) => {
      e.preventDefault()
      promptInstall(e as BeforeInstallPromptEvent)
    })

    listenWindow('appinstalled', () => installToast?.close())

    registerServiceWorker(showUpdateToast)
  })

  return null
}

let updateToast: ToastT.Handle | undefined

/** Shows one update prompt at a time; it stays open until the user acts on it. */
export function showUpdateToast(registration: ServiceWorkerRegistration) {
  if (updateToast) {
    return
  }

  updateToast = Toast.show({
    title: 'New Version Available',
    description: 'Click "Refresh" button to apply the update',
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: 'Refresh',
      onClick: () => activateWaitingServiceWorker(registration),
    },
    cancel: true,
    onClose: () => {
      updateToast = undefined
    },
  })
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

    const listenedWorkers = new WeakSet<ServiceWorker>()

    const listenInstallingWorker = (worker: ServiceWorker | null) => {
      if (!worker || listenedWorkers.has(worker)) {
        return
      }

      listenedWorkers.add(worker)

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

    const checkForUpdates = () => {
      if (navigator.onLine) {
        void nextRegistration.update().catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates()
      }
    })

    window.addEventListener('online', checkForUpdates)
    setInterval(checkForUpdates, 60 * 60 * 1000)

    return nextRegistration
  } catch (error) {
    console.warn('Service worker registration failed.', error)
  }
}

export function activateWaitingServiceWorker(registration?: ServiceWorkerRegistration | null) {
  const targetWorker =
    registration?.waiting ??
    (registration?.installing?.state === 'installed' ? registration.installing : null)

  shouldReloadAfterActivation = true

  if (targetWorker) {
    targetWorker.postMessage({ type: 'SKIP_WAITING' })
  } else if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    })
  }

  setTimeout(() => {
    if (shouldReloadAfterActivation) {
      shouldReloadAfterActivation = false
      window.location.reload()
    }
  }, 1500)
}
