import { For } from 'solid-js'

import Icon from '../ui/icon'

/**
 * Regex syntax reference data
 */
interface SyntaxItem {
  syntax: string
  description: string
  example?: string
  exampleMatch?: string
}

interface SyntaxCategory {
  id: string
  title: string
  icon: `lucide:${string}`
  items: SyntaxItem[]
}

const SYNTAX_REFERENCE: SyntaxCategory[] = [
  {
    id: 'character-classes',
    title: 'Character Classes',
    icon: 'lucide:brackets',
    items: [
      { syntax: '[abc]', description: 'Match any character in the set', example: '[aeiou]', exampleMatch: 'Matches vowels' },
      { syntax: '[^abc]', description: 'Match any character NOT in the set', example: '[^0-9]', exampleMatch: 'Matches non-digits' },
      { syntax: '[a-z]', description: 'Match any character in the range', example: '[A-Za-z]', exampleMatch: 'Matches letters' },
      { syntax: '.', description: 'Match any character except newline', example: 'a.c', exampleMatch: 'Matches "abc", "a1c"' },
      { syntax: '\\d', description: 'Match any digit (0-9)', example: '\\d{3}', exampleMatch: 'Matches "123"' },
      { syntax: '\\D', description: 'Match any non-digit', example: '\\D+', exampleMatch: 'Matches "abc"' },
      { syntax: '\\w', description: 'Match word character (a-z, A-Z, 0-9, _)', example: '\\w+', exampleMatch: 'Matches "hello_123"' },
      { syntax: '\\W', description: 'Match non-word character', example: '\\W', exampleMatch: 'Matches "@", " "' },
      { syntax: '\\s', description: 'Match whitespace (space, tab, newline)', example: '\\s+', exampleMatch: 'Matches spaces' },
      { syntax: '\\S', description: 'Match non-whitespace', example: '\\S+', exampleMatch: 'Matches "hello"' },
    ],
  },
  {
    id: 'quantifiers',
    title: 'Quantifiers',
    icon: 'lucide:repeat',
    items: [
      { syntax: '*', description: 'Match 0 or more times (greedy)', example: 'a*', exampleMatch: 'Matches "", "a", "aaa"' },
      { syntax: '+', description: 'Match 1 or more times (greedy)', example: 'a+', exampleMatch: 'Matches "a", "aaa"' },
      { syntax: '?', description: 'Match 0 or 1 time (optional)', example: 'colou?r', exampleMatch: 'Matches "color", "colour"' },
      { syntax: '{n}', description: 'Match exactly n times', example: '\\d{4}', exampleMatch: 'Matches "2024"' },
      { syntax: '{n,}', description: 'Match n or more times', example: '\\d{2,}', exampleMatch: 'Matches "12", "123"' },
      { syntax: '{n,m}', description: 'Match between n and m times', example: '\\d{2,4}', exampleMatch: 'Matches "12", "1234"' },
      { syntax: '*?', description: 'Match 0 or more times (non-greedy)', example: '<.*?>', exampleMatch: 'Matches shortest tag' },
      { syntax: '+?', description: 'Match 1 or more times (non-greedy)', example: '".+?"', exampleMatch: 'Matches shortest quoted' },
    ],
  },
  {
    id: 'anchors',
    title: 'Anchors',
    icon: 'lucide:anchor',
    items: [
      { syntax: '^', description: 'Match start of string/line', example: '^Hello', exampleMatch: 'Matches "Hello" at start' },
      { syntax: '$', description: 'Match end of string/line', example: 'world$', exampleMatch: 'Matches "world" at end' },
      { syntax: '\\b', description: 'Match word boundary', example: '\\bword\\b', exampleMatch: 'Matches whole word "word"' },
      { syntax: '\\B', description: 'Match non-word boundary', example: '\\Bword', exampleMatch: 'Matches "sword" but not "word"' },
    ],
  },
  {
    id: 'groups',
    title: 'Groups & Capturing',
    icon: 'lucide:parentheses',
    items: [
      { syntax: '(abc)', description: 'Capture group - captures matched text', example: '(\\d+)-(\\d+)', exampleMatch: 'Captures "123" and "456"' },
      { syntax: '(?:abc)', description: 'Non-capturing group', example: '(?:https?://)', exampleMatch: 'Groups without capturing' },
      { syntax: '(?<name>abc)', description: 'Named capture group', example: '(?<year>\\d{4})', exampleMatch: 'Captures as "year"' },
      { syntax: '\\1, \\2', description: 'Backreference to capture group', example: '(\\w+)\\s+\\1', exampleMatch: 'Matches "the the"' },
      { syntax: '\\k<name>', description: 'Named backreference', example: '(?<word>\\w+)\\s+\\k<word>', exampleMatch: 'Matches repeated word' },
      { syntax: '(a|b)', description: 'Alternation - match a OR b', example: '(cat|dog)', exampleMatch: 'Matches "cat" or "dog"' },
    ],
  },
  {
    id: 'lookaround',
    title: 'Lookahead & Lookbehind',
    icon: 'lucide:eye',
    items: [
      { syntax: '(?=abc)', description: 'Positive lookahead - match if followed by', example: '\\d+(?=px)', exampleMatch: 'Matches "10" in "10px"' },
      { syntax: '(?!abc)', description: 'Negative lookahead - match if NOT followed by', example: '\\d+(?!px)', exampleMatch: 'Matches "10" not before "px"' },
      { syntax: '(?<=abc)', description: 'Positive lookbehind - match if preceded by', example: '(?<=\\$)\\d+', exampleMatch: 'Matches "100" in "$100"' },
      { syntax: '(?<!abc)', description: 'Negative lookbehind - match if NOT preceded by', example: '(?<!\\$)\\d+', exampleMatch: 'Matches "100" not after "$"' },
    ],
  },
  {
    id: 'escapes',
    title: 'Special Characters & Escapes',
    icon: 'lucide:corner-down-right',
    items: [
      { syntax: '\\', description: 'Escape special character', example: '\\.', exampleMatch: 'Matches literal "."' },
      { syntax: '\\n', description: 'Newline character', example: 'line1\\nline2', exampleMatch: 'Matches across lines' },
      { syntax: '\\t', description: 'Tab character', example: '\\t+', exampleMatch: 'Matches tabs' },
      { syntax: '\\r', description: 'Carriage return', example: '\\r\\n', exampleMatch: 'Matches Windows line ending' },
      { syntax: '\\xHH', description: 'Hexadecimal character', example: '\\x41', exampleMatch: 'Matches "A"' },
      { syntax: '\\uHHHH', description: 'Unicode character', example: '\\u00A9', exampleMatch: 'Matches "©"' },
    ],
  },
  {
    id: 'flags',
    title: 'Flags',
    icon: 'lucide:flag',
    items: [
      { syntax: 'g', description: 'Global - find all matches', example: '/a/g', exampleMatch: 'Finds all "a" in text' },
      { syntax: 'i', description: 'Case-insensitive matching', example: '/hello/i', exampleMatch: 'Matches "Hello", "HELLO"' },
      { syntax: 'm', description: 'Multiline - ^ and $ match line boundaries', example: '/^line/m', exampleMatch: 'Matches start of each line' },
      { syntax: 's', description: 'Dotall - . matches newlines too', example: '/a.b/s', exampleMatch: 'Matches "a\\nb"' },
      { syntax: 'u', description: 'Unicode - enable full Unicode support', example: '/\\p{L}/u', exampleMatch: 'Matches any letter' },
      { syntax: 'y', description: 'Sticky - match at exact position', example: '/a/y', exampleMatch: 'Matches only at lastIndex' },
    ],
  },
]

