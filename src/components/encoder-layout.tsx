import type { JSX } from 'solid-js'

import { CopyButton } from '#/components/copy-button'
import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import {
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { cls } from 'cls-variant'
import { batch, createSignal, onCleanup } from 'solid-js'
import { toast } from 'solid-sonner'

export interface EncoderLayoutProps {
  mode: string
  onEncode: (input: string) => string
  onDecode: (input: string) => string
  inputLabel?: () => string | JSX.Element
  outputLabel?: () => string | JSX.Element
  inputPlaceholder?: () => string
  outputPlaceholder?: () => string
  modeToggleLabel?: () => string
  customControls?: JSX.Element
}

export function EncoderLayout(props: EncoderLayoutProps): JSX.Element {
  const [isEncode, setIsEncode] = createSignal(true)
  const [inputText, setInputText] = createSignal('')
  const [outputText, setOutputText] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  let errorToastTimer: ReturnType<typeof setTimeout> | null = null

  onCleanup(() => {
    if (errorToastTimer) {
      clearTimeout(errorToastTimer)
    }
  })

  // Debounced error toast
  const showErrorToast = (message: string) => {
    if (errorToastTimer) {
      clearTimeout(errorToastTimer)
    }
    errorToastTimer = setTimeout(() => {
      toast.error(message)
      errorToastTimer = null
    }, 500)
  }

  // Process input whenever it changes
  const handleInput = (value: string) => {
    setInputText(value)

    if (!value) {
      setOutputText('')
      setError(null)
      return
    }

    try {
      const result = isEncode()
        ? props.onEncode(value)
        : props.onDecode(value)
      setOutputText(result)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid input'
      setOutputText('')
      setError(errorMsg)
      showErrorToast(errorMsg)
    }
  }

  // Toggle between encode/decode and swap input/output
  const toggleMode = () => {
    batch(() => {
      setIsEncode(!isEncode())
      // Swap input and output
      const temp = inputText()
      setInputText(outputText())
      setOutputText(temp)
      setError(null)
    })
  }

  const clear = () => {
    batch(() => {
      setInputText('')
      setOutputText('')
      setError(null)
    })
  }

  const inputLabel = () => props.inputLabel?.() ?? (isEncode() ? 'Plain Text' : props.mode)
  const outputLabel = () => props.outputLabel?.() ?? (isEncode() ? props.mode : 'Plain Text')
  const inputPlaceholder = () => props.inputPlaceholder?.() ?? (isEncode()
    ? `Enter text to encode to ${props.mode}...`
    : `Enter ${props.mode} to decode...`)
  const outputPlaceholder = () => props.outputPlaceholder?.() ?? (isEncode()
    ? `${props.mode} output will appear here...`
    : 'Decoded text will appear here...')
  const modeToggleLabel = () => props.modeToggleLabel?.() ?? `Switch to ${isEncode() ? 'decode' : 'encode'} mode`

  return (
    <div class="space-y-6 lg:space-y-0">
      <div class="gap-6 grid relative lg:grid-cols-2">

        {/* Left Panel (Input) */}
        <div class="space-y-4">
          <TextField>
            {typeof inputLabel() === 'string'
              ? (
                  <TextFieldLabel class="!text-lg">
                    {inputLabel()}
                  </TextFieldLabel>
                )
              : inputLabel()}
            <TextFieldTextArea
              class="text-sm font-mono h-64 resize-none"
              placeholder={inputPlaceholder()}
              value={inputText()}
              onInput={e => handleInput(e.currentTarget.value)}
            />
          </TextField>
          <div class="flex gap-2 items-center justify-between lg:justify-start">
            {/* Mobile Swap Button */}
            <Button
              onClick={toggleMode}
              size="icon"
              variant="outline"
              class="p-2 rounded-full bg-background block shadow-md transition-transform lg:hidden hover:shadow-lg active:scale-95 hover:scale-105"
              title={modeToggleLabel()}
            >
              <Icon name="lucide:arrow-up-down" />
            </Button>
            {props.customControls}
            <Button
              variant="destructive"
              onClick={clear}
              disabled={!inputText()}
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
            class="rounded-full bg-background shadow-md transition-transform hover:shadow-lg active:scale-95 hover:scale-105"
            title={modeToggleLabel()}
          >
            <Icon name="lucide:arrow-right-left" />
          </Button>
        </div>

        {/* Right Panel (Output) */}
        <div class="flex flex-col gap-4 items-end lg:items-start">
          <TextField validationState={error() ? 'invalid' : 'valid'} class="w-full">
            {typeof outputLabel() === 'string'
              ? (
                  <TextFieldLabel class="!text-lg">
                    {outputLabel()}
                  </TextFieldLabel>
                )
              : outputLabel()}
            <TextFieldTextArea
              class={cls(
                'text-sm font-mono bg-muted/50 h-64 resize-none focus-visible:ring-0',
                error() ? 'text-destructive' : !outputText() && 'text-muted-foreground',
              )}
              readOnly
              placeholder={outputPlaceholder()}
              value={error() || outputText()}
            />
          </TextField>
          <CopyButton
            class="w-fit"
            content={outputText()}
            disabled={!outputText()}
            variant="secondary"
          />
        </div>
      </div>
    </div>
  )
}
