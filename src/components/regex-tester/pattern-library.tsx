import type { PatternCategory, PatternDefinition } from '#/utils/regex/types'

import { Button, Dialog, Icon } from 'moraine'
import { useRegexContext } from '#/contexts'
import { getAllCategories } from '#/utils/regex/pattern-library'
import { createSignal, For } from 'solid-js'

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
      class="p-4 border border-border rounded-lg bg-card cursor-pointer transition-all hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm"
      onClick={handleClick}
    >
      <div class="mb-3">
        <h4 class="text-sm text-foreground font-semibold mb-1">{props.pattern.name}</h4>
        <p class="text-xs text-muted-foreground leading-relaxed">{props.pattern.description}</p>
      </div>

      {/* Pattern preview */}
      <div class="mb-3">
        <code class="text-xs text-primary font-mono px-2 py-1.5 rounded bg-muted/50 block break-all">
          {props.pattern.pattern}
        </code>
      </div>

      {/* Examples preview */}
      <div class="mb-3">
        <div class="text-xs text-muted-foreground font-medium mb-1">Examples:</div>
        <div class="space-y-1">
          <For each={props.pattern.examples.slice(0, 2)}>
            {example => (
              <div class="text-xs flex gap-2 items-center">
                <Icon
                  name={example.shouldMatch ? 'i-lucide-check' : 'i-lucide-x'}
                  class={example.shouldMatch ? 'text-green-500 size-3' : 'text-red-500 size-3'}
                />
                <code class="text-xs font-mono px-1 rounded bg-muted/30">{example.input}</code>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Tags */}
      <div class="flex flex-wrap gap-1">
        <For each={props.pattern.tags.slice(0, 3)}>
          {tag => (
            <span class="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">
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
        <h3 class="text-sm text-foreground font-semibold">{props.category.name}</h3>
        <span class="text-xs text-muted-foreground">({props.category.patterns.length})</span>
      </div>
      <p class="text-xs text-muted-foreground mb-4">{props.category.description}</p>

      <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
        <For each={props.category.patterns}>
          {pattern => (
            <PatternItem pattern={pattern} onSelect={props.onSelectPattern} />
          )}
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
    const allExamples = pattern.examples.map(ex => ex.input).join('\n')
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
      title={(
        <span class="flex gap-2 items-center">
          <Icon name="i-lucide-library" class="size-5" />
          Pattern Library
        </span>
      ) as any}
      description="Browse and load common regex patterns for validation, parsing, and more. Click any pattern to load it directly."
      body={(
        <div class="mt-6">
          <For each={categories}>
            {category => (
              <CategorySection category={category} onSelectPattern={handleSelectPattern} />
            )}
          </For>
          <div class="text-xs text-muted-foreground pt-4 text-center border-t border-border">
            {categories.reduce((sum, cat) => sum + cat.patterns.length, 0)} patterns across {categories.length} categories
          </div>
        </div>
      )}
      classes={{ content: 'max-h-[80vh] max-w-6xl overflow-y-auto' }}
    >
      <Button variant="secondary">
        <Icon name="i-lucide-library" class="mr-2 size-4" />
        Load Example
      </Button>
    </Dialog>
  )
}
