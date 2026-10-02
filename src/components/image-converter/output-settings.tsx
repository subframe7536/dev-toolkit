import { Field, Input, Select, Slider, Switch } from 'moraine'
import type { Component } from 'solid-js'
import { Show } from 'solid-js'

import type { ImageFormat } from '#/utils/image'

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
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
      <Field label="Output Format" classes={{ root: 'min-w-0', label: 'font-medium text-sm' }}>
        <Select
          value={props.targetFormat}
          onValueChange={(value) => value && props.onFormatChange(value)}
          items={FORMAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </Field>

      <Show when={showQualitySlider()}>
        <div class="tool-field">
          <label class="font-medium text-sm">{`${props.targetFormat.toUpperCase()} Quality: ${props.quality}`}</label>
          <Slider
            aria-label="Image Quality"
            value={[props.quality]}
            onValueCommit={(value) => props.onQualityChange(value[0])}
            min={1}
            max={100}
            step={1}
          />
        </div>
      </Show>

      <Switch
        checked={props.ratio}
        onCheckedChange={props.onRatioChange}
        label="Keep aspect ratio"
      />

      <div>
        <label class="font-medium mb-2 block text-sm">Global Dimensions</label>
        <p class="text-muted-foreground mb-3 text-xs">
          Apply to all images without individual settings
        </p>
        <div class="flex gap-2">
          <Input
            classes={{ root: 'min-w-0 flex-1' }}
            type="number"
            aria-label="Global Width"
            placeholder="Width"
            value={props.globalWidth ? `${props.globalWidth}` : ''}
            onValueChange={(value) =>
              props.onGlobalWidthChange(value ? Number.parseInt(value) : undefined)
            }
          />
          <Input
            classes={{ root: 'min-w-0 flex-1' }}
            type="number"
            aria-label="Global Height"
            placeholder="Height"
            value={props.globalHeight ? `${props.globalHeight}` : ''}
            onValueChange={(value) =>
              props.onGlobalHeightChange(value ? Number.parseInt(value) : undefined)
            }
          />
        </div>
      </div>
    </div>
  )
}