function SyntaxItemRow(props: { item: SyntaxItem }) {
  return (
    <div class="py-2 border-b border-border/50 flex gap-3 last:border-b-0">
      <code class="text-sm text-primary font-mono font-semibold shrink-0 min-w-16">
        {props.item.syntax}
      </code>
      <div class="flex-1 min-w-0">
        <div class="text-sm text-foreground">{props.item.description}</div>
        {props.item.example && (
          <div class="text-xs text-muted-foreground mt-0.5">
            <code class="px-1 rounded bg-muted/50">{props.item.example}</code>
            {props.item.exampleMatch && (
              <span class="ml-1">→ {props.item.exampleMatch}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function HelpPanel() {
  return (
    <div class="p-4">
      <h3 class="text-md text-foreground font-medium mb-4 flex gap-2 items-center">
        <Icon name="lucide:book-open" class="size-4" />
        Regex Syntax Reference
      </h3>

      <div class="space-y-6">
        <For each={SYNTAX_REFERENCE}>
          {category => (
            <div class="space-y-3">
              <h4 class="text-sm text-foreground font-semibold flex gap-2 items-center">
                <Icon name={category.icon} class="text-muted-foreground size-4" />
                {category.title}
                <span class="text-xs text-muted-foreground font-normal">({category.items.length})</span>
              </h4>

              <div class="space-y-2">
                <For each={category.items}>
                  {item => <SyntaxItemRow item={item} />}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>

      <div class="text-xs text-muted-foreground mt-6 p-3 border border-border rounded-md bg-muted/20">
        <div class="font-medium mb-1 flex gap-1 items-center">
          <Icon name="lucide:lightbulb" class="size-3" />
          Tips
        </div>
        <ul class="list-disc list-inside space-y-0.5">
          <li>Use non-greedy quantifiers (*?, +?) to match the shortest possible string</li>
          <li>Lookahead and lookbehind don't consume characters - they only assert</li>
          <li>Named groups make patterns more readable and maintainable</li>
          <li>Escape special characters (. * + ? ^ $ { } [ ] \ | ( )) with backslash</li>
        </ul>
      </div>
    </div>
  )
}
