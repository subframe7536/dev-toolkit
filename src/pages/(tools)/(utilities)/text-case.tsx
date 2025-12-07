import type { TextCaseStyle } from '#/utils/text-case'

import { Card } from '#/components/card'
import { CopyButton } from '#/components/copy-button'
import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import { TextField, TextFieldLabel, TextFieldTextArea } from '#/components/ui/text-field'
import { convertTextCase } from '#/utils/text-case'
import { createRoute } from 'solid-file-router'
import { createMemo, createSignal, For } from 'solid-js'

const CASE_STYLES: Array<{ value: TextCaseStyle, label: string, example: string }> = [
  { value: 'camelCase', label: 'camelCase', example: 'helloWorld' },
  { value: 'PascalCase', label: 'PascalCase', example: 'HelloWorld' },
  { value: 'snake_case', label: 'snake_case', example: 'hello_world' },
  { value: 'kebab-case', label: 'kebab-case', example: 'hello-world' },
  { value: 'CONSTANT_CASE', label: 'CONSTANT_CASE', example: 'HELLO_WORLD' },
  { value: 'dot.case', label: 'dot.case', example: 'hello.world' },
  { value: 'path/case', label: 'path/case', example: 'hello/world' },
  { value: 'Title Case', label: 'Title Case', example: 'Hello World' },
  { value: 'Sentence case', label: 'Sentence case', example: 'Hello world' },
  { value: 'lowercase', label: 'lowercase', example: 'helloworld' },
  { value: 'UPPERCASE', label: 'UPPERCASE', example: 'HELLOWORLD' },
  { value: 'aLtErNaTiNg CaSe', label: 'aLtErNaTiNg CaSe', example: 'hElLo WoRlD' },
]

export default createRoute({
  info: {
    title: 'Text Case Converter',
    description: 'Convert text between different case styles',
    category: 'Utilities',
    icon: 'lucide:case-sensitive',
    tags: ['text', 'case', 'converter', 'camelCase', 'snake_case', 'kebab-case'],
  },
  component: TextCase,
})

function TextCase() {
  const [input, setInput] = createSignal('')

  const handleClear = () => {
    setInput('')
  }

  return (
    <div class="flex flex-col gap-6">
      <div class="relative">
        <TextField value={input()} onChange={setInput}>
          <TextFieldLabel>Input Text</TextFieldLabel>
          <TextFieldTextArea
            class="font-mono h-36 resize-none"
            placeholder="Enter text to convert..."
          />
        </TextField>
        <Button
          variant="destructive"
          onClick={handleClear}
          disabled={!input()}
          class="right-0 top--4 absolute"
        >
          <Icon name="lucide:trash-2" class="mr-2 size-4" />
          Clear
        </Button>
      </div>

      <div class="gap-4 grid grid-cols-1 2xl:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3">
        <For each={CASE_STYLES}>
          {(style) => {
            const converted = createMemo(
              () => input() ? convertTextCase(input(), style.value) : '...',
            )

            return (
              <Card
                title={style.label}
                class="flex flex-col relative"
                description={`Example: ${style.example}`}
                content={(
                  <>
                    <div class="font-mono p-3 rounded-md bg-muted min-h-16 break-all">
                      {converted()}
                    </div>
                    <CopyButton
                      class="right-6 top-7 absolute"
                      content={converted()}
                      disabled={converted() !== '...'}
                      text={false}
                      size="sm"
                    />
                  </>
                )}
              />
            )
          } }
        </For>
      </div>
    </div>
  )
}
