import type { Component } from 'solid-js'

import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import { TextField, TextFieldInput } from '#/components/ui/text-field'
import { createEffect, on, Show } from 'solid-js'

import { ClearButton } from '../clear-button'

export interface ImageFileData {
  id: string
  file: File
  previewUrl: string
  origin?: { width: number, height: number }
  targetWidth?: number
  targetHeight?: number
}

interface ImageCardProps {
  image: ImageFileData
  aspectRatio?: boolean
  onUpdate: (id: string, updates: Partial<ImageFileData>) => void
  onRemove: (id: string) => void
}

export const ImageCard: Component<ImageCardProps> = (props) => {
  const handleWidthChange = (val: string) => {
    const width = val ? Number.parseInt(val) : undefined
    const updates: Partial<ImageFileData> = { targetWidth: width }

    if (props.aspectRatio && width && props.image.origin) {
      const aspectRatio = props.image.origin.width / props.image.origin.height
      updates.targetHeight = Math.round(width / aspectRatio)
    }

    props.onUpdate(props.image.id, updates)
  }

  const handleHeightChange = (val: string) => {
    const height = val ? Number.parseInt(val) : undefined
    const updates: Partial<ImageFileData> = { targetHeight: height }

    if (props.aspectRatio && height && props.image.origin) {
      const aspectRatio = props.image.origin.width / props.image.origin.height
      updates.targetWidth = Math.round(height * aspectRatio)
    }

    props.onUpdate(props.image.id, updates)
  }

  createEffect(
    on(
      () => props.image.origin,
      () => {
        props.onUpdate(
          props.image.id,
          {
            targetHeight: props.image.origin?.height,
            targetWidth: props.image.origin?.width,
          },
        )
      },
    ),
  )

  return (
    <div class="p-3 border rounded-lg flex flex-col gap-2 max-w-50 min-w-30 w-30%">
      <img
        src={props.image.previewUrl}
        alt={props.image.file.name}
        class="border rounded w-full aspect-square object-cover"
      />
      <div class="text-xs font-medium truncate" title={props.image.file.name}>
        {props.image.file.name}
      </div>
      <Show when={props.image.origin}>
        <div class="text-xs text-muted-foreground">
          {props.image.origin!.width} × {props.image.origin!.height}
        </div>
      </Show>

      <div class="mt-2 space-y-2">
        <TextField
          value={props.image.targetWidth ? `${props.image.targetWidth}` : ''}
          onChange={val => handleWidthChange(val)}
        >
          <TextFieldInput
            type="number"
            placeholder="Width"
            class="text-xs h-8"
          />
        </TextField>

        <TextField
          value={props.image.targetHeight ? `${props.image.targetHeight}` : ''}
          onChange={val => handleHeightChange(val)}
        >
          <TextFieldInput
            type="number"
            placeholder="Height"
            class="text-xs h-8"
          />
        </TextField>
      </div>

      <div class="mt-2 flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (props.image.origin) {
              props.onUpdate(props.image.id, {
                targetWidth: props.image.origin.width,
                targetHeight: props.image.origin.height,
              })
            }
          }}
          disabled={!props.image.origin}
          class="flex-1"
        >
          <Icon name="lucide:rotate-ccw" class="mr-2" />
          Reset
        </Button>
        <ClearButton
          size="sm"
          onClear={() => props.onRemove(props.image.id)}
          class="flex-1"
        />
      </div>
    </div>
  )
}
