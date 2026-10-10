import type { PresetWind4Theme } from '@subf/unocss'
import {
  defineConfig,
  presetCompletion,
  presetIcons,
  presetWind4,
  transformerVariantGroup,
} from '@subf/unocss'
import { presetMoraine } from 'moraine/unocss'
// import { presetAnimations } from 'unocss-preset-animations'

const windPreset = presetWind4({
  preflights: { theme: 'on-demand' },
})

export default defineConfig<PresetWind4Theme>({
  presets: [
    windPreset,
    presetIcons({
      scale: 1.2,
    }),
    presetCompletion(),
    presetMoraine({
      override: {
        light: {
          colors: {
            background: 'rgb(248, 247, 244)',
            foreground: 'rgb(26, 31, 46)',
            card: { base: 'rgb(250, 250, 248)', foreground: 'rgb(26, 31, 46)' },
            popover: { base: 'rgb(250, 250, 250)', foreground: 'rgb(26, 31, 46)' },
            primary: { base: 'rgb(124, 144, 130)', foreground: 'rgb(239, 246, 241)' },
            secondary: { base: 'rgb(153, 165, 120)', foreground: 'rgb(238, 241, 239)' },
            muted: { base: 'rgb(232, 230, 225)', foreground: 'rgb(107, 114, 128)' },
            accent: { base: 'rgb(215, 219, 223)', foreground: 'rgb(26, 31, 46)' },
            destructive: { base: 'rgb(173, 84, 81)', foreground: 'rgb(232, 232, 232)' },
            border: 'rgb(232, 230, 225)',
            input: 'rgb(252, 252, 252)',
            control: 'rgb(252, 252, 252)',
            ring: 'rgb(124, 144, 130)',
          },
        },
        dark: {
          colors: {
            background: 'rgb(37, 39, 38)',
            foreground: 'rgb(220, 220, 220)',
            card: { base: 'rgb(42, 45, 43)', foreground: 'rgb(220, 220, 220)' },
            popover: { base: 'rgb(51, 51, 51)', foreground: 'rgb(220, 220, 220)' },
            primary: { base: 'rgb(124, 144, 130)', foreground: 'rgb(235, 239, 236)' },
            secondary: { base: 'rgb(77, 91, 81)', foreground: 'rgb(219, 225, 221)' },
            muted: { base: 'rgb(56, 61, 58)', foreground: 'rgb(173, 173, 173)' },
            accent: { base: 'rgb(96, 112, 118)', foreground: 'rgb(217, 220, 227)' },
            destructive: { base: 'rgb(149, 92, 92)', foreground: 'rgb(234, 234, 234)' },
            border: 'rgb(79, 79, 79)',
            input: 'rgb(65, 65, 65)',
            control: 'rgb(65, 65, 65)',
            ring: 'rgb(192, 192, 192)',
          },
        },
      },
    }),
  ],
  content: {
    // Extract before the first CSS response; lazy routes and cached dependencies may skip transforms.
    filesystem: ['src/**/*.{ts,tsx}', 'node_modules/moraine/dist/**/*.{mjs,jsx}'],
    pipeline: {
      include: [/\.(?:mjs|js|ts|jsx|tsx|mdx?|html)(?:\?|$)/],
    },
  },
  rules: [
    [
      'bg-gutter-pattern',
      {
        'background-image':
          'repeating-linear-gradient(135deg, var(--muted) 0 1px, transparent 1px 16px)',
      },
    ],
  ],
  shortcuts: [
    ['effect-fv', 'outline-none border-ring ring-3 ring-ring/50'],
    ['effect-dis', 'pointer-events-none opacity-70 cursor-not-allowed'],
    ['border', 'b-1 b-border'],
    ['tool-grid', 'gap-6 grid grid-cols-1 items-start xl:grid-cols-2 [&>*]:min-w-0'],
    ['tool-field', 'flex min-w-0 flex-col gap-2'],
    ['tool-panel-heading', 'flex min-h-9 flex-wrap gap-2 items-center justify-between'],
    [
      'tool-editor',
      'text-sm leading-5 font-mono px-3 py-2.5 h-64 w-full resize-y rounded-md sm:h-[300px]',
    ],
    ['tool-actions', 'flex flex-wrap gap-2 items-center'],
    [
      'tool-controls',
      '[&_[data-slot=button]]:rounded-md [&_[data-slot=dialog-trigger]]:min-h-11 md:[&_[data-slot=dialog-trigger]]:min-h-8 [&_[data-slot=tabs-trigger]]:min-h-11 md:[&_[data-slot=tabs-trigger]]:min-h-8',
    ],
    ['tool-editor-grid', 'grid grid-cols-1 gap-4 items-start md:grid-cols-2 [&>*]:min-w-0'],
    ['tool-toolbar', 'flex flex-wrap gap-3 items-center'],
    [
      'tool-option-controls',
      [
        '[&_[data-slot=switch]]:items-center',
        ...[
          'input',
          'input-number',
          'select-control',
          'multi-select-control',
          'slider',
          'switch',
        ].flatMap((slot) => [
          `[&_[data-slot=${slot}]]:min-h-11`,
          `md:[&_[data-slot=${slot}]]:min-h-8`,
        ]),
      ].join(' '),
    ],
  ],
  theme: {
    colors: {
      sidebar: {
        DEFAULT: 'var(--sidebar)',
        foreground: 'var(--sidebar-foreground)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--sidebar-accent)',
        'accent-foreground': 'var(--sidebar-accent-foreground)',
      },
    },
    font: {
      mono: 'Maple Mono, Maple Mono NF, Maple Mono NF CN, Menlo, Consolas, monospace',
    },
    animation: {
      keyframes: {
        flashing: '{ from, to { opacity: 0 } 50% { opacity: 1 } }',
      },
      timingFns: {
        flashing: 'ease-in',
      },
      durations: {
        flashing: '2s',
      },
      counts: {
        flashing: 'infinite',
      },
    },
  },
  transformers: [transformerVariantGroup()],
  preflights: [
    {
      getCSS: () => `:root {
  color-scheme: light;
  --sidebar: rgb(250, 250, 248);
  --sidebar-foreground: rgb(26, 31, 46);
  --sidebar-accent: rgb(232, 230, 225);
  --sidebar-accent-foreground: rgb(26, 31, 46);
}

.dark {
  color-scheme: dark;
  --sidebar: rgb(44, 48, 45);
  --sidebar-foreground: rgb(211, 213, 211);
  --sidebar-accent: rgb(64, 69, 66);
  --sidebar-accent-foreground: rgb(211, 213, 211);
}

body {
  background-color: var(--background);
  color: var(--foreground);
  line-height: 1.5;
}

::selection {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

input, textarea, [contenteditable="true"] {
  caret-color: var(--primary);
}`,
    },
  ],
})
