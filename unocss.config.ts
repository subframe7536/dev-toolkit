import type { PresetWind4Theme } from 'unocss'

import { presetIcons, presetWind4, transformerVariantGroup } from 'unocss'
import { presetAnimations } from 'unocss-preset-animations'
import { presetClassCompletion } from 'unocss-preset-completion'
import { defineConfig } from 'unocss/vite'

import { presetThemeTW4 } from './unocss-preset-theme'

const radius = '0.5rem'

export default defineConfig<PresetWind4Theme>({
  presets: [
    presetWind4({
      preflights: { theme: 'on-demand' },
    }),
    presetIcons({
      scale: 1.2,
    }),
    presetClassCompletion({
      autocompleteFunctions: ['cls', 'clsv'],
    }),
    presetAnimations(),
    presetThemeTW4(),
  ],
  shortcuts: [
    ['effect-fv', 'outline-none ring-1.5 ring-ring ring-offset-(2 background)'],
    ['effect-dis', 'pointer-events-none opacity-70 cursor-not-allowed'],
    [/activor:(.*)/, ([, cls]) => `hover:${cls} active:${cls}`],
  ],
  theme: {
    font: {
      mono: 'Maple Mono, Maple Mono NF, Maple Mono NF CN, Menlo, Consolas, monospace',
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
