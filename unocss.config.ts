import type { PresetWind4Theme } from 'unocss'

import { presetIcons, presetWind4, transformerVariantGroup } from 'unocss'
import { presetAnimations } from 'unocss-preset-animations'
import { presetCompletion } from 'unocss-preset-completion'
import { theme } from 'unocss/preset-wind4'
import { defineConfig } from 'unocss/vite'
const radius = '0.5rem'
export default defineConfig<PresetWind4Theme>({
  presets: [
    presetWind4({
      preflights: { theme: 'on-demand' },
    }),
    presetIcons({
      scale: 1.2,
    }),
    presetCompletion({
      autocompleteFunctions: ['cls', 'clsv'],
    }),
    presetAnimations(),
  ],
  shortcuts: [
    ['effect-fv', 'outline-none ring-1.5 ring-ring ring-offset-(2 background)'],
    ['effect-dis', 'pointer-events-none opacity-50 cursor-not-allowed'],
    [/activor:(.*)/, ([, cls]) => `hover:${cls} active:${cls}`],
  ],
  theme: {
    colors: {
      border: theme.colors.slate[500],
      input: theme.colors.slate[400],
      background: theme.colors.slate[50],
      ring: theme.colors.slate[600],
      foreground: theme.colors.slate[900],
      note: theme.colors.slate[700],
      primary: {
        DEFAULT: 'hsl(202 64% 80%)',
        foreground: 'hsl(202 47% 12%)',
      },
      secondary: {
        DEFAULT: 'hsl(140 28% 72%)',
        alt: 'hsl(140 16% 64%)',
        foreground: 'hsl(140 40% 20%)',
      },
      muted: {
        DEFAULT: 'hsl(202 20% 30%)',
        foreground: 'hsl(202 30% 88%)',
      },
      accent: {
        DEFAULT: 'hsl(32 90% 85%)',
        foreground: 'hsl(202 33% 18%)',
      },
      sidebar: {
        DEFAULT: theme.colors.slate[100],
        foreground: theme.colors.slate[800],
        border: theme.colors.slate[500],
        ring: theme.colors.slate[200],
        accent: {
          DEFAULT: theme.colors.slate[400],
          foreground: theme.colors.slate[900],
        },
      },
    },
    radius: {
      xl: `calc(${radius} + 4px)`,
      lg: radius,
      md: `calc(${radius} - 2px)`,
      sm: `calc(${radius} - 4px)`,
    },
    animation: {
      keyframes: {
        'accordion-down': '{ from { height: 0 } to { height: var(--kb-accordion-content-height) } }',
        'accordion-up': '{ from { height: var(--kb-accordion-content-height) } to { height: 0 } }',
        'flashing': '{ from, to { opacity: 0 } 50% { opacity: 1 } }',
      },
      timingFns: {
        'accordion-down': 'ease-in-out',
        'accordion-up': 'ease-in-out',
        'flashing': 'ease-in',
      },
      durations: {
        'accordion-down': '0.3s',
        'accordion-up': '0.3s',
        'flashing': '2s',
      },
      counts: {
        flashing: 'infinite',
      },
    },
  },
  transformers: [transformerVariantGroup()],
  extractors: [
    {
      name: 'extract-icons',
      extract({ extracted }) {
        const arr: string[] = []
        for (const item of extracted) {
          if (item.startsWith('lucide')) {
            extracted.delete(item)
            arr.push(`i-${item}`)
          }
        }
        return arr.length ? arr : undefined
      },
    },
  ],
})
