import { Field, Button, Icon, Input, Slider, cn } from 'moraine'
import { createRoute } from 'solid-file-router'
import { createMemo, createSignal, For } from 'solid-js'
import { toast } from 'solid-toaster'

import { Card } from '#/components/card'
import { CopyButton } from '#/components/copy-button'
import { ToolOptions } from '#/components/tool-options'
import type { ColorFormat, RGB } from '#/utils/color'
import {
  formatColor,
  hexToRgb,
  hslToRgb,
  parseColor,
  randomColor,
  rgbToHex,
  rgbToHsl,
} from '#/utils/color'

export default createRoute({
  info: {
    title: 'Color Converter',
    description: 'Convert colors between formats and adjust properties',
    category: 'Utilities',
    icon: 'i-lucide-palette',
    tags: ['color', 'converter', 'hex', 'rgb', 'hsl', 'hwb', 'oklch'],
  },
  component: ColorConverter,
})

const formats: ColorFormat[] = ['hex', 'rgb', 'hsl', 'hwb', 'oklch']
const MAX_COLORS = 24

function ColorConverter() {
  const initialRgb = randomColor()
  const [color, setColor] = createSignal({ rgb: initialRgb, hsl: rgbToHsl(initialRgb) })
  const rgb = () => color().rgb
  const hsl = () => color().hsl
  const setRgb = (value: RGB) => setColor({ rgb: value, hsl: rgbToHsl(value) })
  const [savedColors, setSavedColors] = createSignal<string[]>([])
  const [inputValue, setInputValue] = createSignal('')

  const handleColorPick = (hex: string) => {
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
    setRgb({ ...rgb(), [component]: value })
  }

  const updateFromHsl = (component: 'h' | 's' | 'l', value: number) => {
    // Preserve hue and saturation while editing achromatic colors.
    const next = { ...hsl(), [component]: value }
    setColor({ rgb: hslToRgb(next), hsl: next })
  }

  return (
    <div class="tool-grid lg:grid-cols-2">
      {/* Left Column */}
      <div class="min-w-0 space-y-4">
        {/* Color Preview with Picker */}
        <Field
          hiddenLabel="Pick color"
          classes={{
            root: 'group border h-32 w-full cursor-pointer relative overflow-hidden rounded-lg focus-within:effect-fv',
            container: 'h-full',
          }}
        >
          <div
            class="h-full w-full transition-opacity group-hover:opacity-90"
            style={{ 'background-color': rgbToHex(rgb()) }}
          />
          <div class="opacity-0 flex transition-opacity items-center inset-0 justify-center absolute group-hover:opacity-100">
            <Icon name="i-lucide-pipette" class="text-white drop-shadow-lg text-5xl" />
          </div>
          <Input
            type="color"
            value={rgbToHex(rgb())}
            onValueChange={handleColorPick}
            classes={{ root: 'opacity-0 h-full w-full inset-0 absolute cursor-pointer' }}
          />
        </Field>

        {/* Text Input with Clear */}
        <Field hiddenLabel="Color value" classes={{ root: 'min-w-0', container: 'relative' }}>
          <Input
            value={inputValue()}
            onValueChange={handleInputChange}
            placeholder="Enter color..."
            classes={{ root: 'font-mono pr-12 min-h-11 md:min-h-8 md:pr-10' }}
          />
          <button
            aria-label="Clear color input"
            class="rounded-1.5 size-11 translate-y--50% right-0 top-50% absolute hover:bg-background md:size-8 md:right-2"
            onClick={() => handleInputChange('')}
          >
            <Icon name="i-lucide-x" class="size-3 inline-block" title="clear" />
          </button>
        </Field>

        {/* Action Buttons */}
        <div class="flex gap-2">
          <Button onClick={handleRandomize} classes={{ root: 'flex-1' }} leading="i-lucide-shuffle">
            Random
          </Button>
          <Button
            onClick={handleSaveColor}
            variant="secondary"
            classes={{ root: 'flex-1' }}
            leading="i-lucide-save"
          >
            Save
          </Button>
        </div>

        {/* Saved Colors */}
        <div class="space-y-2">
          <h3 class="text-muted-foreground font-medium select-none text-sm">Saved Colors</h3>
          <div class="gap-2 grid grid-cols-4 max-h-40 overflow-y-auto sm:grid-cols-6">
            <For each={Array.from({ length: MAX_COLORS })}>
              {(_, i) => {
                const color = createMemo(() => savedColors()[i()])
                return (
                  <button
                    onClick={() => color() && applySavedColor(color()!)}
                    class={cn(
                      'b-(2 border) rounded h-11 w-full transition-colors focus-visible:effect-fv',
                      color() ? 'cursor-pointer hover:opacity-80' : 'bg-muted/30 cursor-default',
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
      <div class="min-w-0 space-y-4">
        {/* RGB & HSL Sliders */}
        <ToolOptions>
          <div class="gap-4 grid 2xl:grid-cols-2">
            <Card
              variant="section"
              title="RGB Channels"
              class="flex-1"
              content={
                <div class="space-y-4">
                  <Field
                    label="Red"
                    classes={{
                      root: 'min-w-0',
                      label: 'text-muted-foreground font-medium text-xs',
                    }}
                  >
                    <Slider
                      value={[Math.round(rgb().r)]}
                      onValueChange={(value) => updateFromSliders('r', value[0])}
                      min={0}
                      max={255}
                      step={1}
                    />
                  </Field>
                  <Field
                    label="Green"
                    classes={{
                      root: 'min-w-0',
                      label: 'text-muted-foreground font-medium text-xs',
                    }}
                  >
                    <Slider
                      value={[Math.round(rgb().g)]}
                      onValueChange={(value) => updateFromSliders('g', value[0])}
                      min={0}
                      max={255}
                      step={1}
                    />
                  </Field>
                  <Field
                    label="Blue"
                    classes={{
                      root: 'min-w-0',
                      label: 'text-muted-foreground font-medium text-xs',
                    }}
                  >
                    <Slider
                      value={[Math.round(rgb().b)]}
                      onValueChange={(value) => updateFromSliders('b', value[0])}
                      min={0}
                      max={255}
                      step={1}
                    />
                  </Field>
                </div>
              }
            />

            <Card
              variant="section"
              title="HSL Properties"
              class="flex-1"
              content={
                <div class="space-y-4">
                  <Field
                    label="Hue"
                    classes={{
                      root: 'min-w-0',
                      label: 'text-muted-foreground font-medium text-xs',
                    }}
                  >
                    <Slider
                      value={[Math.round(hsl().h)]}
                      onValueChange={(value) => updateFromHsl('h', value[0])}
                      min={0}
                      max={360}
                      step={1}
                    />
                  </Field>
                  <Field
                    label="Saturation"
                    classes={{
                      root: 'min-w-0',
                      label: 'text-muted-foreground font-medium text-xs',
                    }}
                  >
                    <Slider
                      value={[Math.round(hsl().s)]}
                      onValueChange={(value) => updateFromHsl('s', value[0])}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </Field>
                  <Field
                    label="Lightness"
                    classes={{
                      root: 'min-w-0',
                      label: 'text-muted-foreground font-medium text-xs',
                    }}
                  >
                    <Slider
                      value={[Math.round(hsl().l)]}
                      onValueChange={(value) => updateFromHsl('l', value[0])}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </Field>
                </div>
              }
            />
          </div>
        </ToolOptions>

        {/* Color Formats List */}
        <Card
          variant="section"
          title="Color Formats"
          content={
            <div class="space-y-4">
              <For each={formats}>
                {(format) => {
                  const value = () => formatColor(rgb(), format)
                  return (
                    <div class="p-2 border bg-muted/30 flex gap-2 items-center rounded-lg">
                      <div class="flex-1 min-w-0">
                        <div class="text-muted-foreground font-medium mb-0.5 select-none uppercase text-xs">
                          {format}
                        </div>
                        <code class="font-mono break-all text-sm">{value()}</code>
                      </div>
                      <CopyButton content={value()} variant="ghost" size="sm" text={false} />
                    </div>
                  )
                }}
              </For>
            </div>
          }
        />
      </div>
    </div>
  )
}
