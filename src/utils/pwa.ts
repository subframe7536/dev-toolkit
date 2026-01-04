import { useEventListener } from '@solid-hooks/core/web'
import { createEffect, createSignal } from 'solid-js'
import { toast } from 'solid-sonner'
import { useRegisterSW } from 'virtual:pwa-register/solid'

// Type definition for the non-standard event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
}

export function registPWA() {
  const [deferredPrompt, setDeferredPrompt] = createSignal<BeforeInstallPromptEvent | null>(null)

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
      },
      onDismiss: () => setDeferredPrompt(null),
      onAutoClose: () => setDeferredPrompt(null),
    })
  })

  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()

  createEffect(() => {
    if (needRefresh()) {
      toast('New Version Available', {
        description: 'Click "Refresh" button to apply the update',
        duration: 10000, // Show for 10 seconds
        action: {
          label: 'Refresh',
          onClick: () => updateServiceWorker(true),
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
