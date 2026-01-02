import type { RegexElementType } from '#/utils/regex/explanation-engine'
import type { RegexElement } from '#/utils/regex/types'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '#/components/ui/accordion'
import Icon from '#/components/ui/icon'
import { useRegexContext } from '#/contexts/regex-context'
import { explainPattern } from '#/utils/regex/explanation-engine'
import { createMemo, For, Show } from 'solid-js'

/**
 * Color mapping for different element types
 */
const ELEMENT_TYPE_COLORS: Record<RegexElementType, string> = {
  'literal': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  'quantifier': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'character-class': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'predefined-class': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'anchor': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'group': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'lookahead': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'lookbehind': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'alternation': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'escape': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'backreference': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'flag': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

/**
 * Icon mapping for different element types
 */
const ELEMENT_TYPE_ICONS: Record<RegexElementType, `lucide:${string}`> = {
  'literal': 'lucide:type',
  'quantifier': 'lucide:repeat',
  'character-class': 'lucide:brackets',
  'predefined-class': 'lucide:hash',
  'anchor': 'lucide:anchor',
  'group': 'lucide:parentheses',
  'lookahead': 'lucide:eye',
  'lookbehind': 'lucide:eye-off',
  'alternation': 'lucide:git-branch',
  'escape': 'lucide:corner-down-right',
  'backreference': 'lucide:link',
  'flag': 'lucide:flag',
}

/**
 * Human-readable labels for element types
 */
const ELEMENT_TYPE_LABELS: Record<RegexElementType, string> = {
  'literal': 'Literal',
  'quantifier': 'Quantifier',
  'character-class': 'Character Class',
  'predefined-class': 'Predefined Class',
  'anchor': 'Anchor',
  'group': 'Group',
  'lookahead': 'Lookahead',
  'lookbehind': 'Lookbehind',
  'alternation': 'Alternation',
  'escape': 'Escape',
  'backreference': 'Backreference',
  'flag': 'Flag',
}

interface ElementBadgeProps {
  element: RegexElement
}

function ElementBadge(props: ElementBadgeProps) {
  const type = () => props.element.type as RegexElementType
  const colorClass = () => ELEMENT_TYPE_COLORS[type()] || ELEMENT_TYPE_COLORS.literal
  const icon = () => ELEMENT_TYPE_ICONS[type()] || ELEMENT_TYPE_ICONS.literal
  const label = () => ELEMENT_TYPE_LABELS[type()] || 'Unknown'

  return (
    <div class="p-2 border border-border rounded-md bg-card transition-colors hover:bg-muted/50">
      <div class="flex gap-2 items-start">
        <span class={`text-xs font-medium px-2 py-0.5 rounded flex gap-1 items-center ${colorClass()}`}>
          <Icon name={icon()} class="size-3" />
          {label()}
        </span>
        <code class="text-sm font-mono font-semibold break-all">{props.element.value}</code>
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed mt-1.5">
        {props.element.description}
      </p>
    </div>
  )
}

export function ExplanationPanel() {
  const { store } = useRegexContext()

  const explanation = createMemo(() => explainPattern(store.pattern))

  const hasPattern = createMemo(() => store.pattern.length > 0)
  const hasElements = createMemo(() => explanation().elements.length > 0)

  return (
    <div class="p-4 space-y-4">
      {/* Overall description */}
      <div>
        <h3 class="text-md text-foreground font-medium mb-3 flex gap-2 items-center">
          <Icon name="lucide:info" class="size-4" />
          Pattern Explanation
        </h3>
        <Show
          when={hasPattern()}
          fallback={(
            <div class="text-sm text-muted-foreground p-4 border border-border rounded-md border-dashed bg-muted/20">
              Enter a regex pattern to see its explanation.
            </div>
          )}
        >
          <div class="text-sm text-foreground p-3 border border-border rounded-md bg-muted/20">
            {explanation().description}
          </div>
        </Show>
      </div>

      {/* Element breakdown */}
      <Show when={hasElements()}>
        <div>
          <h3 class="text-md text-foreground font-medium mb-3 flex gap-2 items-center">
            <Icon name="lucide:list" class="size-4" />
            Element Breakdown
          </h3>

          {/* Sequential element list */}
          <div class="mb-4 space-y-2">
            <div class="text-xs text-muted-foreground mb-2">
              Elements in order of appearance:
            </div>
            <div class="max-h-64 overflow-y-auto space-y-2">
              <For each={explanation().elements}>
                {element => <ElementBadge element={element} />}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
