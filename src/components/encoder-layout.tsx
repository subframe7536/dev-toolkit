import { Field, Button, Textarea } from 'moraine'
import type { JSX } from 'solid-js'
import { batch, createEffect, createSignal, onCleanup } from 'solid-js'
import { toast } from 'solid-toaster'

import { CopyButton } from '#/components/copy-button'

import { ClearButton } from './clear-button'

export interface EncoderLayoutProps {
  mode: string
  onEncode: (input: string) => string
  onDecode: (input: string) => string
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

  // Track conversion options read by the callbacks as well as the input and mode.
  createEffect(() => {
    const value = inputText()
    if (errorToastTimer) {
      clearTimeout(errorToastTimer)
      errorToastTimer = null
    }
    if (!value) {
      setOutputText('')
      setError(null)
      return
    }

    try {
      const result = isEncode() ? props.onEncode(value) : props.onDecode(value)
      setOutputText(result)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid input'
      setOutputText('')
      setError(errorMsg)
      showErrorToast(errorMsg)
    }
  })

  // Toggle between encode/decode and swap input/output
  const toggleMode = () => {
    batch(() => {
      setIsEncode(!isEncode())
      // Swap input and output
      setInputText(outputText())
    })
  }

  const clear = () => {
    batch(() => {
      setInputText('')
      setOutputText('')
      setError(null)
    })
  }

  const inputLabel = () => (isEncode() ? 'Plain Text' : props.mode)
  const outputLabel = () => (isEncode() ? props.mode : 'Plain Text')
  const inputPlaceholder = () =>
    isEncode() ? `Enter text to encode to ${props.mode}...` : `Enter ${props.mode} to decode...`
  const outputPlaceholder = () =>
    isEncode() ? `${props.mode} output will appear here...` : 'Decoded text will appear here...'

  return (
    <div class="space-y-4">
      <div class="tool-editor-grid">
        <Field
          label={inputLabel()}
          classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
        >
          <Textarea
            classes={{ root: 'tool-editor' }}
            placeholder={inputPlaceholder()}
            value={inputText()}
            onValueChange={setInputText}
          />
        </Field>
        <Field
          label={outputLabel()}
          classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
        >
          <Textarea
            aria-invalid={!!error()}
            classes={{
              root: ['tool-editor bg-muted/30', error() && 'border-destructive text-destructive'],
            }}
            readOnly
            placeholder={outputPlaceholder()}
            value={error() || outputText()}
          />
        </Field>
      </div>
      <div class="tool-toolbar">
        <Button
          onClick={toggleMode}
          variant="outline"
          leading="i-lucide-arrow-right-left"
          title={`Switch to ${isEncode() ? 'decode' : 'encode'} mode`}
        >
          Switch to {isEncode() ? 'decode' : 'encode'}
        </Button>
        <CopyButton content={outputText()} disabled={!outputText()} variant="secondary" />
        <ClearButton onClear={clear} disabled={!inputText()} />
      </div>
    </div>
  )
}
