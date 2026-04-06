import type { ColorFormat, RGB } from '#/utils/color'

import { Card } from '#/components/card'
import { CopyButton } from '#/components/copy-button'
import { Button, Icon, Input, Slider } from 'moraine'
import {
  formatColor,
  hexToRgb,
  hslToRgb,
  parseColor,
  randomColor,
  rgbToHex,
  rgbToHsl,
} from '#/utils/color'
import { cls } from 'cls-variant'
import { createRoute } from 'solid-file-router'
import { createMemo, createSignal, For } from 'solid-js'
import { toast } from 'solid-toaster'

export default createRoute({
  info: {
    title: 'Color Converter',
    description: 'Convert colors between formats and adjust properties',
    category: 'Utilities',
    icon: 'lucide:palette',
    tags: ['color', 'converter', 'hex', 'rgb', 'hsl', 'hwb', 'oklch'],
  },
  component: ColorConverter,
})

const formats: ColorFormat[] = ['hex', 'rgb', 'hsl', 'hwb', 'oklch']
const MAX_COLORS = 24

function ColorConverter() {
  const [rgb, setRgb] = createSignal<RGB>(randomColor())
  const [savedColors, setSavedColors] = createSignal<string[]>([])
  const [inputValue, setInputValue] = createSignal('')

  const handleColorPick = (e: Event) => {
    const hex = (e.target as HTMLInputElement).value
    setRgb(hexToRgb(hex))
    setInputValue(hex)
  }

  const handleRandomize = () => {
    const color = randomColor()
    setRgb(color)
    setInputValue(rgbToHex(color))
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    const parsed = parseColor(value)
    if (parsed) {
      setRgb(parsed)
    }
  }

  const handleSaveColor = () => {
    const hex = rgbToHex(rgb())
    setSavedColors((prev) => {
      if (prev.includes(hex)) {
        return prev
      }
      if (prev.length >= MAX_COLORS) {
        toast.info('Maximum colors saved')
        return prev
      }
      toast.success('Color saved!')
      return [...prev, hex]
    })
  }

  const applySavedColor = (hex: string) => {
    setRgb(hexToRgb(hex))
    setInputValue(hex)
  }

  const updateFromSliders = (component: 'r' | 'g' | 'b', value: number) => {
    setRgb(prev => ({ ...prev, [component]: value }))
  }

  const updateFromHsl = (component: 'h' | 's' | 'l', value: number) => {
    const hsl = rgbToHsl(rgb())
    hsl[component] = value
    setRgb(hslToRgb(hsl))
  }

  return (
    <div class="flex flex-col gap-6 w-full lg:flex-row">
      {/* Left Column */}
      <div class="flex-1 w-full space-y-6 lg:max-w-80">
        {/* Color Preview with Picker */}
        <label class="group b-(2 border) rounded-lg h-48 w-full block cursor-pointer shadow-lg transition-all relative overflow-hidden focus-within:(shadow-xl scale-[1.02]) hover:(shadow-xl scale-[1.02])">
          <div
            class="h-full w-full transition-opacity group-hover:opacity-90"
            style={{ 'background-color': rgbToHex(rgb()) }}
          />
          <div class="opacity-0 flex transition-opacity items-center inset-0 justify-center absolute group-hover:opacity-100">
            <Icon name="lucide:pipette" classes={{ icon: 'text-5xl text-white drop-shadow-lg' }} />
          </div>
          <input
            type="color"
            value={rgbToHex(rgb())}
            onInput={handleColorPick}
            class="sr-only"
          />
        </label>

        {/* Text Input with Clear */}
        <div class="relative">
          <Input
            value={inputValue()}
            onInput={e => handleInputChange(e.currentTarget.value)}
            placeholder="Enter color..."
            classes={{ input: 'font-mono' }}
          />
          <button
            class="rounded-1.5 size-6 translate-y--50% right-2 top-50% absolute hover:bg-background"
            onClick={() => handleInputChange('')}
          >
            <Icon name="lucide:x" classes={{ icon: 'size-3 inline-block' }} title="clear" />
          </button>
        </div>

        {/* Action Buttons */}
        <div class="flex gap-2">
          <Button onClick={handleRandomize} classes={{ root: 'flex-1' }}>
            <Icon name="lucide:shuffle" classes={{ icon: 'mr-2' }} />
            Random
          </Button>
          <Button onClick={handleSaveColor} variant="secondary" classes={{ root: 'flex-1' }}>
            <Icon name="lucide:save" classes={{ icon: 'mr-2' }} />
            Save
          </Button>
        </div>

        {/* Saved Colors */}
        <div class="space-y-2">
          <h3 class="text-sm text-muted-foreground font-medium select-none">Saved Colors</h3>
          <div class="gap-2 grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))]">
            <For each={Array.from({ length: MAX_COLORS })}>
              {(_, i) => {
                const color = createMemo(() => savedColors()[i()])
                return (
                  <button
                    onClick={() => color() && applySavedColor(color()!)}
                    class={cls(
                      'b-(2 border) rounded h-10 w-10 transition-all',
                      color()
                        ? 'cursor-pointer hover:(shadow-md scale-110)'
                        : 'bg-muted/30 cursor-default',
                    )}
                    style={color() ? { 'background-color': color() } : {}}
                    title={color() || 'Empty slot'}
                    disabled={!color()}
                  />
                )
              }}
            </For>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div class="flex-1 space-y-4">
        {/* RGB & HSL Sliders */}
        <div class="flex flex-col gap-4 lg:flex-row">
          <Card
            title="RGB Channels"
            class="flex-1"
            content={(
              <div class="space-y-4">
                <div>
                  <label class="text-sm font-medium">Red</label>
                  <Slider
                    value={[Math.round(rgb().r)]}
                    onChange={value => updateFromSliders('r', value[0])}
                    min={0}
                    max={255}
                    step={1}
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">Green</label>
                  <Slider
                    value={[Math.round(rgb().g)]}
                    onChange={value => updateFromSliders('g', value[0])}
                    min={0}
                    max={255}
                    step={1}
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">Blue</label>
                  <Slider
                    value={[Math.round(rgb().b)]}
                    onChange={value => updateFromSliders('b', value[0])}
                    min={0}
                    max={255}
                    step={1}
                  />
                </div>
              </div>
            )}
          />

          <Card
            title="HSL Properties"
            class="flex-1"
            content={(
              <div class="space-y-4">
                <div>
                  <label class="text-sm font-medium">Hue</label>
                  <Slider
                    value={[Math.round(rgbToHsl(rgb()).h)]}
                    onChange={value => updateFromHsl('h', value[0])}
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">Saturation</label>
                  <Slider
                    value={[Math.round(rgbToHsl(rgb()).s)]}
                    onChange={value => updateFromHsl('s', value[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">Lightness</label>
                  <Slider
                    value={[Math.round(rgbToHsl(rgb()).l)]}
                    onChange={value => updateFromHsl('l', value[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            )}
          />
        </div>

        {/* Color Formats List */}
        <Card
          title="Color Formats"
          content={(
            <div class="space-y-4">
              <For each={formats}>
                {(format) => {
                  const value = () => formatColor(rgb(), format)
                  return (
                    <div class="p-2 border rounded-lg bg-muted/30 flex gap-2 items-center">
                      <div class="flex-1">
                        <div class="text-xs text-muted-foreground font-medium mb-0.5 select-none uppercase">
                          {format}
                        </div>
                        <code class="text-sm font-mono">{value()}</code>
                      </div>
                      <CopyButton
                        content={value()}
                        variant="ghost"
                        size="sm"
                        text={false}
                      />
                    </div>
                  )
                }}
              </For>
            </div>
          )}
        />
      </div>
    </div>
  )
}
