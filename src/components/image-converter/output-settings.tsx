import type { ImageFormat } from '#/utils/image'
import type { Component } from 'solid-js'

import { Input, Select, Slider, Switch } from 'moraine'
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
        <label class="text-sm font-medium">Output Format</label>
        <Select
          value={props.targetFormat}
          onChange={props.onFormatChange}
          options={FORMAT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
        />
      </div>

      <Show when={showQualitySlider()}>
        <div>
          <label class="text-sm font-medium">{`${props.targetFormat.toUpperCase()} Quality: ${props.quality}`}</label>
          <Slider
            value={[props.quality]}
            onChange={value => props.onQualityChange(value[0])}
            min={1}
            max={100}
            step={1}
          />
        </div>
      </Show>

      <Switch
        checked={props.ratio}
        onChange={props.onRatioChange}
        label="Keep aspect ratio"
      />

      <div>
        <label class="text-sm font-medium mb-2 block">Global Dimensions</label>
        <p class="text-xs text-muted-foreground mb-3">
          Apply to all images without individual settings
        </p>
        <div class="flex gap-2">
          <Input
            classes={{ root: 'flex-1' }}
            type="number"
            placeholder="Width"
            value={props.globalWidth ? `${props.globalWidth}` : ''}
            onInput={(e) => {
              const val = e.currentTarget.value
              props.onGlobalWidthChange(val ? Number.parseInt(val) : undefined)
            }}
          />
          <Input
            classes={{ root: 'flex-1' }}
            type="number"
            placeholder="Height"
            value={props.globalHeight ? `${props.globalHeight}` : ''}
            onInput={(e) => {
              const val = e.currentTarget.value
              props.onGlobalHeightChange(val ? Number.parseInt(val) : undefined)
            }}
          />
        </div>
      </div>
    </div>
  )
}
