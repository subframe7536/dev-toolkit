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

import { presetThemeTW4 } from './unocss-preset-theme'

export default defineConfig<PresetWind4Theme>({
  presets: [
    presetWind4({
      preflights: { theme: 'on-demand' },
    }),
    presetIcons({
      scale: 1.2,
    }),
    presetCompletion(),
    // presetAnimations(),
    presetThemeTW4() as any,
    presetMoraine(),
  ],
  shortcuts: [
    ['effect-fv', 'outline-none ring-1.5 ring-ring ring-offset-(2 background)'],
    ['effect-dis', 'pointer-events-none opacity-70 cursor-not-allowed'],
    [/activor:(.*)/, ([, cls]) => `hover:${cls} active:${cls}`],
    ['border', 'b-1 b-border'],
  ],
  theme: {
    font: {
      mono: 'Maple Mono, Maple Mono NF, Maple Mono NF CN, Menlo, Consolas, monospace',
    },
    animation: {
      keyframes: {
        'accordion-down':
          '{ from { height: 0 } to { height: var(--kb-accordion-content-height) } }',
        'accordion-up': '{ from { height: var(--kb-accordion-content-height) } to { height: 0 } }',
        flashing: '{ from, to { opacity: 0 } 50% { opacity: 1 } }',
      },
      timingFns: {
        'accordion-down': 'ease-in-out',
        'accordion-up': 'ease-in-out',
        flashing: 'ease-in',
      },
      durations: {
        'accordion-down': '0.3s',
        'accordion-up': '0.3s',
        flashing: '2s',
      },
      counts: {
        flashing: 'infinite',
      },
    },
  },
  transformers: [transformerVariantGroup() as any],
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
