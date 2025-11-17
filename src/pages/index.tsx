import { Card } from '#/components/card'
import { A } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { For } from 'solid-js'

export default createRoute({
  component: Index,
})

interface ToolCategory {
  title: string
  description: string
  tools: Array<{
    name: string
    description: string
    href: string
    icon?: string
  }>
}

const toolCategories: ToolCategory[] = [
  {
    title: 'JSON Tools',
    description: 'Format, validate, and manipulate JSON data',
    tools: [
      { name: 'JSON Formatter', description: 'Format and pretty-print JSON', href: '/json/formatter' },
      { name: 'JSON Validator', description: 'Validate JSON against schema', href: '/json/validator' },
      { name: 'JSON Path', description: 'Query JSON with JSONPath', href: '/json/path' },
      { name: 'JSON Converter', description: 'Convert between JSON, CSV, YAML', href: '/json/converter' },
    ],
  },
  {
    title: 'Encoding',
    description: 'Encode and decode various formats',
    tools: [
      { name: 'Base64', description: 'Encode/decode Base64 strings', href: '/encode/base64' },
      { name: 'URL Encoding', description: 'URL encode/decode strings', href: '/encode/url' },
      { name: 'Hex', description: 'Hexadecimal encoding/decoding', href: '/encode/hex' },
      { name: 'HTML Entities', description: 'Encode/decode HTML entities', href: '/encode/html' },
    ],
  },
  {
    title: 'Cryptography',
    description: 'Hash and encrypt data',
    tools: [
      { name: 'MD5 Hash', description: 'Generate MD5 hashes', href: '/crypto/md5' },
      { name: 'AES Encryption', description: 'AES encryption/decryption', href: '/crypto/aes' },
      { name: 'RSA Encryption', description: 'RSA key generation and encryption', href: '/crypto/rsa' },
    ],
  },
  {
    title: 'Color Tools',
    description: 'Work with colors and color formats',
    tools: [
      { name: 'Color Picker', description: 'Pick colors from palette', href: '/color/picker' },
      { name: 'Color Converter', description: 'Convert between color formats', href: '/color/converter' },
      { name: 'Color Palette', description: 'Generate color palettes', href: '/color/palette' },
    ],
  },
  {
    title: 'Utilities',
    description: 'Various development utilities',
    tools: [
      { name: 'RegExp Tester', description: 'Test regular expressions', href: '/utils/regexp' },
      { name: 'UUID Generator', description: 'Generate UUIDs', href: '/utils/uuid' },
      { name: 'QR Code', description: 'Generate QR codes', href: '/utils/qrcode' },
      { name: 'Text Diff', description: 'Compare text differences', href: '/utils/diff' },
    ],
  },
  {
    title: 'SQL Tools',
    description: 'Work with SQL and databases',
    tools: [
      { name: 'SQL Formatter', description: 'Format SQL queries', href: '/sql/formatter' },
      { name: 'MyBatis Params', description: 'Convert MyBatis parameters', href: '/sql/mybatis' },
      { name: 'Data Converter', description: 'Convert between SQL and other formats', href: '/sql/converter' },
    ],
  },
]

function Index() {
  return (
    <div class="flex flex-col gap-8 items-center">
      <div>
        <h1 class="text-4xl text-foreground tracking-tight font-bold sm:text-5xl">
          Developer Toolkit
        </h1>
        <p class="text-lg text-muted-foreground mt-4">
          A collection of essential tools for developers
        </p>
      </div>

      <div class="gap-8 grid lg:grid-cols-2 xl:grid-cols-4">
        <For each={toolCategories}>
          {category => (
            <Card
              title={category.title}
              description={category.description}
              content={(
                <For each={category.tools}>
                  {tool => (
                    <A
                      href={tool.href}
                      class="p-3 rounded-md block transition-colors hover:(text-accent-foreground bg-accent)"
                    >
                      <div class="font-medium">{tool.name}</div>
                      <div class="text-sm text-muted-foreground">{tool.description}</div>
                    </A>
                  )}
                </For>
              )}
            />
          )}
        </For>
      </div>

      <div class="p-8 text-center border border-border rounded-lg bg-card">
        <h3 class="text-lg text-card-foreground font-semibold">
          More tools coming soon
        </h3>
        <p class="text-(sm muted-foreground) mt-2">
          This toolkit is actively being developed with new features added regularly.
        </p>
      </div>
    </div>
  )
}
