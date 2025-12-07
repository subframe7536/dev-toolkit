import type { HashAlgorithm } from '#/utils/hash'

import { Card } from '#/components/card'
import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { FileUpload } from '#/components/file-upload'
import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import {
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from '#/components/ui/tabs'
import {
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { generateHash } from '#/utils/hash'
import { cls } from 'cls-variant'
import { createRoute } from 'solid-file-router'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { toast } from 'solid-sonner'

const ALGORITHMS: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

interface HashResult {
  algorithm: HashAlgorithm
  hash: string
}

export default createRoute({
  info: {
    title: 'Hash Generator',
    description: 'Generate hash strings using various algorithms',
    category: 'Utilities',
    icon: 'lucide:hash',
    tags: ['hash', 'sha', 'checksum', 'digest'],
  },
  component: HashGenerator,
})

function HashGenerator() {
  const [inputMode, setInputMode] = createSignal<'text' | 'file'>('text')
  const [textInput, setTextInput] = createSignal('')
  const [file, setFile] = createSignal<File | undefined>(undefined)
  const [results, setResults] = createSignal<HashResult[]>([])
  const [isGenerating, setIsGenerating] = createSignal(false)
  const [verifyHash, setVerifyHash] = createSignal('')

  const handleGenerate = async () => {
    const mode = inputMode()
    const input = mode === 'text' ? textInput() : file()

    if (!input) {
      toast.error(mode === 'text' ? 'Please enter text to hash' : 'Please select a file')
      return
    }

    setIsGenerating(true)
    try {
      const hashes = await Promise.all(
        ALGORITHMS.map(async (algorithm) => {
          const hash = await generateHash(input as string, algorithm)
          return { algorithm, hash }
        }),
      )
      setResults(hashes)
    } catch (error) {
      toast.error('Failed to generate hashes')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClear = () => {
    setTextInput('')
    setFile(undefined)
    setResults([])
    setVerifyHash('')
    toast.info('Cleared all data')
  }

  const isHashMatch = (hash: string) => {
    const verify = verifyHash().trim().toLowerCase()
    if (!verify) {
      return undefined
    }
    return hash.toLowerCase() === verify
  }

  const handleInputModeChange = (value: string) => {
    setInputMode(value as 'text' | 'file')
  }

  return (
    <div class="gap-6 grid grid-cols-1 lg:grid-cols-[auto_1fr]">
      <div class="flex flex-col gap-6 lg:w-96">
        <Tabs value={inputMode()} onChange={handleInputModeChange}>
          <TabsList>
            <TabsTrigger value="text">Text Input</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsIndicator />
          </TabsList>

          <TabsContent value="text">
            <TextField class="mt-4">
              <TextFieldLabel>Text to Hash</TextFieldLabel>
              <TextFieldTextArea
                value={textInput()}
                onInput={e => setTextInput((e.target as HTMLTextAreaElement).value)}
                placeholder="Enter text to generate hash..."
                rows={10}
                class="text-sm font-mono resize-y"
              />
            </TextField>
          </TabsContent>

          <TabsContent value="file">
            <div class="mt-4">
              <FileUpload
                file={file()}
                setFile={setFile}
                multiple={false}
              />
              <Show when={file()}>
                <div class="text-sm text-muted-foreground mt-2">
                  Selected: {file()!.name} ({(file()!.size / 1024).toFixed(2)} KB)
                </div>
              </Show>
            </div>
          </TabsContent>
        </Tabs>

        <div class="flex gap-6">
          <Button
            class="flex-1"
            onClick={handleGenerate}
            disabled={isGenerating()}
          >
            <Icon name="lucide:refresh-cw" class="mr-2 size-4" />
            {isGenerating() ? 'Generating...' : 'Generate'}
          </Button>
          <ClearButton
            class="flex-1"
            onClear={handleClear}
            disabled={results().length === 0 && !textInput() && !file()}
          />
        </div>
      </div>

      <Show
        when={results().length > 0}
        fallback={(
          <div class="text-muted-foreground p-12 text-center border rounded-lg border-dashed flex items-center justify-center">
            <div>
              <Icon name="lucide:hash" class="mx-auto mb-4 opacity-50 size-12" />
              <p>Enter text or upload a file, then click "Generate"</p>
            </div>
          </div>
        )}
      >
        <Card
          title="Generated Hashes"
          content={(
            <div class="flex flex-col gap-4">
              <TextField>
                <TextFieldLabel>Verify Hash (Optional)</TextFieldLabel>
                <TextFieldTextArea
                  value={verifyHash()}
                  onInput={e => setVerifyHash((e.target as HTMLTextAreaElement).value)}
                  placeholder="Paste a hash to verify against generated hashes..."
                  rows={2}
                  class="text-sm font-mono resize-y"
                />
              </TextField>

              <div class="flex flex-col gap-3">
                <For each={results()}>
                  {(result) => {
                    const match = createMemo(() => isHashMatch(result.hash))
                    return (
                      <div
                        class={cls(
                          'p-2 border rounded-lg flex gap-2 items-center',
                          match() === true
                            ? 'bg-green-500/10 border-green-500/50'
                            : match() === false
                              ? 'bg-red-500/5 border-red-500/20'
                              : 'bg-muted/30',
                        )}
                      >
                        <div class="flex-1">
                          <div class="mb-0.5 flex gap-1 items-center">
                            <div class="text-sm text-muted-foreground font-medium select-none uppercase">
                              {result.algorithm}
                            </div>
                            <Show when={match()}>
                              <Icon name="lucide:check" class="text-sm text-green-600" />
                            </Show>
                          </div>
                          <code class="text-sm font-mono break-all">{result.hash}</code>
                        </div>
                        <CopyButton
                          content={result.hash}
                          variant="ghost"
                          size="sm"
                          text={false}
                        />
                      </div>
                    )
                  }}
                </For>
              </div>
            </div>
          )}
        />
      </Show>
    </div>
  )
}
