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
    <div class="flex flex-col gap-4">
      <Field
        label="Output Format"
        classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
      >
        <Select
          value={props.targetFormat}
          onValueChange={(value) => value && props.onFormatChange(value)}
          items={FORMAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </Field>

      <Show when={showQualitySlider()}>
        <Field
          label={`${props.targetFormat.toUpperCase()} Quality: ${props.quality}`}
          classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
        >
          <Slider
            value={[props.quality]}
            onValueChange={(value) => props.onQualityChange(value[0])}
            min={1}
            max={100}
            step={1}
          />
        </Field>
      </Show>

      <Field
        label="Keep aspect ratio"
        classes={{
          root: 'flex flex-row-reverse gap-2 w-fit min-w-0 items-center',
          label: 'font-normal',
          container: 'mt-0! shrink-0',
        }}
      >
        <Switch checked={props.ratio} onCheckedChange={props.onRatioChange} />
      </Field>

      <div>
        <h3 class="font-medium mb-2 text-sm">Global Dimensions</h3>
        <p class="text-muted-foreground mb-3 text-xs">
          Apply to all images without individual settings
        </p>
        <div class="flex gap-2">
          <Field
            label="Global Width"
            classes={{ root: 'min-w-0 flex-1', label: 'sr-only', container: 'mt-0!' }}
          >
            <Input
              classes={{ root: 'min-w-0 flex-1' }}
              type="number"
              placeholder="Width"
              value={props.globalWidth ? `${props.globalWidth}` : ''}
              onValueChange={(value) =>
                props.onGlobalWidthChange(value ? Number.parseInt(value) : undefined)
              }
            />
          </Field>
          <Field
            label="Global Height"
            classes={{ root: 'min-w-0 flex-1', label: 'sr-only', container: 'mt-0!' }}
          >
            <Input
              classes={{ root: 'min-w-0 flex-1' }}
              type="number"
              placeholder="Height"
              value={props.globalHeight ? `${props.globalHeight}` : ''}
              onValueChange={(value) =>
                props.onGlobalHeightChange(value ? Number.parseInt(value) : undefined)
              }
            />
          </Field>
        </div>
      </div>
    </div>
  )
}
