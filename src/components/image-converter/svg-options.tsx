import type { Component } from 'solid-js'

import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import { Label } from '#/components/ui/label'
import { TextField, TextFieldInput } from '#/components/ui/text-field'
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
          <Label class="mb-2 block">Preview</Label>
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
        <Label>Background Color (optional)</Label>
        <div class="flex gap-2">
          <input
            type="color"
            value={props.backgroundColor || '#ffffff'}
            onInput={e => props.onBackgroundColorChange(e.currentTarget.value)}
            class="border rounded h-10 w-14 cursor-pointer"
          />
          <TextField
            value={props.backgroundColor}
            onChange={props.onBackgroundColorChange}
          >
            <TextFieldInput
              type="text"
              placeholder="Leave empty for transparent"
            />
          </TextField>
        </div>
      </div>

      <div>
        <Label>Fill Color (optional)</Label>
        <div class="flex gap-2">
          <input
            type="color"
            value={props.fillColor || '#000000'}
            onInput={e => props.onFillColorChange(e.currentTarget.value)}
            class="border rounded h-10 w-14 cursor-pointer"
          />
          <TextField
            value={props.fillColor}
            onChange={props.onFillColorChange}
          >
            <TextFieldInput
              type="text"
              placeholder="Leave empty for original"
            />
          </TextField>
        </div>
      </div>

      <div>
        <Label>Stroke Color (optional)</Label>
        <div class="flex gap-2">
          <input
            type="color"
            value={props.strokeColor || '#000000'}
            onInput={e => props.onStrokeColorChange(e.currentTarget.value)}
            class="border rounded h-10 w-14 cursor-pointer"
          />
          <TextField
            value={props.strokeColor}
            onChange={props.onStrokeColorChange}
          >
            <TextFieldInput
              type="text"
              placeholder="Leave empty for original"
            />
          </TextField>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        class="w-full"
        onClick={props.onReset}
      >
        <Icon name="lucide:rotate-ccw" class="mr-2 size-4" />
        Reset SVG Options
      </Button>
    </div>
  )
}
