import type { JSX } from 'solid-js'

import { CopyButton } from '#/components/copy-button'
import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import {
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { createMemo, createSignal, mergeProps, Show } from 'solid-js'

export interface EncoderLayoutProps {
  onEncode: (input: string) => string
  onDecode: (input: string) => string
  inputLabel?: string
  outputLabel?: string
  inputPlaceholder?: string
  outputPlaceholder?: string
}

export function EncoderLayout(rawProps: EncoderLayoutProps): JSX.Element {
  // 1. Efficient Default Props
  const props = mergeProps(
    {
      inputLabel: 'Input Text',
      outputLabel: 'Output',
      inputPlaceholder: 'Enter text to process...',
      outputPlaceholder: 'Result will appear here...',
    },
    rawProps,
  )

  const [input, setInput] = createSignal('')
  const [mode, setMode] = createSignal<'encode' | 'decode'>('encode')

  const isEncode = () => mode() === 'encode'

  // 2. Derived State (Replaces createEffect)
  // Calculates output only when input or mode changes.
  const computation = createMemo(() => {
    const value = input()
    if (!value) {
      return { result: '', error: null }
    }

    try {
      const result = isEncode()
        ? props.onEncode(value)
        : props.onDecode(value)
      return { result, error: null }
    } catch (err) {
      return {
        result: '',
        error: err instanceof Error ? err.message : 'Invalid input',
      }
    }
  })

  // 3. Smart Swap Logic
  const toggleMode = () => {
    const current = computation()

    // If we have a valid result, move it to input for a seamless workflow
    if (current.result && !current.error) {
      setInput(current.result)
    }

    setMode(prev => (prev === 'encode' ? 'decode' : 'encode'))
  }

  return (
    <div class="space-y-6 lg:space-y-0">
      <div class="gap-6 grid relative lg:grid-cols-2">

        {/* Left Panel (Input) */}
        <div class="space-y-4">
          <TextField>
            <TextFieldLabel class="!text-lg">
              {isEncode() ? props.inputLabel : props.outputLabel}
            </TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono h-64 resize-none"
              placeholder={isEncode() ? props.inputPlaceholder : props.outputPlaceholder}
              value={input()}
              onInput={e => setInput(e.currentTarget.value)}
            />
          </TextField>
          <div class="flex gap-2 items-center">
            <Button
              variant="destructive"
              onClick={() => setInput('')}
              disabled={!input()}
            >
              <Icon name="lucide:trash-2" class="mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Desktop Swap Button */}
        <div class="hidden left-1/2 top-1/3 absolute z-10 lg:block -translate-x-1/2 -translate-y-1/2">
          <Button
            onClick={toggleMode}
            size="icon"
            variant="outline"
            class="rounded-full bg-background size-10 shadow-md transition-transform hover:shadow-lg active:scale-95 hover:scale-105"
            title={`Switch to ${mode() === 'encode' ? 'decode' : 'encode'} mode`}
          >
            <Icon name="lucide:arrow-right-left" />
          </Button>

        </div>

        {/* Right Panel (Output) */}
        <div class="space-y-4">
          <TextField validationState={computation().error ? 'invalid' : 'valid'}>
            <TextFieldLabel class="!text-lg">
              {isEncode() ? props.outputLabel : props.inputLabel}
            </TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono bg-muted/50 h-64 resize-none focus-visible:ring-0"
              classList={{
                'text-destructive': !!computation().error,
                'text-muted-foreground': !computation().result && !computation().error,
              }}
              readOnly
              placeholder={isEncode() ? props.outputPlaceholder : props.inputPlaceholder}
              value={computation().error || computation().result}
            />
          </TextField>
          <CopyButton
            content={computation().result}
            disabled={!computation().result}
            variant="secondary"
          />
        </div>
      </div>
    </div>
  )
}
