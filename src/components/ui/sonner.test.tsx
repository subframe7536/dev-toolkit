// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { toast } from 'solid-toaster'
import { afterEach, expect, it, vi } from 'vitest'

import { ThemeToggle } from '#/components/theme-toggle'
import { useTheme } from '#/utils/theme'

import { Toaster } from './sonner'

afterEach(() => {
  toast.dismiss()
  cleanup()
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('light', 'dark')
})

it('updates an existing toast when the application theme changes', async () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )

  render(() => {
    useTheme().setMode('light')
    return (
      <>
        <ThemeToggle />
        <Toaster />
      </>
    )
  })
  toast.success('Theme check', { duration: Infinity })
  const notification = await screen.findByText('Theme check')
  const theme = () => notification.closest('[data-sonner-theme]')?.getAttribute('data-sonner-theme')
  expect(theme()).toBe('light')

  fireEvent.click(screen.getByRole('button', { name: 'Toggle theme' }))
  await waitFor(() => expect(theme()).toBe('dark'))
  expect(document.documentElement.classList.contains('dark')).toBe(true)

  fireEvent.click(screen.getByRole('button', { name: 'Toggle theme' }))
  await waitFor(() => expect(theme()).toBe('light'))
  expect(document.documentElement.classList.contains('dark')).toBe(false)
})
