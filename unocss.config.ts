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

export default defineConfig<PresetWind4Theme>({
  presets: [
    presetWind4({
      preflights: { theme: 'on-demand' },
    }),
    presetIcons({
      scale: 1.2,
    }),
    presetCompletion(),
    presetMoraine({
      themeDefaults: false,
    }),
  ],
  content: {
    pipeline: {
      include: [/\.(?:mjs|js|ts|jsx|tsx|mdx?|html)(?:\?|$)/],
    },
  },
  rules: [
    // Moraine shares the input token between borders and fills; keep their contrast independent.
    ['bg-input/30', { 'background-color': 'var(--input-background)' }],
  ],
  shortcuts: [
    ['effect-fv', 'outline-none ring-1.5 ring-ring ring-offset-(2 background)'],
    ['effect-dis', 'pointer-events-none opacity-70 cursor-not-allowed'],
    [/activor:(.*)/, ([, cls]) => `hover:${cls} active:${cls}`],
    ['border', 'b-1 b-border'],
    ['tool-grid', 'gap-6 grid grid-cols-1 items-start xl:grid-cols-2 [&>*]:min-w-0'],
    ['tool-field', 'flex min-w-0 flex-col gap-2'],
    ['tool-panel-heading', 'flex min-h-9 flex-wrap gap-2 items-center justify-between'],
    ['tool-editor', 'text-sm leading-relaxed font-mono h-64 w-full resize-y sm:h-88'],
    ['tool-actions', 'flex flex-wrap gap-2 items-center'],
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
  --background: #f6f7f3;
  --foreground: #202c25;
  --card: #ffffff;
  --card-foreground: #202c25;
  --popover: #ffffff;
  --popover-foreground: #202c25;
  --primary: #2c6650;
  --primary-foreground: #ffffff;
  --primary-hover: #245840;
  --primary-active: #1c4935;
  --secondary: #e0ebe4;
  --secondary-foreground: #204c39;
  --muted: #e8ede8;
  --muted-foreground: #526158;
  --accent: #e0ebe4;
  --accent-foreground: #204c39;
  --destructive: #b23c3c;
  --destructive-foreground: #ffffff;
  --destructive-hover: #9d3030;
  --destructive-active: #862828;
  --border: #ccd6ce;
  --input: #7b8c81;
  --input-background: #eef2ee;
  --ring: #2c6650;
  --sidebar: #edf1eb;
  --sidebar-foreground: #283c30;
  --sidebar-muted-foreground: #526458;
  --sidebar-accent: #dbe9df;
  --sidebar-accent-foreground: #1f513b;
  --radius: .5rem
}

.dark {
  color-scheme: dark;
  --background: #18211d;
  --foreground: #e7eee8;
  --card: #202b25;
  --card-foreground: #e7eee8;
  --popover: #27362d;
  --popover-foreground: #e7eee8;
  --primary: #93cbb1;
  --primary-foreground: #14281e;
  --primary-hover: #a6d7bf;
  --primary-active: #b8e2ce;
  --secondary: #30483c;
  --secondary-foreground: #e7f4ec;
  --muted: #2b3630;
  --muted-foreground: #afbeb5;
  --accent: #30483c;
  --accent-foreground: #e7f4ec;
  --destructive: #f09a91;
  --destructive-foreground: #321916;
  --destructive-hover: #f4afa8;
  --destructive-active: #f7c1bb;
  --border: #45594c;
  --input: #758a7c;
  --input-background: #202b25;
  --ring: #93cbb1;
  --sidebar: #1c2821;
  --sidebar-foreground: #e0ebe2;
  --sidebar-muted-foreground: #a4b9aa;
  --sidebar-accent: #304e3e;
  --sidebar-accent-foreground: #d8f2e2;
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
}

input::placeholder, textarea::placeholder {
  color: var(--muted-foreground);
  opacity: 1;
}`,
    },
  ],
})
