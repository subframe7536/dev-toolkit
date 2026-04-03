import type { Component } from 'solid-js'

import { Button, Icon, Input } from 'moraine'
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
          <label class="text-sm font-medium mb-2 block">Preview</label>
          <div class="p-4 border rounded-lg bg-muted/30 flex items-center justify-center">
            <img
              src={props.previewUrl}
              alt="SVG Preview"
              class="max-h-48 max-w-full object-contain"
            />
          </div>
        </div>
      </Show>

      <div>
        <label class="text-sm font-medium">Background Color (optional)</label>
        <div class="flex gap-2">
          <input
            type="color"
            value={props.backgroundColor || '#ffffff'}
            onInput={e => props.onBackgroundColorChange(e.currentTarget.value)}
            class="border rounded h-10 w-14 cursor-pointer"
          />
          <Input
            type="text"
            placeholder="Leave empty for transparent"
            value={props.backgroundColor}
            onValueChange={props.onBackgroundColorChange}
          />
        </div>
      </div>

      <div>
        <label class="text-sm font-medium">Fill Color (optional)</label>
        <div class="flex gap-2">
          <input
            type="color"
            value={props.fillColor || '#000000'}
            onInput={e => props.onFillColorChange(e.currentTarget.value)}
            class="border rounded h-10 w-14 cursor-pointer"
          />
          <Input
            type="text"
            placeholder="Leave empty for original"
            value={props.fillColor}
            onValueChange={props.onFillColorChange}
          />
        </div>
      </div>

      <div>
        <label class="text-sm font-medium">Stroke Color (optional)</label>
        <div class="flex gap-2">
          <input
            type="color"
            value={props.strokeColor || '#000000'}
            onInput={e => props.onStrokeColorChange(e.currentTarget.value)}
            class="border rounded h-10 w-14 cursor-pointer"
          />
          <Input
            type="text"
            placeholder="Leave empty for original"
            value={props.strokeColor}
            onValueChange={props.onStrokeColorChange}
          />
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        class="w-full"
        onClick={props.onReset}
      >
        <Icon name="i-lucide-rotate-ccw" class="mr-2 size-4" />
        Reset SVG Options
      </Button>
    </div>
  )
}
