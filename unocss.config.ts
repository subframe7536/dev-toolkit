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
    presetMoraine(),
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
          'repeating-linear-gradient(135deg, color-mix(in srgb, var(--border) 50%, transparent) 0 1px, transparent 1px 8px)',
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
      '[&_[data-slot=button]]:min-h-11 [&_[data-slot=button]]:min-w-11 [&_[data-slot=button]]:rounded-md md:[&_[data-slot=button]]:min-h-8 md:[&_[data-slot=button]]:min-w-8 [&_[data-slot=dialog-trigger]]:min-h-11 md:[&_[data-slot=dialog-trigger]]:min-h-8 [&_[data-slot=tabs-trigger]]:min-h-11 md:[&_[data-slot=tabs-trigger]]:min-h-8',
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
        DEFAULT: 'var(--card)',
        foreground: 'var(--card-foreground)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
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
}

.dark {
  color-scheme: dark;
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
