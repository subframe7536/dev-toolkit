import { Button, Icon, Textarea } from 'moraine'
import type { JSX } from 'solid-js'
import { batch, createSignal, onCleanup } from 'solid-js'
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

  // Process input whenever it changes
  const handleInput = (value: string) => {
    setInputText(value)

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

  const inputLabel = () => (isEncode() ? 'Plain Text' : props.mode)
  const outputLabel = () => (isEncode() ? props.mode : 'Plain Text')
  const inputPlaceholder = () =>
    isEncode() ? `Enter text to encode to ${props.mode}...` : `Enter ${props.mode} to decode...`
  const outputPlaceholder = () =>
    isEncode() ? `${props.mode} output will appear here...` : 'Decoded text will appear here...'

  return (
    <div>
      <div class="gap-6 grid relative lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left Panel (Input) */}
        <div class="gap-3 grid">
          <label class="text-lg leading-8 font-medium">{inputLabel()}</label>
          <Textarea
            classes={{
              root: 'h-80 w-full md:h-100',
              input: 'text-sm font-mono resize-none',
            }}
            placeholder={inputPlaceholder()}
            value={inputText()}
            onInput={(e) => handleInput(e.currentTarget.value)}
          />
          <div class="flex gap-2 items-center justify-between lg:justify-start">
            {/* Mobile Swap Button */}
            <Button
              onClick={toggleMode}
              size="icon-md"
              variant="outline"
              classes={{ root: 'p-1.5 rounded-full bg-background block shadow-md lg:hidden' }}
              title={`Switch to ${isEncode() ? 'decode' : 'encode'} mode`}
            >
              <Icon name="i-lucide-arrow-up-down" />
            </Button>
            <ClearButton onClear={clear} disabled={!inputText()} />
          </div>
        </div>

        {/* Desktop Swap Button */}
        <div class="hidden left-1/2 top-[calc(2rem+12.5rem)] absolute z-10 lg:block -translate-x-1/2 -translate-y-1/2">
          <Button
            onClick={toggleMode}
            size="icon-md"
            variant="outline"
            classes={{ root: 'rounded-full bg-background shadow-md' }}
            title={`Switch to ${isEncode() ? 'decode' : 'encode'} mode`}
          >
            <Icon name="i-lucide-arrow-right-left" />
          </Button>
        </div>

        {/* Right Panel (Output) */}
        <div class="gap-3 grid">
          <label class="text-lg leading-8 font-medium">{outputLabel()}</label>
          <Textarea
            classes={{
              root: ['w-full h-80 md:h-100', error() && 'border-destructive'],
              input: [
                'text-sm font-mono resize-none focus-visible:ring-0',
                error() ? 'text-destructive' : !outputText() && 'text-muted-foreground',
              ],
            }}
            readOnly
            placeholder={outputPlaceholder()}
            value={error() || outputText()}
          />
          <div class="flex justify-end lg:justify-start">
            <CopyButton
              class="w-fit"
              content={outputText()}
              disabled={!outputText()}
              variant="secondary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
