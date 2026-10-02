import { Button, Dialog, Icon } from 'moraine'
import { createSignal, For } from 'solid-js'

import { useRegexContext } from '#/contexts'
import { getAllCategories } from '#/utils/regex/pattern-library'
import type { PatternCategory, PatternDefinition } from '#/utils/regex/types'

// Category icons mapping
const CATEGORY_ICONS: Record<string, `i-lucide-${string}`> = {
  validation: 'i-lucide-check-circle',
  phone: 'i-lucide-phone',
  dates: 'i-lucide-calendar',
  identifiers: 'i-lucide-hash',
  text: 'i-lucide-type',
  programming: 'i-lucide-code',
}

interface PatternItemProps {
  pattern: PatternDefinition
  onSelect: (pattern: PatternDefinition) => void
}

function PatternItem(props: PatternItemProps) {
  const handleClick = () => {
    props.onSelect(props.pattern)
  }

  return (
    <div
      class="p-4 border border-border bg-card cursor-pointer transition-all rounded-lg hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm"
      onClick={handleClick}
    >
      <div class="mb-3">
        <h4 class="text-foreground font-semibold mb-1 text-sm">{props.pattern.name}</h4>
        <p class="text-muted-foreground leading-relaxed text-xs">{props.pattern.description}</p>
      </div>

      {/* Pattern preview */}
      <div class="mb-3">
        <code class="text-primary font-mono px-2 py-1.5 rounded bg-muted/50 block break-all text-xs">
          {props.pattern.pattern}
        </code>
      </div>

      {/* Examples preview */}
      <div class="mb-3">
        <div class="text-muted-foreground font-medium mb-1 text-xs">Examples:</div>
        <div class="space-y-1">
          <For each={props.pattern.examples.slice(0, 2)}>
            {(example) => (
              <div class="flex gap-2 items-center text-xs">
                <Icon
                  name={example.shouldMatch ? 'i-lucide-check' : 'i-lucide-x'}
                  class={example.shouldMatch ? 'text-green-500 size-3' : 'text-red-500 size-3'}
                />
                <code class="font-mono px-1 rounded bg-muted/30 text-xs">{example.input}</code>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Tags */}
      <div class="flex flex-wrap gap-1">
        <For each={props.pattern.tags.slice(0, 3)}>
          {(tag) => (
            <span class="text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50 text-xs">
              {tag}
            </span>
          )}
        </For>
      </div>
    </div>
  )
}

interface CategorySectionProps {
  category: PatternCategory
  onSelectPattern: (pattern: PatternDefinition) => void
}

function CategorySection(props: CategorySectionProps) {
  const icon = () => CATEGORY_ICONS[props.category.id] || 'i-lucide-folder'

  return (
    <div class="mb-6">
      <div class="mb-3 flex gap-2 items-center">
        <Icon name={icon()} class="text-muted-foreground size-4" />
        <h3 class="text-foreground font-semibold text-sm">{props.category.name}</h3>
        <span class="text-muted-foreground text-xs">({props.category.patterns.length})</span>
      </div>
      <p class="text-muted-foreground mb-4 text-xs">{props.category.description}</p>

      <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
        <For each={props.category.patterns}>
          {(pattern) => <PatternItem pattern={pattern} onSelect={props.onSelectPattern} />}
        </For>
      </div>
    </div>
  )
}

interface PatternLibraryDialogProps {
  onPatternLoaded?: (pattern: PatternDefinition) => void
}

/**
 * Pattern Library Dialog - Modal for browsing and selecting regex patterns
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function PatternLibraryDialog(props: PatternLibraryDialogProps) {
  const { actions } = useRegexContext()
  const [isOpen, setIsOpen] = createSignal(false)

  const categories = getAllCategories()

  const handleSelectPattern = (pattern: PatternDefinition) => {
    // Load pattern directly into the regex tester
    actions.setPattern(pattern.pattern)
    actions.setFlags(pattern.flags)

    // Load all examples as test text (matching and non-matching)
    const allExamples = pattern.examples.map((ex) => ex.input).join('\n')
    actions.setTestText(allExamples)

    // Notify parent if callback provided
    props.onPatternLoaded?.(pattern)

    // Close the dialog
    setIsOpen(false)
  }

  return (
    <Dialog
      open={isOpen()}
      onOpenChange={setIsOpen}
      classes={{ content: 'max-h-[80vh] max-w-6xl overflow-y-auto' }}
    >
      <Dialog.Trigger as={Button} variant="secondary" leading="i-lucide-library">
        Load Example
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>
            <span class="flex gap-2 items-center">
              <Icon name="i-lucide-library" class="size-5" />
              Pattern Library
            </span>
          </Dialog.Title>
          <Dialog.Description>
            Browse and load common regex patterns for validation, parsing, and more. Click any
            pattern to load it directly.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>
          <div class="mt-6">
            <For each={categories}>
              {(category) => (
                <CategorySection category={category} onSelectPattern={handleSelectPattern} />
              )}
            </For>
            <div class="text-muted-foreground pt-4 text-center border-t border-border text-xs">
              {categories.reduce((sum, cat) => sum + cat.patterns.length, 0)} patterns across{' '}
              {categories.length} categories
            </div>
          </div>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  )
}
