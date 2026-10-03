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
      themeDefaults: false,
      override: {
        light: {
          // Moraine's shadow tokens must resolve for the composed focus ring to render.
          shadows: Object.fromEntries(
            Object.entries(windPreset.theme?.shadow ?? {}).map(([name, value]) => [
              name === 'DEFAULT' ? 'base' : name,
              Array.isArray(value) ? value.join(', ') : value,
            ]),
          ),
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
    // Moraine shares the input token between borders and fills; keep their contrast independent.
    ['bg-input/30', { 'background-color': 'var(--input-background)' }],
  ],
  shortcuts: [
    ['effect-fv', 'outline-none border-ring ring-3 ring-ring/50'],
    ['effect-dis', 'pointer-events-none opacity-70 cursor-not-allowed'],
    [/activor:(.*)/, ([, cls]) => `hover:${cls} active:${cls}`],
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
  ],
  theme: {
    colors: {
      sidebar: {
        DEFAULT: 'var(--sidebar)',
        foreground: 'var(--sidebar-foreground)',
        'muted-foreground': 'var(--sidebar-muted-foreground)',
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
  --background: #ffffff;
  --foreground: #171717;
  --card: #ffffff;
  --card-foreground: #171717;
  --popover: #ffffff;
  --popover-foreground: #171717;
  --primary: #171717;
  --primary-foreground: #ffffff;
  --primary-hover: #303030;
  --primary-active: #454545;
  --secondary: #f0f0f0;
  --secondary-foreground: #262626;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --accent: #f0f0f0;
  --accent-foreground: #262626;
  --destructive: #b23c3c;
  --destructive-foreground: #ffffff;
  --destructive-hover: #9d3030;
  --destructive-active: #862828;
  --border: #e5e5e5;
  --input: #8a8a8a;
  --input-background: #fafafa;
  --ring: #171717;
  --sidebar: #fafafa;
  --sidebar-foreground: #171717;
  --sidebar-muted-foreground: #666666;
  --sidebar-accent: #f0f0f0;
  --sidebar-accent-foreground: #171717;
  --radius: .5rem
}

.dark {
  color-scheme: dark;
  --background: #101010;
  --foreground: #ededed;
  --card: #171717;
  --card-foreground: #ededed;
  --popover: #1c1c1c;
  --popover-foreground: #ededed;
  --primary: #ededed;
  --primary-foreground: #171717;
  --primary-hover: #d4d4d4;
  --primary-active: #bdbdbd;
  --secondary: #262626;
  --secondary-foreground: #ededed;
  --muted: #222222;
  --muted-foreground: #a3a3a3;
  --accent: #262626;
  --accent-foreground: #ededed;
  --destructive: #f09a91;
  --destructive-foreground: #321916;
  --destructive-hover: #f4afa8;
  --destructive-active: #f7c1bb;
  --border: #333333;
  --input: #737373;
  --input-background: #171717;
  --ring: #ededed;
  --sidebar: #171717;
  --sidebar-foreground: #ededed;
  --sidebar-muted-foreground: #a3a3a3;
  --sidebar-accent: #262626;
  --sidebar-accent-foreground: #ededed;
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
