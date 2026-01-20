import type { ImageFormat } from '#/utils/image'
import type { Component } from 'solid-js'

import { Label } from '#/components/ui/label'
import { SimpleSelect } from '#/components/ui/select'
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'
import { TextField, TextFieldInput } from '#/components/ui/text-field'
import { Show } from 'solid-js'

const FORMAT_OPTIONS: { value: ImageFormat, label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
]

interface OutputSettingsProps {
  targetFormat: ImageFormat
  onFormatChange: (format: ImageFormat) => void
  quality: number
  onQualityChange: (quality: number) => void
  ratio: boolean
  onRatioChange: (ratio: boolean) => void
  globalWidth?: number
  onGlobalWidthChange: (width?: number) => void
  globalHeight?: number
  onGlobalHeightChange: (height?: number) => void
}

export const OutputSettings: Component<OutputSettingsProps> = (props) => {
  const showQualitySlider = () => {
    const format = props.targetFormat
    return format === 'jpg' || format === 'webp'
  }

  return (
    <div class="flex flex-col gap-6">
      <div>
        <Label>Output Format</Label>
        <SimpleSelect
          value={props.targetFormat}
          onChange={props.onFormatChange}
          options={FORMAT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          disallowEmptySelection
          placeholder="Select format"
          class="w-full"
        />
      </div>

      <Show when={showQualitySlider()}>
        <Slider
          value={[props.quality]}
          onChange={value => props.onQualityChange(value[0])}
          minValue={1}
          maxValue={100}
          step={1}
          label={`${props.targetFormat.toUpperCase()} Quality: ${props.quality}`}
        />
      </Show>

      <Switch
        checked={props.ratio}
        onChange={props.onRatioChange}
        text="Keep aspect ratio"
      />

      <div>
        <Label class="mb-2 block">Global Dimensions</Label>
        <p class="text-xs text-muted-foreground mb-3">
          Apply to all images without individual settings
        </p>
        <div class="flex gap-2">
          <TextField
            class="flex-1"
            value={props.globalWidth ? `${props.globalWidth}` : ''}
            onChange={(val) => {
              props.onGlobalWidthChange(val ? Number.parseInt(val) : undefined)
            }}
          >
            <TextFieldInput
              type="number"
              placeholder="Width"
            />
          </TextField>
          <TextField
            class="flex-1"
            value={props.globalHeight ? `${props.globalHeight}` : ''}
            onChange={(val) => {
              props.onGlobalHeightChange(val ? Number.parseInt(val) : undefined)
            }}
          >
            <TextFieldInput
              type="number"
              placeholder="Height"
            />
          </TextField>
        </div>
      </div>
    </div>
  )
}
