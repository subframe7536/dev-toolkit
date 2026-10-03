import { Field, Button, InputNumber } from 'moraine'
import type { Component } from 'solid-js'
import { createEffect, on, Show } from 'solid-js'

import { ClearButton } from '../clear-button'

export interface ImageFileData {
  id: string
  file: File
  previewUrl: string
  origin?: { width: number; height: number }
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
        props.onUpdate(props.image.id, {
          targetHeight: props.image.origin?.height,
          targetWidth: props.image.origin?.width,
        })
      },
    ),
  )

  return (
    <div class="flex flex-col gap-2 min-w-0">
      <img
        src={props.image.previewUrl}
        alt={props.image.file.name}
        class="border rounded w-full aspect-square object-cover"
      />
      <div class="font-medium truncate text-xs" title={props.image.file.name}>
        {props.image.file.name}
      </div>
      <Show when={props.image.origin}>
        <div class="text-muted-foreground text-xs">
          {props.image.origin!.width} × {props.image.origin!.height}
        </div>
      </Show>

      <div class="mt-2 space-y-2">
        <Field hiddenLabel={`Width for ${props.image.file.name}`} classes={{ root: 'min-w-0' }}>
          <InputNumber
            orientation="vertical"
            placeholder="Width"
            classes={{ root: 'h-8', input: 'text-xs' }}
            value={props.image.targetWidth ? `${props.image.targetWidth}` : ''}
            onValueChange={handleWidthChange}
            onInput={(event) => {
              if (event.target instanceof HTMLInputElement && event.target.value === '') {
                handleWidthChange('')
              }
            }}
          />
        </Field>

        <Field hiddenLabel={`Height for ${props.image.file.name}`} classes={{ root: 'min-w-0' }}>
          <InputNumber
            orientation="vertical"
            placeholder="Height"
            classes={{ root: 'h-8', input: 'text-xs' }}
            value={props.image.targetHeight ? `${props.image.targetHeight}` : ''}
            onValueChange={handleHeightChange}
            onInput={(event) => {
              if (event.target instanceof HTMLInputElement && event.target.value === '') {
                handleHeightChange('')
              }
            }}
          />
        </Field>
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
          classes={{ root: 'flex-1' }}
          leading="i-lucide-rotate-ccw"
        >
          Reset
        </Button>
        <ClearButton size="sm" onClear={() => props.onRemove(props.image.id)} class="flex-1" />
      </div>
    </div>
  )
}
