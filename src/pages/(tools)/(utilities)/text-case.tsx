import { Field, Textarea } from 'moraine'
import { createRoute } from 'solid-file-router'
import { createMemo, createSignal, For } from 'solid-js'

import { Card } from '#/components/card'
import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import type { TextCaseStyle } from '#/utils/text-case'
import { convertTextCase } from '#/utils/text-case'

const CASE_STYLES: Array<{ value: TextCaseStyle; label: string; example: string }> = [
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
    icon: 'i-lucide-case-sensitive',
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
      <Field
        label="Input Text"
        classes={{
          root: 'min-w-0',
          label: 'font-medium text-sm',
          labelWrapper: 'tool-panel-heading',
        }}
        hint={<ClearButton onClear={handleClear} disabled={!input()} size="sm" />}
      >
        <Textarea
          value={input()}
          modelModifiers={{ lazy: true }}
          onValueChange={setInput}
          classes={{ root: 'text-sm leading-relaxed font-mono h-36 resize-y' }}
          placeholder="Enter text to convert..."
        />
      </Field>

      <div class="gap-4 grid grid-cols-1 2xl:grid-cols-3 lg:grid-cols-2">
        <For each={CASE_STYLES}>
          {(style) => {
            const converted = createMemo(() =>
              input() ? convertTextCase(input(), style.value) : '...',
            )

            return (
              <Card
                title={style.label}
                class="flex flex-col"
                description={`Example: ${style.example}`}
                content={
                  <div class="p-3 bg-muted flex gap-2 min-h-16 items-start rounded-md">
                    <div class="leading-relaxed font-mono flex-1 min-w-0 break-all text-sm">
                      {converted()}
                    </div>
                    <CopyButton
                      class="shrink-0"
                      content={converted()}
                      disabled={!input()}
                      text={false}
                      variant="ghost"
                      size="sm"
                    />
                  </div>
                }
              />
            )
          }}
        </For>
      </div>
    </div>
  )
}
