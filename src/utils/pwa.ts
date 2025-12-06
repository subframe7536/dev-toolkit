// src/hooks/usePwaInstall.ts
import { watch } from '@solid-hooks/core'
import { useEventListener } from '@solid-hooks/core/web'
import { createSignal } from 'solid-js'
import { toast } from 'solid-sonner'
import { useRegisterSW } from 'virtual:pwa-register/solid'

// Type definition for the non-standard event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = createSignal<BeforeInstallPromptEvent | null>(null)

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt()
    if (!promptEvent) {
      return
    }

    // Show the native install prompt
    await promptEvent.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice

    console.log(`User response to install prompt: ${outcome}`)

    // We've used the prompt, so clear it
    setDeferredPrompt(null)
  }

  useEventListener(window, 'beforeinstallprompt', (e) => {
    // 1. Prevent the mini-infobar from appearing on mobile
    e.preventDefault()

    // 2. Stash the event so it can be triggered later
    setDeferredPrompt(e as BeforeInstallPromptEvent)

    // 3. Trigger the Sonner Toast
    toast('Install App', {
      description: 'Install this application on your device for a better experience.',
      duration: 10000, // Show for 10 seconds
      closeButton: true,
      action: {
        label: 'Install',
        onClick: handleInstallClick,
      },
      onDismiss: () => setDeferredPrompt(null),
      onAutoClose: () => setDeferredPrompt(null),
    })
  })

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  watch(needRefresh, (refresh) => {
    if (refresh) {
      toast('New content available', {
        description: 'Click reload to update the app.',
        duration: Infinity, // Keep open until clicked
        action: {
          label: 'Reload',
          onClick: () => updateServiceWorker(true),
        },
        onDismiss: () => setNeedRefresh(false), // Allow user to close
      })
    }
  })
}
