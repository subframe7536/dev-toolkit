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
      enableComponentLayer: true,
    }),
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
  --background: #f8f7f4;
  --foreground: #1a1f2e;
  --card: #fafaf8;
  --card-foreground: #1a1f2e;
  --popover: #fafafa;
  --popover-foreground: #1a1f2e;
  --primary: #7c9082;
  --primary-foreground: #eff6f1;
  --secondary: #99a578;
  --secondary-foreground: #eef1ef;
  --muted: #e8e6e1;
  --muted-foreground: #6b7280;
  --accent: #d7dbdf;
  --accent-foreground: #1a1f2e;
  --destructive: #ad5451;
  --destructive-foreground: #e8e8e8;
  --border: #e8e6e1;
  --input: #fcfcfc;
  --ring: #7c9082;
  --chart-1: #7c9082;
  --chart-2: #a0aa88;
  --chart-3: #8b9d83;
  --chart-4: #6b7280;
  --chart-5: #e8e6e1;
  --sidebar: #fafaf8;
  --sidebar-foreground: #1a1f2e;
  --sidebar-primary: #7c9082;
  --sidebar-primary-foreground: #fff;
  --sidebar-accent: #e8e6e1;
  --sidebar-accent-foreground: #1a1f2e;
  --sidebar-border: #e8e6e1;
  --sidebar-ring: #7c9082;
  --radius: .5rem
}

.dark {
  --background: #252726;
  --foreground: #dcdcdc;
  --card: #2a2d2b;
  --card-foreground: #dcdcdc;
  --popover: #333;
  --popover-foreground: #dcdcdc;
  --primary: #7c9082;
  --primary-foreground: #ebefec;
  --secondary: #4d5b51;
  --secondary-foreground: #dbe1dd;
  --muted: #383d3a;
  --muted-foreground: #adadad;
  --accent: #607076;
  --accent-foreground: #d9dce3;
  --destructive: #955c5c;
  --destructive-foreground: #eaeaea;
  --border: #4f4f4f;
  --input: #414141;
  --ring: silver;
  --chart-1: #efefef;
  --chart-2: #d0d0d0;
  --chart-3: #b0b0b0;
  --chart-4: #909090;
  --chart-5: #707070;
  --sidebar: #2c302d;
  --sidebar-foreground: #d3d5d3;
  --sidebar-primary: #7c9082;
  --sidebar-primary-foreground: #212121;
  --sidebar-accent: #404542;
  --sidebar-accent-foreground: #d3d5d3;
  --sidebar-border: #65766a;
  --sidebar-ring: silver;
  --radius: .5rem
}

body {
  background-color: var(--background);
  color: var(--foreground);
}`,
    },
  ],
})
