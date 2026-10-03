import { Field, Button, Input } from 'moraine'
import type { Component } from 'solid-js'
import { Show } from 'solid-js'

interface SvgOptionsProps {
  previewUrl?: string
  backgroundColor: string
  onBackgroundColorChange: (color: string) => void
  fillColor: string
  onFillColorChange: (color: string) => void
  strokeColor: string
  onStrokeColorChange: (color: string) => void
  onReset: () => void
}

export const SvgOptions: Component<SvgOptionsProps> = (props) => {
  return (
    <div class="space-y-4">
      <Show when={props.previewUrl}>
        <div>
          <h3 class="font-medium mb-2 text-sm">Preview</h3>
          <div class="p-4 border bg-muted/30 flex items-center justify-center rounded-lg">
            <img
              src={props.previewUrl}
              alt="SVG Preview"
              class="max-h-48 max-w-full object-contain"
            />
          </div>
        </div>
      </Show>

      <Field
        label="Background Color (optional)"
        classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
      >
        <div class="flex gap-2">
          <Field
            label="Background color picker"
            classes={{ root: 'shrink-0', label: 'sr-only', container: 'mt-0!' }}
          >
            <Input
              type="color"
              value={props.backgroundColor || '#ffffff'}
              onValueChange={props.onBackgroundColorChange}
              classes={{ root: 'p-0 h-9 w-12 cursor-pointer' }}
            />
          </Field>
          <Input
            type="text"
            placeholder="Leave empty for transparent"
            value={props.backgroundColor}
            onValueChange={props.onBackgroundColorChange}
          />
        </div>
      </Field>

      <Field
        label="Fill Color (optional)"
        classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
      >
        <div class="flex gap-2">
          <Field
            label="Fill color picker"
            classes={{ root: 'shrink-0', label: 'sr-only', container: 'mt-0!' }}
          >
            <Input
              type="color"
              value={props.fillColor || '#000000'}
              onValueChange={props.onFillColorChange}
              classes={{ root: 'p-0 h-9 w-12 cursor-pointer' }}
            />
          </Field>
          <Input
            type="text"
            placeholder="Leave empty for original"
            value={props.fillColor}
            onValueChange={props.onFillColorChange}
          />
        </div>
      </Field>

      <Field
        label="Stroke Color (optional)"
        classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
      >
        <div class="flex gap-2">
          <Field
            label="Stroke color picker"
            classes={{ root: 'shrink-0', label: 'sr-only', container: 'mt-0!' }}
          >
            <Input
              type="color"
              value={props.strokeColor || '#000000'}
              onValueChange={props.onStrokeColorChange}
              classes={{ root: 'p-0 h-9 w-12 cursor-pointer' }}
            />
          </Field>
          <Input
            type="text"
            placeholder="Leave empty for original"
            value={props.strokeColor}
            onValueChange={props.onStrokeColorChange}
          />
        </div>
      </Field>

      <Button
        variant="outline"
        size="sm"
        classes={{ root: 'w-full' }}
        onClick={props.onReset}
        leading="i-lucide-rotate-ccw"
      >
        Reset SVG Options
      </Button>
    </div>
  )
}
