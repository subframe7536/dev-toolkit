// @vitest-environment jsdom

import { MemoryRouter, Route } from '@solidjs/router'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RegexProvider, useRegexContext } from '#/contexts/regex-context'
import { TableEditorProvider, useTableEditorContext } from '#/contexts/table-editor-context'
import ColorRoute from '#/pages/(tools)/(utilities)/color'
import TextCaseRoute from '#/pages/(tools)/(utilities)/text-case'
import UUIDRoute from '#/pages/(tools)/(utilities)/uuid'

import { EncoderLayout } from './encoder-layout'
import { OutputSettings } from './image-converter/output-settings'
import { ExportDialog as RegexExportDialog } from './regex-tester/export-dialog'
import { PatternLibraryDialog } from './regex-tester/pattern-library'
import { ExportDialog as TableExportDialog } from './table-editor/export-dialog'
import { SidebarLayout, SidebarTrigger } from './ui/sidebar'

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  // jsdom has no application stylesheet; use a no-motion environment for overlay exits.
  const style = document.createElement('style')
  style.id = 'test-no-motion'
  style.textContent =
    '* { animation-name: none !important; animation-duration: 0s !important; animation-delay: 0s !important; }'
  document.head.append(style)
})

afterEach(() => {
  cleanup()
  document.getElementById('test-no-motion')?.remove()
  vi.unstubAllGlobals()
})

