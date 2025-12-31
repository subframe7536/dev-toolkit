import type { PatternCategory, PatternDefinition } from '#/utils/regex/types'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '#/components/ui/accordion'
import { Button } from '#/components/ui/button'
import { useRegexContext } from '#/contexts'
import { getAllCategories } from '#/utils/regex/pattern-library'
import { createSignal, For, Show } from 'solid-js'

import Icon from '../ui/icon'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'

// Category icons mapping
const CATEGORY_ICONS: Record<string, `lucide:${string}`> = {
  validation: 'lucide:check-circle',
  phone: 'lucide:phone',
  dates: 'lucide:calendar',
  identifiers: 'lucide:hash',
  text: 'lucide:type',
  programming: 'lucide:code',
}

interface PatternItemProps {
  pattern: PatternDefinition
  onSelect: (pattern: PatternDefinition) => void
}

function PatternItem(props: PatternItemProps) {
  return (
    <div
      class="p-3 border border-border rounded-md bg-card cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => props.onSelect(props.pattern)}
    >
      <div class="flex gap-2 items-start justify-between">
        <div class="flex-1 min-w-0">
          <h4 class="text-sm text-foreground font-medium">{props.pattern.name}</h4>
          <p class="text-xs text-muted-foreground mt-1 line-clamp-2">{props.pattern.description}</p>
        </div>
        <Button variant="ghost" size="sm" class="shrink-0">
          <Icon name="lucide:plus" class="size-4" />
        </Button>
      </div>

      {/* Pattern preview */}
      <code class="text-xs text-primary/80 font-mono mt-2 px-2 py-1 rounded bg-muted/30 block truncate">
        {props.pattern.pattern}
      </code>

      {/* Tags */}
      <div class="mt-2 flex flex-wrap gap-1">
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
  const icon = () => CATEGORY_ICONS[props.category.id] || 'lucide:folder'

  return (
    <AccordionItem value={props.category.id} class="border border-border rounded-md overflow-hidden">
      <AccordionTrigger class="text-sm px-3 py-2 hover:bg-muted/50">
        <span class="flex gap-2 items-center">
          <Icon name={icon()} class="text-muted-foreground size-4" />
          {props.category.name}
          <span class="text-xs text-muted-foreground">({props.category.patterns.length})</span>
        </span>
      </AccordionTrigger>
      <AccordionContent class="px-3 pb-3">
        <p class="text-xs text-muted-foreground mb-3">{props.category.description}</p>
        <div class="space-y-2">
          <For each={props.category.patterns}>
            {pattern => (
              <PatternItem pattern={pattern} onSelect={props.onSelectPattern} />
            )}
          </For>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

interface PatternLibrarySheetProps {
  onPatternLoaded?: (pattern: PatternDefinition) => void
}

/**
 * Pattern Library Sheet - Slide-out panel for browsing and selecting regex patterns
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function PatternLibrarySheet(props: PatternLibrarySheetProps) {
  const { actions } = useRegexContext()
  const [isOpen, setIsOpen] = createSignal(false)
  const [selectedPattern, setSelectedPattern] = createSignal<PatternDefinition | null>(null)

  const categories = getAllCategories()

  const handleSelectPattern = (pattern: PatternDefinition) => {
    setSelectedPattern(pattern)
  }

  const handleLoadPattern = () => {
    const pattern = selectedPattern()
    if (!pattern) {
      return
    }

    // Load pattern into the regex tester
    actions.setPattern(pattern.pattern)
    actions.setFlags(pattern.flags)

    // Optionally set example test text from first matching example
    const matchingExample = pattern.examples.find(ex => ex.shouldMatch)
    if (matchingExample) {
      actions.setTestText(matchingExample.input)
    }

    // Notify parent if callback provided
    props.onPatternLoaded?.(pattern)

    // Close the sheet
    setIsOpen(false)
    setSelectedPattern(null)
  }

  const handleCancelSelection = () => {
    setSelectedPattern(null)
  }

  return (
    <Sheet open={isOpen()} onOpenChange={setIsOpen}>
      <SheetTrigger as={Button} variant="secondary">
        <Icon name="lucide:library" class="mr-2 size-4" />
        Load Example
      </SheetTrigger>
      <SheetContent position="right" class="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle class="flex gap-2 items-center">
            <Icon name="lucide:library" class="size-5" />
            Pattern Library
          </SheetTitle>
          <SheetDescription>
            Browse and load common regex patterns for validation, parsing, and more.
          </SheetDescription>
        </SheetHeader>

        <div class="mt-4 space-y-4">
          {/* Selected pattern preview */}
          <Show when={selectedPattern()}>
            {pattern => (
              <div class="p-4 border border-primary/50 rounded-lg bg-primary/5">
                <div class="mb-2 flex gap-2 items-start justify-between">
                  <h4 class="text-sm text-foreground font-semibold">{pattern().name}</h4>
                  <Button variant="ghost" size="sm" onClick={handleCancelSelection}>
                    <Icon name="lucide:x" class="size-4" />
                  </Button>
                </div>
                <p class="text-xs text-muted-foreground mb-3">{pattern().description}</p>

                {/* Pattern code */}
                <div class="mb-3">
                  <label class="text-xs text-muted-foreground font-medium">Pattern:</label>
                  <code class="text-xs text-primary font-mono mt-1 px-2 py-1.5 rounded bg-muted/50 block break-all">
                    {pattern().pattern}
                  </code>
                </div>

                {/* Examples */}
                <div class="mb-3">
                  <label class="text-xs text-muted-foreground font-medium">Examples:</label>
                  <div class="mt-1 space-y-1">
                    <For each={pattern().examples}>
                      {example => (
                        <div class="text-xs flex gap-2 items-center">
                          <Icon
                            name={example.shouldMatch ? 'lucide:check' : 'lucide:x'}
                            class={example.shouldMatch ? 'text-green-500 size-3' : 'text-red-500 size-3'}
                          />
                          <code class="font-mono px-1 rounded bg-muted/30">{example.input}</code>
                          <span class="text-muted-foreground">- {example.description}</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>

                {/* Load button */}
                <Button variant="default" size="sm" class="w-full" onClick={handleLoadPattern}>
                  <Icon name="lucide:download" class="mr-2 size-4" />
                  Load Pattern
                </Button>
              </div>
            )}
          </Show>

          {/* Category accordion */}
          <Accordion multiple collapsible class="space-y-2">
            <For each={categories}>
              {category => (
                <CategorySection category={category} onSelectPattern={handleSelectPattern} />
              )}
            </For>
          </Accordion>

          {/* Pattern count info */}
          <div class="text-xs text-muted-foreground pt-2 text-center border-t border-border">
            {categories.reduce((sum, cat) => sum + cat.patterns.length, 0)} patterns across {categories.length} categories
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
