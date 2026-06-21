import { resolve } from 'node:path'

import unocss from '@subf/unocss/vite'
import { fileRouter } from 'solid-file-router/plugin'
import { defineConfig } from 'vite'
import { meta } from 'vite-plugin-meta-tags'
import solid from 'vite-plugin-solid'

import { manualPwa } from './vite.pwa'

// const base = '/dev-toolkit'
const base = ''

const title = 'Dev Toolkit'
const description = 'Tools for developers, just in browser'
const url = 'https://tool.subf.dev'
export default defineConfig({
  base,
  resolve: {
    alias: {
      '#': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    unocss({ inspector: false }),
    solid(),
    fileRouter({
      infoDts: {
        title: 'string',
        description: 'string',
        category: '"Encoding" | "JSON" | "Utilities"',
        // oxlint-disable-next-line no-template-curly-in-string
        icon: '`lucide:${string}`',
        tags: 'string[]',
      },
    }),
    meta({
      title,
      description,
      url,
      img: `${url}/og-image.jpg`,
    }),
    manualPwa({
      name: title,
      shortName: title.replaceAll(' ', ''),
      description,
    }),
  ],
})