describe('tool UI integrations', () => {
  it('encodes the latest controlled text and clears both input and output', () => {
    render(() => <EncoderLayout mode="Base64" onEncode={btoa} onDecode={atob} />)
    const input = screen.getByPlaceholderText(
      'Enter text to encode to Base64...',
    ) as HTMLTextAreaElement
    const output = screen.getByPlaceholderText(
      'Base64 output will appear here...',
    ) as HTMLTextAreaElement
    fireEvent.input(input, { target: { value: 'hello' } })
    expect(input.value).toBe('hello')
    expect(output.value).toBe('aGVsbG8=')
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input.value).toBe('')
    expect(output.value).toBe('')
  })
  it('updates converted text inside cards when input is committed', () => {
    render(() => (
      <MemoryRouter>
        <Route path="/" component={TextCaseRoute.component} />
      </MemoryRouter>
    ))

    fireEvent.change(screen.getByPlaceholderText('Enter text to convert...'), {
      target: { value: 'hello world' },
    })

    expect(screen.getByText('helloWorld')).toBeTruthy()
    expect(screen.getByText('hello_world')).toBeTruthy()
    expect(screen.getByText('Example: helloWorld')).toBeTruthy()
  })

  it('generates the count selected by tabs and numeric step controls', () => {
    render(() => (
      <MemoryRouter>
        <Route path="/" component={UUIDRoute.component} />
      </MemoryRouter>
    ))

    fireEvent.click(screen.getByRole('tab', { name: '10' }))
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('10')
    fireEvent.click(screen.getByRole('button', { name: 'Increment' }))
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    expect(screen.getByRole('heading', { name: 'Generated UUIDs (11)' })).toBeTruthy()
  })

  it('delivers image settings as domain values and quality changes before release', async () => {
    const onFormatChange = vi.fn()
    const onQualityChange = vi.fn()
    const onRatioChange = vi.fn()
    render(() => (
      <OutputSettings
        targetFormat="jpg"
        onFormatChange={onFormatChange}
        quality={80}
        onQualityChange={onQualityChange}
        ratio={true}
        onRatioChange={onRatioChange}
        onGlobalWidthChange={() => {}}
        onGlobalHeightChange={() => {}}
      />
    ))

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByRole('option', { name: 'WebP' }))
    expect(onFormatChange).toHaveBeenCalledWith('webp')
    fireEvent.click(screen.getByRole('switch', { name: 'Keep aspect ratio' }))
    expect(onRatioChange).toHaveBeenCalledWith(false)
    const slider = screen.getByRole('slider', { name: 'Thumb' })
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onQualityChange).toHaveBeenCalledWith(81)
    fireEvent.keyUp(slider, { key: 'ArrowRight' })
    expect(onQualityChange).toHaveBeenCalledTimes(1)
  })

  it('preserves the selected hue of a gray color when saturation is increased', () => {
    render(() => (
      <MemoryRouter>
        <Route path="/" component={ColorRoute.component} />
      </MemoryRouter>
    ))

    fireEvent.input(screen.getByRole('textbox', { name: 'Color value' }), {
      target: { value: '#808080' },
    })
    const hue = within(screen.getByRole('group', { name: 'Hue' })).getByRole('slider', {
      name: 'Thumb',
    })
    fireEvent.keyDown(hue, { key: 'ArrowRight' })
    fireEvent.keyUp(hue, { key: 'ArrowRight' })
    expect(hue.getAttribute('aria-valuenow')).toBe('1')

    const saturation = within(screen.getByRole('group', { name: 'Saturation' })).getByRole(
      'slider',
      { name: 'Thumb' },
    )
    fireEvent.keyDown(saturation, { key: 'End' })
    fireEvent.keyUp(saturation, { key: 'End' })
    expect(hue.getAttribute('aria-valuenow')).toBe('1')
    expect(screen.getByText('hsl(1, 100%, 50%)')).toBeTruthy()
  })

  it('opens table export and updates SQL when key columns are checked and unchecked', async () => {
    function TableFixture() {
      const { actions } = useTableEditorContext()
      actions.setData({
        columns: [
          { id: 'id', name: 'id', originalName: 'id', dataType: 'integer', isPinned: false },
          { id: 'name', name: 'name', originalName: 'name', dataType: 'string', isPinned: false },
        ],
        rows: [{ id: 'row-1', cells: { id: 1, name: 'Alice' } }],
      })
      return <TableExportDialog />
    }
    render(() => (
      <TableEditorProvider>
        <TableFixture />
      </TableEditorProvider>
    ))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    const dialog = await screen.findByRole('dialog', { name: 'Export' })
    fireEvent.click(within(dialog).getByRole('combobox'))
    fireEvent.click(await screen.findByRole('option', { name: 'SQL UPDATE' }))
    const checkbox = within(dialog).getByRole('checkbox', { name: 'id' })
    fireEvent.click(checkbox)
    await waitFor(() =>
      expect((dialog.querySelector('textarea') as HTMLTextAreaElement).value).toContain('WHERE'),
    )
    fireEvent.click(checkbox)
    await waitFor(() =>
      expect((dialog.querySelector('textarea') as HTMLTextAreaElement).value).toBe(''),
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('loads a library pattern and opens controlled export with working language and comment settings', async () => {
    function RegexFixture() {
      const { actions } = useRegexContext()
      return (
        <>
          <PatternLibraryDialog />
          <button onClick={() => actions.toggleExportDialog(true)}>Export pattern</button>
          <RegexExportDialog />
        </>
      )
    }
    render(() => (
      <RegexProvider>
        <RegexFixture />
      </RegexProvider>
    ))
    fireEvent.click(screen.getByRole('button', { name: 'Load Example' }))
    const library = await screen.findByRole('dialog', { name: 'Pattern Library' })
    fireEvent.click(within(library).getByText('Email Address', { exact: true }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Export pattern' }))
    const dialog = await screen.findByRole('dialog', { name: 'Export Regex Pattern' })
    const output = within(dialog).getByRole('textbox', {
      name: 'Generated Code',
    }) as HTMLTextAreaElement
    expect(output.value).toContain('const regex')
    fireEvent.input(within(dialog).getByPlaceholderText('regex'), { target: { value: 'pattern' } })
    expect(output.value).toContain('const pattern')
    fireEvent.click(within(dialog).getByRole('combobox'))
    fireEvent.click(await screen.findByRole('option', { name: 'Python' }))
    await waitFor(() => expect(output.value).toContain('re.compile'))
    fireEvent.click(within(dialog).getByRole('switch', { name: 'Include comments' }))
    await waitFor(() => expect(output.value).not.toContain('#'))
    fireEvent.keyDown(dialog, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it.each([false, true])('toggles sidebar navigation in mobile mode %s', async (mobile) => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: mobile,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    render(() => (
      <SidebarLayout
        renderSidebarBody={(context) => (
          <button onClick={() => context.setOpen(false)}>Close navigation</button>
        )}
      >
        <SidebarTrigger />
        <p>Main content</p>
      </SidebarLayout>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle Sidebar' })
    if (mobile) {
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: 'Close navigation' })).toBeNull(),
      )
    } else {
      expect(screen.getByRole('button', { name: 'Close navigation' })).toBeTruthy()
      fireEvent.click(trigger)
      expect(screen.queryByRole('button', { name: 'Close navigation' })).toBeNull()
    }
    fireEvent.click(trigger)
    expect(await screen.findByRole('button', { name: 'Close navigation' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Close navigation' })).toBeNull(),
    )
    expect(screen.getByText('Main content')).toBeTruthy()
  })
})
